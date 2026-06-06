import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;

  // 環境変数が未設定の場合は認証スキップ（ローカル開発用）
  if (!user || !pass) return NextResponse.next();

  const authorization = req.headers.get("authorization");
  if (authorization) {
    const [scheme, encoded] = authorization.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const [inputUser, inputPass] = decoded.split(":");
      if (inputUser === user && inputPass === pass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("認証が必要です", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="all62環境イベントクローラー"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
