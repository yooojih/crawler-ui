import { NextRequest, NextResponse } from "next/server";
import { fetchArticlesFromFile, fetchLatestArticles, listCsvFiles } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const filename = req.nextUrl.searchParams.get("file");
    const [articles, files] = await Promise.all([
      filename ? fetchArticlesFromFile(filename) : fetchLatestArticles(),
      listCsvFiles(),
    ]);
    const csvFiles = files.filter((f) => f.endsWith(".csv"));
    console.log(`[api/articles] files: ${csvFiles.length}件, articles: ${articles.length}件`);
    return NextResponse.json({ articles, files: csvFiles });
  } catch (e) {
    console.error("[api/articles] エラー:", e);
    return NextResponse.json({ articles: [], files: [], error: String(e) }, { status: 500 });
  }
}
