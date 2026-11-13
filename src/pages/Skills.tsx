import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Clock3, GraduationCap, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { MENTORS, TRACKS } from "../data/academy";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { ButtonLink } from "../components/ui";
import { Reveal, SectionIndex } from "../components/sections";
import type { Track } from "../data/academy";

const GROUPINGS = [
  { id: "all", label: "All seven" },
  { id: "design", label: "Design" },
  { id: "technology", label: "Technology" },
  { id: "content", label: "Content" },
  { id: "growth", label: "Growth" },
] as const;

type Group = (typeof GROUPINGS)[number]["id"];
const GROUP_MAP: Record<Exclude<Group, "all">, string[]> = {
  design: ["graphic"],
  technology: ["web", "frontend"],
  content: ["video", "content_creation"],
  growth: ["smm", "marketing"],
};

function categoryFor(track: Track): Exclude<Group, "all"> {
  if (GROUP_MAP.technology.includes(track.key)) return "technology";
  if (GROUP_MAP.content.includes(track.key)) return "content";
  if (GROUP_MAP.growth.includes(track.key)) return "growth";
  return "design";
}

export default function Skills() {
  const db = useDb();
  const [group, setGroup] = useState<Group>("all");
  const [query, setQuery] = useState("");

  useSeo({
    title: "Free digital skills courses — KR8 Academy",
    description: "Explore seven tuition-free digital skill tracks in design, web development, video, content and digital growth. New enrollment is paused; register interest for the next intake.",
    path: "/skills",
  });

  const filtered = useMemo(() => TRACKS.filter((track) => {
    const searchMatch = `${track.name} ${track.tagline} ${track.snippet} ${track.tools.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
    const groupMatch = group === "all" || GROUP_MAP[group].includes(track.key);
    return searchMatch && groupMatch;
  }), [group, query]);
  const statusFor = (key: string) => !db.settings.registrationOpen
    ? "waitlist"
    : db.programmes.find((programme) => programme.key === key)?.status ?? "closed";

  return (
    <main className="catalog-page">
      <section className="catalog-hero">
        <img src="/media/hero-skills.jpg" alt="KR8 learners practising digital skills together at a shared worktable" fetchPriority="high" />
        <div className="catalog-hero__veil" />
        <div className="shell catalog-hero__content">
          <SectionIndex index="The catalogue" label="Seven crafts · one community" />
          <h1>Find the work<br /><em>you want to make.</em></h1>
          <p>From your first design file to a shipped website or a brand with a voice: learn a practical craft with KR8 Digitals’ working practitioners. Every Academy track is tuition-free.</p>
          <div className="catalog-hero__meta"><span><span className="catalog-dot" /> 7 skill pathways</span><span>8-week practical cohorts</span><span>₦0 tuition</span></div>
          <a className="catalog-hero__scroll" href="#catalog-tools">Explore the catalogue <ArrowRight size={15} /></a>
        </div>
      </section>

      <section className="catalog-pause shell" aria-label="Enrollment status">
        <div className="catalog-pause__icon"><Clock3 size={19} /></div>
        <div><strong>New enrollment is paused.</strong><span>Browse every curriculum now, then register your interest to hear when the next intake opens.</span></div>
        <ButtonLink to="/apply?door=skill" variant="primary" size="sm" arrow>Register interest</ButtonLink>
      </section>

      <section className="shell catalog-discover" id="catalog-tools">
        <div className="catalog-heading"><div><p className="catalog-kicker">01 / EXPLORE BY CRAFT</p><h2>Seven ways to build<br />your next chapter.</h2></div><p>Compare the work, tools and weekly commitment. Open a track to see the full eight-week curriculum.</p></div>
        <div className="catalog-toolbar">
          <label className="catalog-search"><Search size={17} /><span className="sr-only">Search skills</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search skills, tools or outcomes" /></label>
          <p className="catalog-level">Beginner-friendly paths · build toward advanced practice</p>
        </div>
        <div className="catalog-tabs" role="group" aria-label="Filter skills by category">
          {GROUPINGS.map((item) => <button type="button" key={item.id} aria-pressed={group === item.id} className={group === item.id ? "is-active" : ""} onClick={() => setGroup(item.id)}>{item.label}<span>{item.id === "all" ? TRACKS.length : GROUP_MAP[item.id].length}</span></button>)}
          <span className="catalog-result-count" aria-live="polite">{filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
        </div>
        {filtered.length ? <div className="catalog-grid">{filtered.map((track, index) => {
          const mentor = MENTORS.find((person) => person.key === track.mentorKey);
          const status = statusFor(track.key);
          return <Reveal key={track.key} delay={index * 40}><article className="catalog-card">
            <Link to={`/skills/${track.slug}`} className="catalog-card__image" aria-label={`Explore ${track.name}`}><img src={track.cover} alt="" loading="lazy" /><span className="catalog-card__number">0{TRACKS.indexOf(track) + 1}</span><span className="catalog-card__open"><ArrowUpRight size={17} /></span></Link>
            <div className="catalog-card__body"><p className="catalog-card__eyebrow">{GROUPINGS.find((item) => item.id === categoryFor(track))?.label} <span>·</span> {track.duration}</p><h3><Link to={`/skills/${track.slug}`}>{track.name}</Link></h3><p className="catalog-card__desc">{track.tagline}</p>
              <div className="catalog-card__facts"><span><Clock3 size={14} />{track.commitment}</span><span><Sparkles size={14} />{track.level}</span></div>
              <div className="catalog-card__mentor"><img src={mentor?.photo ?? "/team/founder-timfire.jpg"} alt="" loading="lazy" /><span><small>LEARN WITH</small><strong>{mentor?.shortName ?? "KR8 Faculty"}</strong></span><span className={`catalog-status catalog-status--${status}`}>{status === "waitlist" ? "Interest list" : status === "open" ? "Open" : "Later intake"}</span></div>
              <Link to={`/skills/${track.slug}`} className="catalog-card__details">View curriculum <ArrowRight size={15} /></Link>
            </div>
          </article></Reveal>;
        })}</div> : <div className="catalog-empty">No track matches those filters. <button type="button" onClick={() => { setGroup("all"); setQuery(""); }}>Clear filters</button></div>}
      </section>

      <section className="catalog-academics">
        <div className="shell catalog-academics__inner"><span className="catalog-academics__icon"><GraduationCap size={25} /></span><div><p className="catalog-kicker">A DIFFERENT KIND OF GOAL</p><h2>Preparing for an exam, not a craft?</h2><p>Meet KR8 Academics with Next Gen Scholars: free live UTME, WAEC and NECO preparation for secondary students, graduates and retakers.</p></div><div className="catalog-academics__actions"><Link to="/academics">Explore Academics <ArrowUpRight size={15} /></Link><ButtonLink to="/apply?door=academic" variant="ghost" size="sm">Register interest</ButtonLink></div></div>
      </section>

      <section className="shell catalog-outcomes"><div className="catalog-outcomes__image"><img src="/media/portfolio-review.jpg" alt="A KR8 learner sharing a finished project with a mentor" loading="lazy" /><span>LEARN IT. MAKE IT. SHOW IT.</span></div><div><p className="catalog-kicker">02 / THE KR8 PROMISE</p><h2>Real work is the syllabus.</h2><p>Each pathway is built around a portfolio-ready outcome, live feedback and a clear weekly rhythm—not just a playlist to finish alone.</p><ul><li>A body of work you can share with a client or employer</li><li>Structured teaching from active practitioners</li><li>Published course expectations and a verifiable credential</li></ul><Link to="/admissions" className="catalog-outcomes__link">How admissions work <ArrowRight size={15} /></Link></div></section>
    </main>
  );
}
