import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ImportNotionNowPage() {
  let role = "none";

  try {
    const session = await getSession();
    role = session?.role || "none";
  } catch (error) {
    return (
      <main className="empty-state">
        <div>
          <p className="eyebrow">Notion import</p>
          <h1>Session check failed</h1>
          <p className="notice">{error instanceof Error ? error.message : "Could not read session."}</p>
        </div>
      </main>
    );
  }

  const checks = [
    ["Admin session", role === "admin"],
    ["NOTION_TOKEN", Boolean(process.env.NOTION_TOKEN)],
    ["NOTION_PAGE_ID or NOTION_PAGE_URL", Boolean(process.env.NOTION_PAGE_ID || process.env.NOTION_PAGE_URL)],
    ["SUPABASE_URL", Boolean(process.env.SUPABASE_URL)],
    ["SUPABASE_SERVICE_ROLE_KEY", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)]
  ];

  return (
    <main className="empty-state">
      <div>
        <p className="eyebrow">Notion import</p>
        <h1>Import diagnostic</h1>
        <div className="panel">
          {checks.map(([label, ok]) => (
            <p key={String(label)}>
              <strong>{label}:</strong> {ok ? "OK" : "Missing"}
            </p>
          ))}
        </div>
        <p className="muted">
          If all checks are OK, we will run the importer from a separate API
          route next.
        </p>
        <a className="button" href="/admin">
          Back to admin
        </a>
      </div>
    </main>
  );
}
