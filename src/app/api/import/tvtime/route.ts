import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActiveProfile } from "@/lib/session";
import { checkpointAndBackup, hasRunningImportBatch, markImportActive, markImportInactive } from "@/lib/import/backup";
import { readZipCsvs, runTvtimeImport, TvtimeZipError } from "@/lib/import/tvtime";

export async function POST(request: Request) {
  const activeProfile = await getActiveProfile();
  if (!activeProfile) {
    return NextResponse.json({ error: "Aucun profil actif." }, { status: 400 });
  }

  if (await hasRunningImportBatch()) {
    return NextResponse.json({ error: "Un import est déjà en cours." }, { status: 409 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
  }

  const zipBuffer = Buffer.from(await file.arrayBuffer());

  try {
    readZipCsvs(zipBuffer);
  } catch (err) {
    if (err instanceof TvtimeZipError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    throw err;
  }

  const batchId = randomUUID();
  const backupPath = await checkpointAndBackup(batchId);

  const batch = await db.importBatch.create({
    data: {
      id: batchId,
      profileId: activeProfile.id,
      backupPath,
      status: "RUNNING",
    },
  });

  markImportActive(batch.id);

  runTvtimeImport(activeProfile.id, zipBuffer, async ({ processed, total }) => {
    await db.importBatch.update({
      where: { id: batch.id },
      data: { progressJson: JSON.stringify({ processed, total }) },
    });
  })
    .then(async (report) => {
      await db.importBatch.update({
        where: { id: batch.id },
        data: {
          status: "DONE",
          reportJson: JSON.stringify(report),
          completedAt: new Date(),
        },
      });
    })
    .catch(async (err) => {
      console.error(`Import TVtime ${batch.id} en échec:`, err);
      await db.importBatch.update({
        where: { id: batch.id },
        data: {
          status: "DONE",
          reportJson: JSON.stringify({ error: (err as Error).message }),
          completedAt: new Date(),
        },
      });
    })
    .finally(() => {
      markImportInactive(batch.id);
    });

  return NextResponse.json({ batchId: batch.id });
}
