import { NextRequest, NextResponse } from "next/server";
import { fetchCurrentModel, updateModel } from "@/lib/github";

export async function GET() {
  const info = await fetchCurrentModel();
  if (!info.model) {
    return NextResponse.json({ error: "モデル情報の取得に失敗しました" }, { status: 500 });
  }
  return NextResponse.json(info);
}

export async function POST(req: NextRequest) {
  const { model } = await req.json().catch(() => ({}));
  if (!model || typeof model !== "string") {
    return NextResponse.json({ error: "model が指定されていません" }, { status: 400 });
  }
  const ok = await updateModel(model);
  if (ok) return NextResponse.json({ message: `モデルを ${model} に変更しました` });
  return NextResponse.json({ error: "モデルの変更に失敗しました" }, { status: 500 });
}
