import type { AwardTier, Db } from "./types";

/* KR8 Academy awards — UTME tiers.
 * Boundaries are lower-bound inclusive and non-overlapping:
 *   240–249  250–279  280–299  300–349  350+
 * Every amount below is a STARTER VALUE pending Timfire's review — never
 * present these as final. Timfire edits tiers, amounts, artifacts, certificate
 * variants and rules from the dashboard; grading, certificates and the
 * recognition wall follow the edits automatically.
 */

export const DEFAULT_UTME_TIERS: AwardTier[] = [
  {
    id: "utme-merit",
    scope: "utme",
    name: "KR8 UTME Merit Scholar",
    min: 240,
    max: 249,
    reward: "Certificate of Professionalism (UTME) — certificate only",
    artifact: "Certificate",
    amount: 0,
    currency: "NGN",
    variant: "utme_merit",
    order: 1,
    active: true,
    pendingReview: true,
  },
  {
    id: "utme-scholar",
    scope: "utme",
    name: "KR8 UTME Scholar",
    min: 250,
    max: 279,
    reward: "Small remuneration",
    artifact: "Engraved certificate + cash award",
    amount: 50_000,
    currency: "NGN",
    variant: "utme_scholar",
    order: 2,
    active: true,
    pendingReview: true,
  },
  {
    id: "utme-distinction",
    scope: "utme",
    name: "KR8 UTME Distinction Scholar",
    min: 280,
    max: 299,
    reward: "Gift package",
    artifact: "Gift package + engraved plaque",
    amount: 120_000,
    currency: "NGN",
    variant: "utme_distinction",
    order: 3,
    active: true,
    pendingReview: true,
  },
  {
    id: "utme-pinnacle",
    scope: "utme",
    name: "KR8 UTME Pinnacle Scholar",
    min: 300,
    max: 349,
    reward: "Cash prize + gift",
    artifact: "Cash prize + premium gift + trophy",
    amount: 300_000,
    currency: "NGN",
    variant: "utme_pinnacle",
    order: 4,
    active: true,
    pendingReview: true,
  },
  {
    id: "utme-legend",
    scope: "utme",
    name: "KR8 UTME Legend",
    min: 350,
    max: 400,
    reward: "Larger cash prize + special certificate",
    artifact: "Larger cash prize + crystal trophy + special Legend certificate",
    amount: 500_000,
    currency: "NGN",
    variant: "utme_legend",
    order: 5,
    active: true,
    pendingReview: true,
  },
];

export function activeUtmeTiers(db: Db): AwardTier[] {
  return [...db.awardTiers].filter((t) => t.scope === "utme" && t.active).sort((a, b) => a.order - b.order);
}

/* Lower-bound inclusive; tiers sorted by order then min. Returns null when the
 * score clears no active tier (e.g. below 240). */
export function tierForScore(tiers: AwardTier[], score: number): AwardTier | null {
  const sorted = [...tiers].filter((t) => t.active).sort((a, b) => b.min - a.min);
  return sorted.find((t) => score >= t.min && score <= t.max) ?? null;
}

export function utmeTierForScore(db: Db, score: number): AwardTier | null {
  return tierForScore(activeUtmeTiers(db), score);
}

/* Validates a proposed tier set: lower bounds strictly inclusive, no overlap,
 * max ≥ min. Used before any tier edit is persisted. */
export function validateUtmeTiers(tiers: AwardTier[]): string | null {
  const active = tiers.filter((t) => t.scope === "utme" && t.active).sort((a, b) => a.min - b.min);
  for (const tier of active) {
    if (tier.max < tier.min) return `"${tier.name}": max (${tier.max}) is below min (${tier.min}).`;
    if (tier.min < 0 || tier.max > 400) return `"${tier.name}": UTME scores live between 0 and 400.`;
  }
  for (let i = 1; i < active.length; i++) {
    if (active[i].min <= active[i - 1].max)
      return `"${active[i].name}" overlaps "${active[i - 1].name}". Tiers must not overlap.`;
  }
  return null;
}

/* Recognition wall rows — names and tiers only, never amounts or personal data. */
export function wallRows(db: Db) {
  const students = new Map(db.students.map((s) => [s.id, s]));
  const tiers = new Map(db.awardTiers.map((t) => [t.id, t]));
  return db.awardGrants
    .filter((g) => g.published && g.status !== "rejected")
    .map((g) => {
      const student = students.get(g.studentId);
      const tier = tiers.get(g.tierId);
      return {
        id: g.id,
        name: student?.name ?? "KR8 Scholar",
        tierName: tier?.name ?? "KR8 Scholar",
        artifact: tier?.artifact ?? "",
        scope: g.scope,
        scoreUsed: g.scoreUsed,
        year: new Date(g.decidedAt ?? g.createdAt).getFullYear(),
        status: g.status,
      };
    })
    .sort((a, b) => b.scoreUsed - a.scoreUsed);
}
