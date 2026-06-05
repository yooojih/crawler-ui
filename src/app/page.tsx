"use client";

import { useEffect, useState, useMemo } from "react";
import type { Article } from "@/lib/github";

export default function ArticleListPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [csvFiles, setCsvFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [siteOrder, setSiteOrder] = useState<string[]>([]);

  const loadArticles = (file?: string) => {
    setLoading(true);
    const url = file ? `/api/articles?file=${encodeURIComponent(file)}` : "/api/articles";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles ?? []);
        if (data.files?.length && !selectedFile) {
          setCsvFiles(data.files);
          setSelectedFile(data.files[0] ?? "");
        } else {
          setCsvFiles(data.files ?? []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadArticles();
    fetch("/api/sites")
      .then((r) => r.json())
      .then((d) => setSiteOrder((d.sites ?? []).map((s: { name: string }) => s.name)));
  }, []);

  const handleFileChange = (file: string) => {
    setSelectedFile(file);
    loadArticles(file);
  };

  const municipalities = useMemo(() => {
    const inArticles = new Set(articles.map((a) => a.municipality));
    const ordered = siteOrder.filter((name) => inArticles.has(name));
    const rest = Array.from(inArticles).filter((name) => !siteOrder.includes(name)).sort();
    return [...ordered, ...rest];
  }, [articles, siteOrder]);

  const filtered = useMemo(() => {
    return articles
      .filter((a) => a.is_env)
      .filter((a) => !municipality || a.municipality === municipality)
      .filter((a) => !categoryFilter || a.category === categoryFilter)
      .filter(
        (a) =>
          !query ||
          a.title.includes(query) ||
          a.municipality.includes(query)
      );
  }, [articles, query, municipality, categoryFilter]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-green-800 mb-6">記事一覧</h1>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4">
        {/* ファイル選択 */}
        <select
          value={selectedFile}
          onChange={(e) => handleFileChange(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-52 bg-green-50"
        >
          {csvFiles.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <div className="w-px bg-gray-200" />

        <input
          type="text"
          placeholder="キーワード検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-52"
        />
        <select
          value={municipality}
          onChange={(e) => setMunicipality(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-44"
        >
          <option value="">すべての自治体</option>
          {municipalities.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-36"
        >
          <option value="">すべてのカテゴリ</option>
          <option value="イベント">イベント</option>
          <option value="お知らせ">お知らせ</option>
        </select>
        <span className="text-sm text-gray-500 self-center">
          {filtered.length} 件
        </span>
      </div>

      {/* 記事一覧 */}
      {loading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">記事が見つかりません</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-green-50 text-green-900">
              <tr>
                <th className="text-left px-4 py-3 w-24">自治体</th>
                <th className="text-left px-4 py-3 w-24">カテゴリ</th>
                <th className="text-left px-4 py-3">タイトル</th>
                <th className="text-left px-4 py-3 w-28">日付</th>
                <th className="text-left px-4 py-3 w-28">最終日</th>
                <th className="text-left px-4 py-3 w-28">有効期限</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{a.municipality}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      a.category === "イベント"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {a.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 hover:underline"
                    >
                      {a.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.event_date}</td>
                  <td className="px-4 py-3 text-gray-600">{a.end_date}</td>
                  <td className="px-4 py-3 text-gray-600">{a.expires_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
