"use client";

import { useEffect, useState } from "react";

export default function DownloadPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [logFiles, setLogFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadFiles = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/download").then((r) => r.json()),
      fetch("/api/logs").then((r) => r.json()),
    ])
      .then(([dl, lg]) => {
        setFiles(dl.files ?? []);
        setLogFiles(lg.files ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadFiles(); }, []);

  const handleDelete = async (filename: string) => {
    if (!confirm(`「${filename}」を削除しますか？`)) return;
    setDeleting(filename);
    const res = await fetch(`/api/download/${encodeURIComponent(filename)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    alert(data.message);
    setDeleting(null);
    if (res.ok) loadFiles();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-green-800">ダウンロード</h1>

      {/* CSV / Excel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-green-800 mb-4">📄 CSV / Excel</h2>
        {loading ? (
          <p className="text-gray-500">読み込み中...</p>
        ) : files.length === 0 ? (
          <p className="text-gray-500">ファイルがありません</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-green-50 text-green-900">
              <tr>
                <th className="text-left px-4 py-3">ファイル名</th>
                <th className="text-left px-4 py-3 w-24">種類</th>
                <th className="text-left px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{f}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      f.endsWith(".xlsx")
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {f.endsWith(".xlsx") ? "Excel" : "CSV"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    <a
                      href={`/api/download/${encodeURIComponent(f)}`}
                      download={f}
                      className="text-green-700 hover:underline"
                    >
                      ダウンロード
                    </a>
                    <button
                      onClick={() => handleDelete(f)}
                      disabled={deleting === f}
                      className="text-red-500 hover:underline disabled:opacity-50"
                    >
                      {deleting === f ? "削除中..." : "削除"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* エラーログ */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-green-800 mb-4">📋 エラーログ</h2>
        {loading ? (
          <p className="text-gray-500">読み込み中...</p>
        ) : logFiles.length === 0 ? (
          <p className="text-gray-500">ログファイルがありません（クローラー実行後に表示されます）</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-4 py-3">ファイル名</th>
                <th className="text-left px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {logFiles.map((f) => (
                <tr key={f} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{f}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/api/logs/${encodeURIComponent(f)}`}
                      download={f}
                      className="text-green-700 hover:underline"
                    >
                      ダウンロード
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
