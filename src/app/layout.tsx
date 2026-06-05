import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "all62環境イベントクローラー",
  description: "東京都62自治体 環境イベント情報管理システム",
};

const navItems = [
  { href: "/",         label: "記事一覧" },
  { href: "/download", label: "ダウンロード" },
  { href: "/run",      label: "クローラー実行" },
  { href: "/sites",    label: "自治体管理" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <header className="bg-green-700 text-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-8">
            <span className="font-bold text-lg">🌿 all62環境イベントクローラー</span>
            <nav className="flex gap-6 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-green-200 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
