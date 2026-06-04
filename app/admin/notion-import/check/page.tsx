import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NotionImportCheckPage() {
  const session = await getSession();
  const checks = [
    ["Admin session", session?.role === "admin"],
    ["NOTION_TOKEN", Boolean(process.env.NOTION_TOKEN)],
    ["NOTION_PAGE_ID or NOTION_PAGE_URL", Boolean(process.env.NOTION_PAGE_ID || process.env.NOTION_PAGE_URL)],
    ["SUPABASE_URL", Boolean(process.env.SUPABASE_URL)],
    ["SUPABASE_SERVICE_ROLE_KEY", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)]
  ];

  return (
    <main className="empty-state">
      <div>
        <p className="eyebrow">Notion import</p>
        <h1>Configuration check</h1>
        <div className="panel">
          {checks.map(([label, ok]) => (
            <p key={String(label)}>
              <strong>{label}:</strong> {ok ? "OK" : "Missing"}
            </p>
          ))}
        </div>
        <div className="editor-actions">
          <a className="button" href="/admin/notion-import/run">
            Run import
          </a>
          <a className="button outline" href="/admin/notion-import">
            Back
          </a>
        </div>
      </div>
    </main>
  );
}
