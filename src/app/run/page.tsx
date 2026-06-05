"use client";

import { useState } from "react";
import type { CrawlerOptions } from "@/lib/github";

interface CheckboxOptionProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function CheckboxOption({ label, description, checked, onChange }: CheckboxOptionProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-orange-600"
      />
      <div>
        <span className="text-sm font-medium text-orange-700">{label}</span>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </label>
  );
}

export default function RunPage() {
  const [options, setOptions] = useState<CrawlerOptions>({
    siteId: "",
    dryRun: false,
    force: false,
    refreshSite: "",
  });
  const [status, setStatus]   = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const set = (key: keyof CrawlerOptions, value: unknown) =>
    setOptions((prev) => ({ ...prev, [key]: value }));

  const handleRun = async () => {
    setStatus("running");
    setMessage("");
    const payload: CrawlerOptions = {
      ...(options.siteId      ? { siteId:      options.siteId }      : {}),
      ...(options.dryRun      ? { dryRun:      true }                : {}),
      ...(options.force       ? { force:       true }                : {}),
      ...(options.refreshSite ? { refreshSite: options.refreshSite } : {}),
    };
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setMessage(data.message);
    setStatus(res.ok ? "done" : "error");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-green-800 mb-6">クローラー実行</h1>
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-6">

        {/* 固定オプション表示 */}
        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
          <p className="font-medium mb-1">✅ 常に実行される処理</p>
          <ul className="text-xs text-green-700 space-y-0.5 list-disc list-inside">
            <li>詳細ページAI解析（--analyze-detail）</li>
            <li>CSV（全件）＋ Excel（環境テーマのみ）の両方を出力</li>
          </ul>
        </div>

        {/* 対象自治体 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">対象自治体</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                自治体ID <span className="text-xs text-gray-400">（省略時は全62自治体）</span>
              </label>
              <input
                type="text"
                placeholder="例: ota"
                value={options.siteId}
                onChange={(e) => set("siteId", e.target.value)}
                className="border rounded px-3 py-2 text-sm w-48"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DB記録をリセットする自治体ID
              </label>
              <input
                type="text"
                placeholder="例: ota"
                value={options.refreshSite}
                onChange={(e) => set("refreshSite", e.target.value)}
                className="border rounded px-3 py-2 text-sm w-48"
              />
              <p className="text-xs text-gray-400 mt-1">指定自治体のseen_urlsを削除して再取得対象にします</p>
            </div>
          </div>
        </div>

        {/* テスト用オプション */}
        <div>
          <h2 className="text-sm font-semibold text-orange-700 mb-3 border-b border-orange-200 pb-1">
            ⚠️ テスト用オプション
          </h2>
          <div className="space-y-4">
            <CheckboxOption
              label="AI判定スキップ（--dry-run）"
              description="取得のみ実行し、AIの判定をスキップします。全件FALSEとして記録されます。"
              checked={!!options.dryRun}
              onChange={(v) => set("dryRun", v)}
            />
            <CheckboxOption
              label="取得済みチェックスキップ（--force）"
              description="取得済みURLを無視して再取得します。DBへの書き込みは行いません。"
              checked={!!options.force}
              onChange={(v) => set("force", v)}
            />
          </div>
        </div>

        {/* 実行ボタン */}
        <div className="pt-2 border-t">
          <button
            onClick={handleRun}
            disabled={status === "running"}
            className="bg-green-700 text-white px-8 py-2 rounded hover:bg-green-800 disabled:opacity-50 text-sm"
          >
            {status === "running" ? "起動中..." : "実行する"}
          </button>
          {message && (
            <p className={`mt-3 text-sm ${status === "done" ? "text-green-700" : "text-red-600"}`}>
              {message}
            </p>
          )}
          {status === "done" && (
            <p className="mt-1 text-xs text-gray-500">
              進捗は{" "}
              <a
                href="https://github.com/yooojih/env-crawler-gemini/actions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 underline"
              >
                GitHub Actions
              </a>{" "}
              で確認できます。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
