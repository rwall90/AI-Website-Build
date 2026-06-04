import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { importNotionPlaybook } from "@/lib/notion";

export default async function RunNotionImportPage() {
  await requireAdmin();

  try {
    const imported = await importNotionPlaybook();
    redirect(`/admin?imported=${imported.length}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown import error.";
    redirect(`/admin/notion-import?error=${encodeURIComponent(message.slice(0, 240))}`);
  }
}
