import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";

const MAX_BACKUPS = 2;

function dbFilePath(): string {
  const url = process.env.DATABASE_URL ?? "";
  const match = url.match(/^file:(.+)$/);
  if (!match) {
    throw new Error(`DATABASE_URL non supportée pour la sauvegarde: ${url}`);
  }
  // Prisma resolves relative sqlite paths relative to the prisma/ directory, not cwd.
  return path.isAbsolute(match[1]) ? match[1] : path.join(process.cwd(), "prisma", match[1]);
}

function backupDir(): string {
  return path.join(path.dirname(dbFilePath()), "backups");
}

function pruneOldBackups(dir: string) {
  if (!fs.existsSync(dir)) return;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".db"))
    .map((f) => {
      const full = path.join(dir, f);
      return { full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => a.mtime - b.mtime);

  while (files.length >= MAX_BACKUPS) {
    const oldest = files.shift();
    if (oldest) fs.unlinkSync(oldest.full);
  }
}

export async function hasRunningImportBatch(): Promise<boolean> {
  const running = await db.importBatch.findFirst({ where: { status: "RUNNING" } });
  return running !== null;
}

// Stored on globalThis (like the Prisma client in lib/db.ts) so the set is shared
// across route/page module instances within the same process, not just within
// whichever bundle happens to load this file.
const globalForImport = globalThis as unknown as { activeImportBatches?: Set<string> };
const activeImports = globalForImport.activeImportBatches ?? new Set<string>();
globalForImport.activeImportBatches = activeImports;

export function markImportActive(batchId: string) {
  activeImports.add(batchId);
}

export function markImportInactive(batchId: string) {
  activeImports.delete(batchId);
}

export function isImportActive(batchId: string): boolean {
  return activeImports.has(batchId);
}

export async function checkpointAndBackup(batchId: string): Promise<string> {
  await db.$queryRawUnsafe("PRAGMA wal_checkpoint(TRUNCATE)");

  const dir = backupDir();
  fs.mkdirSync(dir, { recursive: true });
  pruneOldBackups(dir);

  const backupPath = path.join(dir, `pre-import-${batchId}.db`);
  fs.copyFileSync(dbFilePath(), backupPath);

  return backupPath;
}

export async function restoreBackupAndExit(batchId: string): Promise<void> {
  const batch = await db.importBatch.findUnique({ where: { id: batchId } });
  if (!batch) {
    throw new Error("Import introuvable.");
  }
  if (!fs.existsSync(batch.backupPath)) {
    throw new Error("Fichier de sauvegarde introuvable, restauration impossible.");
  }

  // The backup snapshot predates this batch's row (see checkpointAndBackup), so
  // restoring it erases the batch entirely — there is no row left to mark
  // ROLLED_BACK once the file is swapped back in.
  fs.copyFileSync(batch.backupPath, dbFilePath());

  process.exit(1);
}

export async function finalizeBatch(batchId: string): Promise<void> {
  const batch = await db.importBatch.findUnique({ where: { id: batchId } });
  if (!batch) {
    throw new Error("Import introuvable.");
  }
  if (fs.existsSync(batch.backupPath)) {
    fs.unlinkSync(batch.backupPath);
  }
  await db.importBatch.update({
    where: { id: batchId },
    data: { status: "DONE", completedAt: batch.completedAt ?? new Date() },
  });
}
