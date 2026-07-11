import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;

  const batch = await db.importBatch.findUnique({ where: { id: batchId } });
  if (!batch) {
    return NextResponse.json({ error: "Import introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    status: batch.status,
    progress: batch.progressJson ? JSON.parse(batch.progressJson) : null,
    report: batch.reportJson ? JSON.parse(batch.reportJson) : null,
  });
}
