import "dotenv/config";
import fs from "node:fs";
import { db } from "@/lib/db";
import { runTvtimeImport, TvtimeZipError } from "@/lib/import/tvtime";

async function main() {
  const zipPath = process.argv[2];
  const profileId = process.argv[3] || process.env.PROFILE_ID;

  if (!zipPath || !profileId) {
    console.error(
      "Usage: npx tsx scripts/import-tvtime.ts <chemin-vers-export-tvtime.zip> <profileId>\n" +
        "(ou définir PROFILE_ID dans l'environnement)"
    );
    process.exit(1);
  }

  if (!fs.existsSync(zipPath)) {
    console.error(`Fichier introuvable: ${zipPath}`);
    process.exit(1);
  }

  const zipBuffer = fs.readFileSync(zipPath);

  let report;
  try {
    report = await runTvtimeImport(profileId, zipBuffer, ({ processed, total }) => {
      process.stdout.write(`\rTraitement: ${processed}/${total}`);
    });
  } catch (err) {
    if (err instanceof TvtimeZipError) {
      console.error(`\n${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  await db.$disconnect();

  console.log("\n\n=== Rapport d'import TVtime ===");
  console.log(`Séries matchées: ${report.matched}`);
  console.log(`Séries non matchées: ${report.unmatched}`);

  console.log("\n-- Détail --");
  for (const r of report.series) {
    if (!r.matched) {
      console.log(`[UNMATCHED] ${r.tvtimeName}`);
    } else {
      console.log(
        `[OK] ${r.tvtimeName} -> ${r.tmdbTitle} | méthode: ${r.method} | épisodes importés: ${r.episodesImported} | statut: ${r.status}`
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
