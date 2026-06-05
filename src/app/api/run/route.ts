import { NextRequest, NextResponse } from "next/server";
import { triggerCrawler, CrawlerOptions } from "@/lib/github";

export async function POST(req: NextRequest) {
  const options: CrawlerOptions = await req.json().catch(() => ({}));
  const ok = await triggerCrawler(options);
  if (ok) return NextResponse.json({ message: "クローラーを起動しました" });
  return NextResponse.json({ message: "起動に失敗しました" }, { status: 500 });
}
