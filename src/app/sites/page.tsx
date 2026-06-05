"use client";

import { useEffect, useState } from "react";
import type { Site, SiteEntry } from "@/lib/github";

const EMPTY_ENTRY: SiteEntry = { category: "", url: "", js_required: false, active: true };

type EditState = { siteId: string; index: number } | null;
type AddState  = { siteId: string } | null;

export default function SitesPage() {
  const [sites, setSites]     = useState<Site[]>([]);
  const [sha, setSha]         = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  // 編集中の行
  const [editState, setEditState] = useState<EditState>(null);
  const [editEntry, setEditEntry] = useState<SiteEntry>(EMPTY_ENTRY);

  // 追加フォーム
  const [addState, setAddState] = useState<AddState>(null);
  const [addEntry, setAddEntry] = useState<SiteEntry>(EMPTY_ENTRY);

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((d) => { setSites(d.sites ?? []); setSha(d.sha ?? ""); })
      .finally(() => setLoading(false));
  }, []);

  const selectedSite = sites.find((s) => s.id === selected);

  // ─── active トグル ────────────────────────────────────────────────────────
  const toggleActive = (siteId: string, i: number) =>
    setSites((prev) => prev.map((s) =>
      s.id !== siteId ? s : {
        ...s,
        urls: s.urls.map((u, idx) => idx !== i ? u : { ...u, active: !u.active }),
      }
    ));

  // ─── 編集開始 ─────────────────────────────────────────────────────────────
  const startEdit = (siteId: string, i: number, entry: SiteEntry) => {
    setEditState({ siteId, index: i });
    setEditEntry({ ...entry });
    setAddState(null);
  };

  const cancelEdit = () => setEditState(null);

  const commitEdit = () => {
    if (!editState) return;
    setSites((prev) => prev.map((s) =>
      s.id !== editState.siteId ? s : {
        ...s,
        urls: s.urls.map((u, i) => i !== editState.index ? u : { ...editEntry }),
      }
    ));
    setEditState(null);
  };

  // ─── 削除 ─────────────────────────────────────────────────────────────────
  const deleteUrl = (siteId: string, i: number) => {
    if (!confirm("このURLを削除しますか？")) return;
    setSites((prev) => prev.map((s) =>
      s.id !== siteId ? s : { ...s, urls: s.urls.filter((_, idx) => idx !== i) }
    ));
    setEditState(null);
  };

  // ─── 追加 ─────────────────────────────────────────────────────────────────
  const startAdd = (siteId: string) => {
    setAddState({ siteId });
    setAddEntry(EMPTY_ENTRY);
    setEditState(null);
  };

  const cancelAdd = () => setAddState(null);

  const commitAdd = () => {
    if (!addState || !addEntry.url) return;
    setSites((prev) => prev.map((s) =>
      s.id !== addState.siteId ? s : { ...s, urls: [...s.urls, { ...addEntry }] }
    ));
    setAddState(null);
  };

  // ─── 保存 ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/sites", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sites, sha }),
    });
    const data = await res.json();
    setMessage(data.message);
    if (res.ok) {
      fetch("/api/sites").then((r) => r.json()).then((d) => setSha(d.sha ?? ""));
    }
    setSaving(false);
  };

  if (loading) return <p className="text-gray-500">読み込み中...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-green-800 mb-6">自治体管理</h1>
      <div className="flex gap-6">

        {/* 自治体一覧 */}
        <div className="w-56 bg-white rounded-lg shadow overflow-hidden shrink-0">
          <div className="bg-green-50 px-4 py-2 text-sm font-medium text-green-900">
            自治体一覧
          </div>
          <ul className="text-sm divide-y max-h-[600px] overflow-y-auto">
            {sites.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => { setSelected(s.id); setEditState(null); setAddState(null); }}
                  className={`w-full text-left px-4 py-2 hover:bg-green-50 ${
                    selected === s.id ? "bg-green-100 font-medium" : ""
                  }`}
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* URL管理 */}
        <div className="flex-1 min-w-0">
          {!selectedSite ? (
            <p className="text-gray-500 text-sm">左から自治体を選択してください</p>
          ) : (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold text-green-800 mb-4">{selectedSite.name}</h2>
              <table className="w-full text-sm">
                <thead className="bg-green-50 text-green-900">
                  <tr>
                    <th className="text-left px-3 py-2 w-28">カテゴリ</th>
                    <th className="text-left px-3 py-2">URL</th>
                    <th className="text-center px-3 py-2 w-16">JS</th>
                    <th className="text-center px-3 py-2 w-16">有効</th>
                    <th className="px-3 py-2 w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSite.urls.map((u, i) => {
                    const isEditing = editState?.siteId === selectedSite.id && editState?.index === i;
                    return (
                      <tr key={i} className={`border-t ${isEditing ? "bg-yellow-50" : "hover:bg-gray-50"}`}>
                        {isEditing ? (
                          <>
                            <td className="px-2 py-1">
                              <input
                                value={editEntry.category}
                                onChange={(e) => setEditEntry({ ...editEntry, category: e.target.value })}
                                className="border rounded px-2 py-1 w-full text-xs"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                value={editEntry.url}
                                onChange={(e) => setEditEntry({ ...editEntry, url: e.target.value })}
                                className="border rounded px-2 py-1 w-full text-xs"
                              />
                            </td>
                            <td className="px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={editEntry.js_required}
                                onChange={(e) => setEditEntry({ ...editEntry, js_required: e.target.checked })}
                                className="w-4 h-4 accent-green-700"
                              />
                            </td>
                            <td className="px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={editEntry.active}
                                onChange={(e) => setEditEntry({ ...editEntry, active: e.target.checked })}
                                className="w-4 h-4 accent-green-700"
                              />
                            </td>
                            <td className="px-2 py-1 flex gap-1">
                              <button onClick={commitEdit} className="text-xs bg-green-600 text-white px-2 py-1 rounded">確定</button>
                              <button onClick={cancelEdit} className="text-xs bg-gray-300 px-2 py-1 rounded">取消</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 text-gray-600">{u.category}</td>
                            <td className="px-3 py-2">
                              <a href={u.url} target="_blank" rel="noopener noreferrer"
                                className="text-green-700 hover:underline break-all text-xs">
                                {u.url}
                              </a>
                            </td>
                            <td className="px-3 py-2 text-center text-gray-500">{u.js_required ? "✓" : ""}</td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={u.active}
                                onChange={() => toggleActive(selectedSite.id, i)}
                                className="w-4 h-4 accent-green-700"
                              />
                            </td>
                            <td className="px-3 py-2 flex gap-2">
                              <button
                                onClick={() => startEdit(selectedSite.id, i, u)}
                                className="text-xs text-blue-600 hover:underline"
                              >編集</button>
                              <button
                                onClick={() => deleteUrl(selectedSite.id, i)}
                                className="text-xs text-red-500 hover:underline"
                              >削除</button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}

                  {/* 追加フォーム */}
                  {addState?.siteId === selectedSite.id && (
                    <tr className="border-t bg-blue-50">
                      <td className="px-2 py-1">
                        <input
                          placeholder="カテゴリ"
                          value={addEntry.category}
                          onChange={(e) => setAddEntry({ ...addEntry, category: e.target.value })}
                          className="border rounded px-2 py-1 w-full text-xs"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          placeholder="https://..."
                          value={addEntry.url}
                          onChange={(e) => setAddEntry({ ...addEntry, url: e.target.value })}
                          className="border rounded px-2 py-1 w-full text-xs"
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={addEntry.js_required}
                          onChange={(e) => setAddEntry({ ...addEntry, js_required: e.target.checked })}
                          className="w-4 h-4 accent-green-700"
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={addEntry.active}
                          onChange={(e) => setAddEntry({ ...addEntry, active: e.target.checked })}
                          className="w-4 h-4 accent-green-700"
                        />
                      </td>
                      <td className="px-2 py-1 flex gap-1">
                        <button onClick={commitAdd} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">追加</button>
                        <button onClick={cancelAdd} className="text-xs bg-gray-300 px-2 py-1 rounded">取消</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* URL追加ボタン */}
              {addState?.siteId !== selectedSite.id && (
                <button
                  onClick={() => startAdd(selectedSite.id)}
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  ＋ URLを追加
                </button>
              )}
            </div>
          )}

          {/* 保存ボタン */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 disabled:opacity-50 text-sm"
            >
              {saving ? "保存中..." : "変更を保存（GitHub反映）"}
            </button>
            {message && (
              <span className="text-sm text-green-700">{message}</span>
            )}
          </div>

          {/* URL関数の解説メモ */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-gray-700">
            <p className="font-medium text-amber-800 mb-2">📝 URLテンプレート変数について</p>
            <p className="mb-2">月次イベントカレンダーなど、年月がURLに含まれる場合は以下の変数が使えます。</p>
            <table className="text-xs border-collapse">
              <thead>
                <tr className="bg-amber-100">
                  <th className="border border-amber-200 px-3 py-1 text-left">変数</th>
                  <th className="border border-amber-200 px-3 py-1 text-left">内容</th>
                  <th className="border border-amber-200 px-3 py-1 text-left">例（6月実行時）</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["{year}",         "今月の年",       "2026"],
                  ["{month}",        "今月（1桁）",    "6"],
                  ["{month_2}",      "今月（2桁）",    "06"],
                  ["{next_year}",    "翌月の年",       "2026"],
                  ["{next_month}",   "翌月（1桁）",    "7"],
                  ["{next_month_2}", "翌月（2桁）",    "07"],
                ].map(([v, desc, ex]) => (
                  <tr key={v} className="hover:bg-amber-50">
                    <td className="border border-amber-200 px-3 py-1 font-mono text-amber-900">{v}</td>
                    <td className="border border-amber-200 px-3 py-1">{desc}</td>
                    <td className="border border-amber-200 px-3 py-1 text-gray-500">{ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-gray-500">
              例: <span className="font-mono">event{"{next_year}"}{"{next_month_2}"}.html</span> → <span className="font-mono">event202607.html</span>（6月実行時）
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
