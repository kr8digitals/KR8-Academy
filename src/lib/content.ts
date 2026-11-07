import { useEffect, useState } from "react";
import { useDb } from "./hooks";
import type { Db } from "./types";

/* Curated content studio. Everything here is editable from the dashboard
   (Content tab) with draft → publish. The site reads the *published* value and
   falls back to the default baked into the build, so an empty studio renders
   exactly the original copy. Nothing outside this map is editable yet. */

export type ContentField = {
  key: string;
  label: string;
  group: string;
  kind: "text" | "textarea";
  help?: string;
};

export const CONTENT_FIELDS: ContentField[] = [
  // Home hero
  { key: "home.hero.kicker", label: "Hero kicker line", group: "Home hero", kind: "text" },
  { key: "home.hero.title", label: "Hero headline", group: "Home hero", kind: "textarea" },
  { key: "home.hero.lede", label: "Hero lede paragraph", group: "Home hero", kind: "textarea" },
  // Final CTA
  { key: "home.cta.title", label: "Closing call-to-action headline", group: "Closing CTA", kind: "textarea" },
  // About
  { key: "about.lede", label: "About page lead paragraph", group: "About", kind: "textarea" },
  // Admissions
  { key: "admissions.lede", label: "Admissions lead paragraph", group: "Admissions", kind: "textarea" },
  // Recognition wall
  { key: "wall.intro", label: "Recognition wall introduction", group: "Recognition wall", kind: "textarea" },
  // Next Gen Scholars
  { key: "partner.academics", label: "Academics partner credit line", group: "Partners", kind: "text" },
];

export const DEFAULT_CONTENT: Record<string, string> = {
  "home.hero.kicker": "Free · Eight weeks · Certificate of Professionalism",
  "home.hero.title": "Learn a digital skill that pays. Free.",
  "home.hero.lede":
    "Eight weeks. Monday, Wednesday and Friday, 8pm West Africa Time. Real projects, real coaches and a verifiable Certificate of Professionalism — on your phone or your laptop.",
  "home.cta.title": "Your next skill is eight weeks away.",
  "about.lede":
    "KR8 Academy is the tuition-free school of KR8 Digitals — built to turn raw ambition into verified, professional capability.",
  "admissions.lede":
    "Two doors, one standard. Digital skills for the builders — and academics with Next Gen Scholars for students preparing for UTME/JAMB, WAEC, NECO or any future exam.",
  "wall.intro":
    "The KR8 Recognition Wall honours the scholars who set the pace — UTME and KR8 exam achievers, celebrated in public, verified in private.",
  "partner.academics": "In partnership with Next Gen Scholars",
};

export function publishedContent(db: Db, key: string): string {
  const value = db.content.published[key];
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (Array.isArray(value)) return value.join("\n");
  return DEFAULT_CONTENT[key] ?? "";
}

export function draftContent(db: Db, key: string): string {
  const value = db.content.draft[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join("\n");
  const published = db.content.published[key];
  if (typeof published === "string") return published;
  return DEFAULT_CONTENT[key] ?? "";
}

export function hasUnpublishedChanges(db: Db): boolean {
  return JSON.stringify(db.content.draft) !== JSON.stringify(db.content.published);
}

export function useContent(key: string): string {
  const db = useDb();
  return publishedContent(db, key);
}

/* Mounted once in App so editors see a subtle preview banner when previewing
 * drafts via ?preview=draft (drafts are device-local by design). */
export function useContentPreview(): boolean {
  const [preview] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "draft"
  );
  useEffect(() => {
    if (!preview) return;
    document.documentElement.dataset.contentPreview = "draft";
    return () => {
      delete document.documentElement.dataset.contentPreview;
    };
  }, [preview]);
  return preview;
}
