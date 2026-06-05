import { NextRequest, NextResponse } from "next/server";
import { fetchArticlesFromFile, fetchLatestArticles, listCsvFiles } from "@/lib/github";

export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get("file");
  const [articles, files] = await Promise.all([
    filename ? fetchArticlesFromFile(filename) : fetchLatestArticles(),
    listCsvFiles(),
  ]);
  const csvFiles = files.filter((f) => f.endsWith(".csv"));
  return NextResponse.json({ articles, files: csvFiles });
}
