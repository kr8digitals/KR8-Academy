/* KR8 Academy — read-only public aggregate stats for kr8digitals.com.
 *
 * No personal data, ever: three counters and a freshness stamp. Until a
 * database backs the academy, Timfire maintains these in the Vercel project's
 * environment variables — edit the numbers, no redeploy required:
 *   KR8_STATS_STUDENTS_TRAINED   (integer)
 *   KR8_STATS_CERTIFICATES_ISSUED (integer)
 *   KR8_STATS_ACTIVE_TRACKS      (integer, default 3 — video editing, graphic
 *                                 design and website design, the next intake)
 * Values are aggregate totals, not live queries. `pendingReview: true` is
 * emitted whenever any variable is unset/unparseable so the consumer can show
 * a "figures in review" state instead of a fabricated number.
 */

export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, detail: "GET only." });
    return;
  }

  const read = (key: string): { value: number | null; set: boolean } => {
    const raw = process.env[key];
    if (raw === undefined || raw === "") return { value: null, set: false };
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? { value: Math.floor(parsed), set: true } : { value: null, set: false };
  };

  const students = read("KR8_STATS_STUDENTS_TRAINED");
  const certificates = read("KR8_STATS_CERTIFICATES_ISSUED");
  const tracks = read("KR8_STATS_ACTIVE_TRACKS");

  const pendingReview = !students.set || !certificates.set;

  res.status(200).json({
    ok: true,
    studentsTrained: students.value ?? 0,
    certificatesIssued: certificates.value ?? 0,
    activeTracks: tracks.value ?? 3,
    currency: "n/a",
    asOf: new Date().toISOString(),
    pendingReview,
    source: "env",
    note:
      "Aggregate figures maintained by the academy. Until the academy database ships, these are edited in the deployment environment; they are not live queries.",
  });
}
