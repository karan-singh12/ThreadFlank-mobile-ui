import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { LegalSection } from "@/data/site-content";

export type CmsContentBlock = {
  id: string;
  key: string;
  type: string;
  title: string | null;
  body: unknown;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ParsedLegalContent = {
  title?: string;
  intro?: string;
  sections?: LegalSection[];
  lastUpdated?: string;
};

/** A published CMS block, or null when it doesn't exist (the built-in copy is used then). */
export async function fetchCmsBlock(key: string): Promise<CmsContentBlock | null> {
  try {
    return (await apiRequest<CmsContentBlock>(ENDPOINTS.cms.get(key))).data;
  } catch {
    return null;
  }
}

/** Reads a legal page from a CMS block body ({ intro, sections } JSON or plain paragraphs). */
export function parseLegalBody(block: CmsContentBlock): ParsedLegalContent {
  const result: ParsedLegalContent = {};
  if (block.title) result.title = block.title;
  const stamp = new Date(block.publishedAt || block.updatedAt);
  if (!isNaN(stamp.getTime())) {
    result.lastUpdated = stamp.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  const raw = block.body;
  if (!raw) return result;

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.intro === "string") result.intro = obj.intro;
    if (Array.isArray(obj.sections)) {
      result.sections = obj.sections.map((s: Record<string, unknown>) => ({
        heading: String(s.heading || ""),
        body: Array.isArray(s.body) ? s.body.map(String) : [String(s.body || "")],
      }));
    }
  } else if (typeof raw === "string") {
    const parts = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      result.intro = parts[0];
      result.sections = parts.slice(1).map((p, idx) => ({ heading: `Section ${idx + 1}`, body: [p] }));
    }
  }
  return result;
}

export type ContactInput = { name: string; email: string; topic: string; message: string; userId?: string };

export async function sendContact(body: ContactInput) {
  return (await apiRequest<unknown>(ENDPOINTS.contact, { method: "POST", body })).message;
}
