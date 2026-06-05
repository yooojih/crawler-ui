/**
 * GitHub API ユーティリティ
 * env-crawler-gemini リポジトリへのアクセスを担当
 */

const OWNER = process.env.GITHUB_OWNER!;
const REPO  = process.env.GITHUB_REPO!;
const TOKEN = process.env.GITHUB_TOKEN!;

const BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;

const headers = () => ({
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

// ─────────────────────────── 記事CSV ─────────────────────────────────────────

export interface Article {
  municipality: string;
  category: string;
  title: string;
  url: string;
  fetched_at: string;
  event_date: string;
  end_date: string;
  expires_at: string;
  is_env: boolean;
}

/** output/ ディレクトリにある CSV ファイルの一覧を返す */
export async function listCsvFiles(): Promise<string[]> {
  const res = await fetch(`${BASE}/contents/output`, { headers: headers(), cache: "no-store" });
  if (!res.ok) return [];
  const files: { name: string }[] = await res.json();
  return files
    .map((f) => f.name)
    .filter((n) => n.endsWith(".csv") || n.endsWith(".xlsx"))
    .sort()
    .reverse();
}

/** 最新の CSV ファイルを取得して Article[] に変換する */
export async function fetchLatestArticles(): Promise<Article[]> {
  const files = await listCsvFiles();
  const csv = files.find((f) => f.endsWith(".csv"));
  if (!csv) return [];
  return fetchArticlesFromFile(csv);
}

/** 指定 CSV ファイルを取得して Article[] に変換する */
export async function fetchArticlesFromFile(filename: string): Promise<Article[]> {
  const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/output/${filename}`;
  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (!res.ok) return [];
  const text = await res.text();
  return parseCsv(text);
}

function parseCsv(text: string): Article[] {
  const lines = text.replace(/\r/g, "").split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const articles: Article[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 9) continue;
    articles.push({
      municipality: cols[0],
      category:     cols[1],
      title:        cols[2],
      url:          cols[3],
      fetched_at:   cols[4],
      event_date:   cols[5],
      end_date:     cols[6],
      expires_at:   cols[7],
      is_env:       cols[8]?.trim().toUpperCase() === "TRUE",
    });
  }
  return articles;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuote = false;
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === "," && !inQuote) { result.push(cur); cur = ""; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}

// ─────────────────────────── ファイルダウンロード ────────────────────────────

/** output/ ファイルのダウンロード URL を返す */
export function getDownloadUrl(filename: string): string {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/output/${filename}`;
}

// ─────────────────────────── クローラー実行 ──────────────────────────────────

export interface CrawlerOptions {
  siteId?: string;
  dryRun?: boolean;
  force?: boolean;
  refreshSite?: string;
}

/** GitHub Actions workflow_dispatch をトリガーする */
export async function triggerCrawler(options: CrawlerOptions = {}): Promise<boolean> {
  const inputs: Record<string, string> = {};
  if (options.siteId)      inputs.site_id      = options.siteId;
  if (options.dryRun)      inputs.dry_run      = "true";
  if (options.force)       inputs.force        = "true";
  if (options.refreshSite) inputs.refresh_site = options.refreshSite;

  const res = await fetch(
    `${BASE}/actions/workflows/crawl.yml/dispatches`,
    {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ ref: "main", inputs }),
    }
  );
  return res.ok;
}

// ─────────────────────────── sites.json ──────────────────────────────────────

export interface SiteEntry {
  category: string;
  url: string;
  js_required: boolean;
  active: boolean;
}

export interface Site {
  id: string;
  name: string;
  urls: SiteEntry[];
}

/** sites.json を取得する */
export async function fetchSites(): Promise<{ sites: Site[]; sha: string }> {
  const res = await fetch(`${BASE}/contents/sites.json`, { headers: headers(), cache: "no-store" });
  if (!res.ok) return { sites: [], sha: "" };
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { sites: JSON.parse(content), sha: data.sha };
}

/** sites.json を更新する */
export async function updateSites(sites: Site[], sha: string): Promise<boolean> {
  const content = Buffer.from(JSON.stringify(sites, null, 2)).toString("base64");
  const res = await fetch(`${BASE}/contents/sites.json`, {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `sites.json を更新 (Web UI)`,
      content,
      sha,
    }),
  });
  return res.ok;
}
