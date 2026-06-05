import { NextRequest, NextResponse } from "next/server";

const OWNER = process.env.GITHUB_OWNER!;
const REPO  = process.env.GITHUB_REPO!;
const TOKEN = process.env.GITHUB_TOKEN!;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/output/${filename}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 404 });
  }

  const buffer = await res.arrayBuffer();
  const isXlsx = filename.endsWith(".xlsx");
  const contentType = isXlsx
    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    : "text/csv; charset=utf-8";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // ファイルのSHAを取得
  const metaRes = await fetch(`${BASE}/contents/output/${filename}`, { headers, cache: "no-store" });
  if (!metaRes.ok) {
    return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 404 });
  }
  const { sha } = await metaRes.json();

  // ファイル削除
  const delRes = await fetch(`${BASE}/contents/output/${filename}`, {
    method: "DELETE",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ message: `output/${filename} を削除 (Web UI)`, sha }),
  });

  if (delRes.ok) return NextResponse.json({ message: "削除しました" });
  return NextResponse.json({ message: "削除に失敗しました" }, { status: 500 });
}
