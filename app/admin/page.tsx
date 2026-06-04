import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { importFromNotion, savePage } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { listPages } from "@/lib/supabase";

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ selected?: string; new?: string; imported?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const pages = await listPages({ includeDrafts: true });
  const selected = params.new
    ? null
    : pages.find((page) => page.slug === params.selected) || pages[0] || null;
  const notionChecks = [
    ["NOTION_TOKEN", Boolean(process.env.NOTION_TOKEN)],
    ["NOTION_PAGE_ID or NOTION_PAGE_URL", Boolean(process.env.NOTION_PAGE_ID || process.env.NOTION_PAGE_URL)],
    ["SUPABASE_URL", Boolean(process.env.SUPABASE_URL)],
    ["SUPABASE_SERVICE_ROLE_KEY", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)]
  ];

  return (
    <div className="shell">
      <Topbar />
      <main className="main">
        <section className="article-header">
          <div>
            <p className="eyebrow">Admin CMS</p>
            <h1>Manage playbook</h1>
            <p className="muted">
              Create, edit, draft, and publish wiki pages stored in Supabase.
            </p>
          </div>
          <Link className="button secondary" href="/admin?new=1">
            New page
          </Link>
          <a className="button" href="/admin/notion-import">
            Import from Notion
          </a>
        </section>

        {params.imported ? (
          <p className="notice">Imported {params.imported} Notion pages. Open the wiki to review structured blocks.</p>
        ) : null}

        <section className="panel" style={{ marginBottom: "22px" }}>
          <p className="eyebrow">Notion setup</p>
          <h2>Import readiness</h2>
          {notionChecks.map(([label, ok]) => (
            <p key={String(label)}>
              <strong>{label}:</strong> {ok ? "OK" : "Missing"}
            </p>
          ))}
          <div className="editor-actions">
            <form action={importFromNotion}>
              <button className="button" type="submit">
                Run Notion import
              </button>
            </form>
          </div>
        </section>

        <section className="admin-layout">
          <aside className="panel">
            <p className="eyebrow">Pages</p>
            <nav className="admin-list" aria-label="Admin page list">
              {pages.map((page) => (
                <Link
                  className={`page-link ${selected?.slug === page.slug ? "active" : ""}`}
                  href={`/admin?selected=${page.slug}`}
                  key={page.id}
                >
                  <span>{page.status}</span>
                  {page.title}
                </Link>
              ))}
            </nav>
          </aside>

          <form className="panel form" action={savePage}>
            <input name="id" type="hidden" defaultValue={selected?.id || ""} />
            <label>
              Title
              <input name="title" defaultValue={selected?.title || ""} required />
            </label>
            <label>
              Slug
              <input name="slug" defaultValue={selected?.slug || ""} placeholder="generated-from-title" />
            </label>
            <label>
              Section
              <input name="section" defaultValue={selected?.section || "Playbook"} />
            </label>
            <label>
              Excerpt
              <input name="excerpt" defaultValue={selected?.excerpt || ""} />
            </label>
            <label>
              Audience
              <select name="audience" defaultValue={selected?.audience || "all"}>
                <option value="all">Everyone</option>
                <option value="client">Client portal</option>
                <option value="internal">Internal team</option>
              </select>
            </label>
            <label>
              Status
              <select name="status" defaultValue={selected?.status || "draft"}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label>
              Sort order
              <input name="sort_order" type="number" defaultValue={selected?.sort_order || 100} />
            </label>
            <label>
              Content
              <textarea name="content" defaultValue={selected?.content || ""} required />
            </label>
            <div className="editor-actions">
              <button className="button" type="submit">
                Save page
              </button>
              {selected ? (
                <Link className="button outline" href={`/wiki/${selected.slug}`}>
                  Preview
                </Link>
              ) : null}
            </div>
            <p className="notice">
              This editor stores Markdown content. The Notion ZIP importer will
              populate these fields from exported pages.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
