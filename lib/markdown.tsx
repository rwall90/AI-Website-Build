import { marked } from "marked";

type MarkdownViewProps = {
  content: string;
  notionPath?: string | null;
  title?: string;
};

marked.setOptions({
  async: false,
  breaks: true,
  gfm: true
});

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/[a-f0-9]{32}/gi, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

function encodePath(path: string) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function resolveRelativePath(target: string, notionPath?: string | null) {
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(target)) {
    return target;
  }

  const pageDirectory = notionPath ? notionPath.split("/").slice(0, -1).join("/") : "";
  const combined = `${pageDirectory ? `${pageDirectory}/` : ""}${decodeURIComponent(target)}`;
  const parts: string[] = [];

  for (const part of combined.split("/")) {
    if (!part || part === ".") {
      continue;
    }

    if (part === "..") {
      parts.pop();
    } else {
      parts.push(part);
    }
  }

  return parts.join("/");
}

function rewriteLinks(content: string, notionPath?: string | null) {
  return content.replace(
    /(!?)\[([^\]]*)\]\(([^)]+)\)/g,
    (match, imagePrefix: string, label: string, rawTarget: string) => {
      const target = rawTarget.trim();

      if (!imagePrefix && target.toLowerCase().includes(".md")) {
        const resolvedPath = resolveRelativePath(target, notionPath).replace(/^Private & Shared\//, "");
        return `[${label}](/wiki/${slugify(resolvedPath)})`;
      }

      if (imagePrefix) {
        const resolvedPath = resolveRelativePath(target, notionPath).replace(/^Private & Shared\//, "");
        return `![${label}](/notion-assets/${encodePath(resolvedPath)})`;
      }

      return match;
    }
  );
}

function splitCallouts(content: string) {
  const callouts: string[] = [];
  const markdown = content.replace(/<aside>\s*([\s\S]*?)\s*<\/aside>/g, (_match, body: string) => {
    const index = callouts.push(body.trim()) - 1;
    return `\n\n<div data-callout="${index}"></div>\n\n`;
  });

  return { markdown, callouts };
}

function stripDuplicateTitle(content: string, title?: string) {
  if (!title) {
    return content;
  }

  const firstHeading = content.match(/^#\s+(.+)\n+/);

  if (firstHeading?.[1]?.trim().toLowerCase() === title.trim().toLowerCase()) {
    return content.slice(firstHeading[0].length);
  }

  return content;
}

function renderCalloutBody(body: string) {
  const sections = body.split(/\n(?=#{3,5}\s+)/);

  if (sections.length <= 1) {
    return marked.parse(body) as string;
  }

  return sections
    .map((section) => {
      const match = section.match(/^(#{3,5})\s+(.+)\n?([\s\S]*)$/);

      if (!match) {
        return marked.parse(section) as string;
      }

      const heading = match[2].replace(/\*\*/g, "").trim();
      const detail = match[3].trim();

      if (!detail) {
        return `<h3>${escapeAttribute(heading)}</h3>`;
      }

      return `<details class="notion-toggle"><summary>${escapeAttribute(heading)}</summary><div class="notion-children">${marked.parse(
        detail
      ) as string}</div></details>`;
    })
    .join("");
}

function renderMarkdown(content: string, notionPath?: string | null, title?: string) {
  const rewritten = rewriteLinks(stripDuplicateTitle(content, title), notionPath);
  const { markdown, callouts } = splitCallouts(rewritten);
  let html = marked.parse(markdown) as string;

  callouts.forEach((callout, index) => {
    const lines = callout.split("\n");
    const firstLine = lines[0]?.trim();
    const hasIcon = firstLine && firstLine.length <= 4 && !/[A-Za-z0-9#*\-[\]]/.test(firstLine);
    const icon = hasIcon ? firstLine : "Note";
    const body = hasIcon ? lines.slice(1).join("\n").trim() : callout;
    const calloutHtml = `<section class="notion-callout"><div class="callout-icon">${escapeAttribute(
      icon
    )}</div><div class="callout-content">${renderCalloutBody(body)}</div></section>`;

    html = html.replace(`<div data-callout="${index}"></div>`, calloutHtml);
  });

  return html;
}

export function MarkdownView({ content, notionPath, title }: MarkdownViewProps) {
  const html = renderMarkdown(content, notionPath, title);

  return <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
