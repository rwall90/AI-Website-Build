import { getSession } from "@/lib/auth";
import { importNotionPlaybook } from "@/lib/notion";

export const dynamic = "force-dynamic";

export default async function RunNotionImportPage() {
  const session = await getSession();

  if (session?.role !== "admin") {
    return (
      <main className="empty-state">
        <div>
          <p className="eyebrow">Notion import</p>
          <h1>Admin login required</h1>
          <p className="muted">Log in as admin, then open this import page again.</p>
          <a className="button" href="/login">
            Log in
          </a>
        </div>
      </main>
    );
  }

  const missing = [
    !process.env.NOTION_TOKEN && "NOTION_TOKEN",
    !process.env.NOTION_PAGE_ID && !process.env.NOTION_PAGE_URL && "NOTION_PAGE_ID or NOTION_PAGE_URL",
    !process.env.SUPABASE_URL && "SUPABASE_URL",
    !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY"
  ].filter(Boolean);

  if (missing.length > 0) {
    return (
      <main className="empty-state">
        <div>
          <p className="eyebrow">Notion import</p>
          <h1>Configuration missing</h1>
          <p className="notice">Missing: {missing.join(", ")}</p>
          <a className="button" href="/admin/notion-import">
            Back to import
          </a>
        </div>
      </main>
    );
  }

  try {
    const imported = await importNotionPlaybook();
    return (
      <main className="empty-state">
        <div>
          <p className="eyebrow">Notion import</p>
          <h1>Import complete</h1>
          <p className="muted">Imported {imported.length} Notion pages.</p>
          <a className="button" href="/admin">
            Back to admin
          </a>
        </div>
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown import error.";

    return (
      <main className="empty-state">
        <div>
          <p className="eyebrow">Notion import</p>
          <h1>Import failed</h1>
          <p className="notice">{message}</p>
          <a className="button" href="/admin/notion-import">
            Back to import
          </a>
        </div>
      </main>
    );
  }
}
