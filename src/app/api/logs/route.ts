import { NextResponse } from "next/server";

const OWNER = process.env.GITHUB_OWNER!;
const REPO  = process.env.GITHUB_REPO!;
const TOKEN = process.env.GITHUB_TOKEN!;

const headers = () => ({
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

export async function GET() {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/logs`,
    { headers: headers(), cache: "no-store" }
  );
  if (!res.ok) return NextResponse.json({ files: [] });
  const files: { name: string }[] = await res.json();
  const logs = files
    .map((f) => f.name)
    .filter((n) => n.endsWith(".log"))
    .sort()
    .reverse();
  return NextResponse.json({ files: logs });
}
