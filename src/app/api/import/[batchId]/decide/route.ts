import fs from "node:fs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { finalizeBatch, isImportActive, restoreBackupAndExit } from "@/lib/import/backup";

export async function POST(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action !== "keep" && action !== "rollback") {
    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  }

  const batch = await db.importBatch.findUnique({ where: { id: batchId } });
  if (!batch) {
    return NextResponse.json({ error: "Import introuvable." }, { status: 404 });
  }

  const isDecidable =
    (batch.status === "DONE" || (batch.status === "RUNNING" && !isImportActive(batchId))) &&
    fs.existsSync(batch.backupPath);

  if (!isDecidable) {
    return NextResponse.json({ error: "Cet import n'est pas dans un état permettant une décision." }, { status: 409 });
  }

  if (action === "keep") {
    await finalizeBatch(batchId);
    return NextResponse.json({ ok: true });
  }

  await restoreBackupAndExit(batchId);
  // unreachable: restoreBackupAndExit terminates the process
  return NextResponse.json({ ok: true });
}
