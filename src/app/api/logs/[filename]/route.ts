import { NextRequest, NextResponse } from "next/server";

const OWNER = process.env.GITHUB_OWNER!;
const REPO  = process.env.GITHUB_REPO!;
const TOKEN = process.env.GITHUB_TOKEN!;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/logs/${filename}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 404 });
  }
  const text = await res.text();
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
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

  const metaRes = await fetch(`${BASE}/contents/logs/${filename}`, { headers, cache: "no-store" });
  if (!metaRes.ok) {
    return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 404 });
  }
  const { sha } = await metaRes.json();

  const delRes = await fetch(`${BASE}/contents/logs/${filename}`, {
    method: "DELETE",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ message: `logs/${filename} を削除 (Web UI)`, sha }),
  });

  if (delRes.ok) return NextResponse.json({ message: "削除しました" });
  return NextResponse.json({ message: "削除に失敗しました" }, { status: 500 });
}
