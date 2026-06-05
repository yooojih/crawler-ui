import { NextResponse } from "next/server";
import { listCsvFiles } from "@/lib/github";

export async function GET() {
  const files = await listCsvFiles();
  return NextResponse.json({ files });
}
