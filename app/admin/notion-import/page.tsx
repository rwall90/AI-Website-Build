import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { requireAdmin } from "@/lib/auth";

export default async function NotionImportPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="panel">
          <p className="eyebrow">Notion import</p>
          <h1>Import structured playbook</h1>
          <p className="muted">
            This reads your connected Notion page and saves a structured copy in
            Supabase. It does not write back to Notion.
          </p>
          {params.error ? (
            <p className="notice">
              Import failed: {params.error}
            </p>
          ) : null}
          <div className="editor-actions">
            <a className="button" href="/admin/notion-import/run">
              Start import
            </a>
            <Link className="button outline" href="/admin">
              Back to admin
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
