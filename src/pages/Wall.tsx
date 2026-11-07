import { Link } from "react-router-dom";
import { Sparkles, Trophy } from "lucide-react";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { wallRows } from "../lib/awards";
import { ButtonLink, Pill } from "../components/ui";

/* The KR8 recognition wall — every name here passed verification, won the
   award, got approved and said yes to being listed. Names and tiers only:
   never amounts, never personal details. */
export default function Wall() {
  const db = useDb();

  useSeo({
    title: "The Wall — KR8 Scholars",
    description: "Students recognised by KR8 Academy for verified UTME excellence and KR8 exam distinction. Public, earned, no shortcuts.",
    path: "/wall",
  });

  const rows = wallRows(db);
  const years = [...new Set(rows.map((row) => row.year))].sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-base">
      {/* Hero */}
      <section className="shell relative overflow-hidden pt-16 sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-140px] h-[380px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(201,162,39,0.16),transparent)] blur-2xl" />
        <p className="eyebrow flex items-center gap-2"><Trophy size={12} className="text-gold" /> The KR8 Wall</p>
        <h1 className="display display-xl mt-3 max-w-3xl">Names that were<br /><span className="text-gold">earned in the open.</span></h1>
        <p className="lede mt-5 max-w-xl">
          Every person on this wall sat the exam, submitted the official slip, passed verification, had the award approved
          — and chose to stand on the wall. No names are bought, borrowed or planted. UTME and KR8 exam distinction,
          recognised by the academy that watched it happen.
        </p>
      </section>

      {/* Wall */}
      <section className="shell mt-12 sm:mt-16 pb-16">
        {rows.length === 0 ? (
          <div className="card mx-auto max-w-xl p-10 text-center">
            <Sparkles size={22} className="mx-auto text-gold" />
            <h2 className="display display-sm mt-4">The first names are being verified.</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Awards are announced only after results are verified, prizes are approved and winners consent to be listed.
              This page fills itself — no announcement will precede it.
            </p>
            <ButtonLink to="/apply" variant="primary" className="mt-6">Earn your place</ButtonLink>
          </div>
        ) : (
          years.map((year) => {
            const yearRows = rows.filter((row) => row.year === year);
            return (
              <div key={year} className="mt-10 first:mt-0">
                <div className="flex items-end justify-between gap-4">
                  <h2 className="display display-md">{year}</h2>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{yearRows.length} recognised</p>
                </div>
                <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {yearRows.map((row) => (
                    <li key={row.id} className="card group relative overflow-hidden p-5">
                      <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[radial-gradient(closest-side,rgba(201,162,39,0.18),transparent)]" />
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">{row.scope === "utme" ? "UTME distinction" : "KR8 exam distinction"}</p>
                      <p className="mt-2 font-display text-[20px] font-semibold leading-tight">{row.name}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill className="!border-gold/40 !text-gold">{row.tierName}</Pill>
                      </div>
                      {row.artifact && <p className="mt-2 text-[10.5px] leading-relaxed text-muted">{row.artifact}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })
        )}

        <figure className="mt-12 overflow-hidden rounded-2xl border border-gold/20">
          <img
            src="/media/graduates-stage.jpg"
            alt="KR8 Academy graduates on stage receiving certificates, families watching from the floor"
            loading="lazy"
            className="aspect-[21/9] w-full object-cover object-[50%_35%]"
          />
          <figcaption className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#14100a] px-5 py-3 text-[11px] text-muted">
            <span>Every name on The Wall was earned in the open — this is what the proof looks like.</span>
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-gold">KR8 graduates</span>
          </figcaption>
        </figure>

        {/* How names get here */}
        <div className="mt-14 grid gap-6 border-t border-white/10 pt-10 sm:grid-cols-3">
          {[
            { step: "1", title: "Sit the exam", body: "UTME candidates and KR8 exam sitters alike. The academy never awards what it has not seen." },
            { step: "2", title: "Pass verification", body: "Your official result slip is cross-checked against your candidate details before any prize is approved." },
            { step: "3", title: "Stand on the wall", body: "Approved winners choose to be listed. Names and tiers only — never amounts, never personal details." },
          ].map((item) => (
            <div key={item.step}>
              <span className="grid h-8 w-8 place-items-center rounded-full border border-gold/40 font-display text-[13px] font-semibold text-gold">{item.step}</span>
              <p className="mt-2.5 text-[13px] font-semibold">{item.title}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-[11px] text-muted">
          Spot your tier? <Link to="/apply?door=academic" className="font-semibold text-magenta-bright hover:underline">Apply to KR8 Academics</Link> — the wall is not for display, it is for imitation.
        </p>
      </section>
    </div>
  );
}
