import { NextRequest, NextResponse } from "next/server";
import { fetchSites, updateSites, Site } from "@/lib/github";

export async function GET() {
  const { sites, sha } = await fetchSites();
  return NextResponse.json({ sites, sha });
}

export async function PUT(req: NextRequest) {
  const { sites, sha }: { sites: Site[]; sha: string } = await req.json();
  const ok = await updateSites(sites, sha);
  if (ok) return NextResponse.json({ message: "保存しました" });
  return NextResponse.json({ message: "保存に失敗しました" }, { status: 500 });
}
