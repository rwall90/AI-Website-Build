import { requireAdmin } from "@/lib/auth";
import { importNotionPlaybook } from "@/lib/notion";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function RunNotionImportPage() {
  await requireAdmin();

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
