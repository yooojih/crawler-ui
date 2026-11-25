"use client";

import { useState, useEffect } from "react";
import type { CrawlerOptions } from "@/lib/github";

/** ISO週番号（月曜始まり）を返す */
function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // ISO 8601: 木曜日が含まれる週を第1週とする
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/** 次回定期実行日時（JST）を計算する。隔週日曜 13:00 JST = 04:00 UTC */
function getNextScheduledRun(): Date {
  // 現在時刻をUTCで取得
  const now = new Date();
  // 今の曜日（0=日曜）
  const dayOfWeek = now.getUTCDay();
  // 今週の日曜日（UTC）
  const thisSunday = new Date(now);
  thisSunday.setUTCDate(now.getUTCDate() - dayOfWeek);
  thisSunday.setUTCHours(4, 0, 0, 0); // 04:00 UTC = 13:00 JST

  // 候補日リスト（今週の日曜日 or 来週 or 再来週）
  const candidates = [thisSunday, new Date(thisSunday)];
  candidates[1].setUTCDate(thisSunday.getUTCDate() + 7);
  const candidates2 = new Date(thisSunday);
  candidates2.setUTCDate(thisSunday.getUTCDate() + 14);

  const allCandidates = [candidates[0], candidates[1], candidates2];

  for (const candidate of allCandidates) {
    // 過去はスキップ
    if (candidate.getTime() <= now.getTime()) continue;
    // 偶数週のみ実行
    if (getISOWeek(candidate) % 2 === 0) {
      return candidate;
    }
  }
  // フォールバック: 28日後の日曜日
  const fallback = new Date(thisSunday);
  fallback.setUTCDate(thisSunday.getUTCDate() + 28);
  return fallback;
}

/** Date を "YYYY年M月D日（曜日）HH:MM JST" 形式にフォーマット */
function formatJST(utcDate: Date): string {
  const jst = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth() + 1;
  const d = jst.getUTCDate();
  const dow = days[jst.getUTCDay()];
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mm = String(jst.getUTCMinutes()).padStart(2, "0");
  return `${y}年${m}月${d}日（${dow}）${hh}:${mm} JST`;
}

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
  const [nextRun, setNextRun] = useState<string>("");

  // モデル変更
  const [currentModel, setCurrentModel] = useState<string>("");
  const [inputModel,   setInputModel]   = useState<string>("");
  const [modelStatus,  setModelStatus]  = useState<"idle" | "saving" | "done" | "error">("idle");
  const [modelMessage, setModelMessage] = useState("");

  useEffect(() => {
    setNextRun(formatJST(getNextScheduledRun()));
    // 現在のモデルを取得
    fetch("/api/model")
      .then((r) => r.json())
      .then((d) => {
        setCurrentModel(d.model ?? "");
        setInputModel(d.model ?? "");
      })
      .catch(() => {});
  }, []);

  const set = (key: keyof CrawlerOptions, value: unknown) =>
    setOptions((prev) => ({ ...prev, [key]: value }));

  const handleModelSave = async () => {
    if (!inputModel.trim() || inputModel.trim() === currentModel) return;
    setModelStatus("saving");
    setModelMessage("");
    const res = await fetch("/api/model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: inputModel.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setCurrentModel(inputModel.trim());
      setModelMessage(data.message);
      setModelStatus("done");
    } else {
      setModelMessage(data.error ?? "エラーが発生しました");
      setModelStatus("error");
    }
  };

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
      <h1 className="text-2xl font-bold text-green-800 mb-4">クローラー実行</h1>

      {/* 次回定期実行スケジュール */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mb-6 flex items-start gap-3">
        <span className="text-blue-500 text-xl mt-0.5">🕐</span>
        <div>
          <p className="text-sm font-semibold text-blue-800">次回の定期実行（自動）</p>
          {nextRun ? (
            <p className="text-base font-bold text-blue-900 mt-0.5">{nextRun}</p>
          ) : (
            <p className="text-sm text-blue-400 mt-0.5">計算中...</p>
          )}
          <p className="text-xs text-blue-600 mt-1">
            スケジュール: 隔週日曜日 13:00 JST（偶数週のみ自動実行）
          </p>
        </div>
      </div>

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

        {/* Geminiモデル変更 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">
            🤖 Geminiモデル
          </h2>
          <div className="space-y-2">
            <div className="text-xs text-gray-500">
              現在のモデル:{" "}
              {currentModel ? (
                <span className="font-mono font-semibold text-green-700">{currentModel}</span>
              ) : (
                <span className="text-gray-400">読み込み中...</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputModel}
                onChange={(e) => {
                  setInputModel(e.target.value);
                  setModelStatus("idle");
                  setModelMessage("");
                }}
                placeholder="例: gemini-3.1-flash-lite"
                className="border rounded px-3 py-1.5 text-sm font-mono w-64"
              />
              <button
                onClick={handleModelSave}
                disabled={
                  modelStatus === "saving" ||
                  !inputModel.trim() ||
                  inputModel.trim() === currentModel
                }
                className="bg-green-700 text-white px-4 py-1.5 rounded hover:bg-green-800 disabled:opacity-40 text-sm"
              >
                {modelStatus === "saving" ? "保存中..." : "変更する"}
              </button>
            </div>
            {modelMessage && (
              <p className={`text-xs ${modelStatus === "done" ? "text-green-700" : "text-red-600"}`}>
                {modelStatus === "done" ? "✅ " : "❌ "}{modelMessage}
              </p>
            )}
            <p className="text-xs text-gray-400">
              変更するとGitHubにコミットされ、次回実行から反映されます。
            </p>
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
