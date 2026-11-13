import { useMemo, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Check, Clock3, GraduationCap, Laptop, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { TRACKS } from "../data/academy";
import { useDb } from "../lib/hooks";
import { useSeo, organizationJsonLd } from "../lib/seo";
import { VerifyWidget } from "../components/showcase";

const PATHWAYS = ["All pathways", "Design", "Technology", "Content", "Business"] as const;
type Pathway = (typeof PATHWAYS)[number];

function pathwayFor(name: string): Exclude<Pathway, "All pathways"> {
  if (/design/i.test(name)) return "Design";
  if (/web|front-end/i.test(name)) return "Technology";
  if (/content|video/i.test(name)) return "Content";
  return "Business";
}

export default function Home() {
  const db = useDb();
  const [query, setQuery] = useState("");
  const [pathway, setPathway] = useState<Pathway>("All pathways");
  const listedTracks = useMemo(() => TRACKS.filter((track) => {
    const matchesQuery = `${track.name} ${track.tagline} ${track.snippet}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (pathway === "All pathways" || pathwayFor(track.name) === pathway);
  }), [query, pathway]);

  useSeo({
    title: "Make something real — KR8 Digitals' Academy",
    description: "Free, live digital-skills cohorts and exam preparation. Learn with working practitioners, build a portfolio and earn proof you can verify.",
    path: "/",
    jsonLd: organizationJsonLd,
  });

  return (
    <main className="home-reimagined">
      <section className="home-hero">
        <div className="home-hero__inner">
          <div className="home-hero__copy">
            <p className="home-kicker"><span className="home-kicker__dot" /> KR8 DIGITRIBE · LEARN BY MAKING</p>
            <h1>Make something<br /><em>real.</em></h1>
            <p className="home-hero__lede">A skill you can sell. A portfolio you can show. A classroom that keeps showing up for you.</p>
            <div className="home-actions">
              <Link to="/apply" className="home-button home-button--ink">Find your starting point <ArrowRight size={17} /></Link>
              <Link to="/skills" className="home-text-link">Explore the skills <ArrowUpRight size={16} /></Link>
            </div>
            <div className="home-proofline"><ShieldCheck size={16} /><span>Tuition-free · live mentors · verifiable credentials</span></div>
          </div>
          <div className="home-hero__visual">
            <img className="home-hero__image" src="/media/hero-home.jpg" alt="KR8 learners building projects together in a sunlit creative studio" fetchPriority="high" />
            <div className="home-image-label"><span className="home-live-dot" /> A classroom that builds together <span>ABA · LAGOS · ONLINE</span></div>
            <div className="home-hero-note"><span className="home-note-mark">✳</span><span><strong>Free to join.</strong><br />Built around doing.</span></div>
          </div>
          <a href="#pathways" className="home-scroll"><ArrowDown size={14} /> SCROLL TO FIND YOUR PATH</a>
        </div>
        <div className="home-marquee" aria-label="Learn, make, share, repeat"><div>LEARN BY DOING <b>✳</b> MAKE WORK THAT MATTERS <b>✳</b> YOUR NEXT CHAPTER STARTS HERE <b>✳</b> LEARN BY DOING <b>✳</b></div></div>
      </section>

      <section className="home-pathways" id="pathways">
        <div className="home-section-heading">
          <div><p className="home-kicker">01 / PICK A DIRECTION</p><h2>What do you want<br />to make possible?</h2></div>
          <p>Start where you are. Choose a craft, join a live cohort, and leave with work that proves what you can do.</p>
        </div>
        <div className="home-discovery">
          <label className="home-search"><Search size={17} /><span className="sr-only">Search pathways</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘design’ or ‘video’" /></label>
          <div className="home-filters" role="group" aria-label="Filter pathways">
            {PATHWAYS.map((item) => <button key={item} type="button" onClick={() => setPathway(item)} aria-pressed={pathway === item} className={pathway === item ? "is-selected" : ""}>{item}</button>)}
          </div>
        </div>
        <div className="home-track-grid">
          {listedTracks.map((track, index) => (
            <Link className="home-track-card" to={`/skills/${track.slug}`} key={track.key}>
              <div className="home-track-card__image"><img src={track.cover} alt="" loading="lazy" /><span className="home-track-index">0{index + 1}</span><span className="home-track-arrow"><ArrowUpRight size={18} /></span></div>
              <div className="home-track-card__body"><span className="home-track-category">{pathwayFor(track.name)} · {track.duration}</span><h3>{track.name}</h3><p>{track.tagline}</p><span className="home-track-link">See where it can take you <ArrowRight size={14} /></span></div>
            </Link>
          ))}
          {listedTracks.length === 0 && <div className="home-empty">No pathway matches that search yet. Try another word or <button onClick={() => { setQuery(""); setPathway("All pathways"); }}>view every pathway</button>.</div>}
        </div>
        <div className="home-all-link"><Link to="/skills">See the full learning catalogue <ArrowRight size={15} /></Link><span>{TRACKS.length} practical skill pathways</span></div>
      </section>

      <section className="home-academic">
        <div className="home-academic__photo"><img src="/media/academics-evclass.jpg" alt="Students preparing together in a welcoming classroom" loading="lazy" /><span>ANOTHER WAY INTO YOUR FUTURE</span></div>
        <div className="home-academic__copy"><p className="home-kicker">02 / THE ACADEMIC DOOR</p><h2>Big exams.<br /><em>Less alone.</em></h2><p>Live UTME, WAEC and NECO preparation with teachers who explain the why—not just the answer. Come as you are, from SS1 to retaker.</p><div className="home-academic-facts"><span><BookOpen size={16} /> English, maths & your subjects</span><span><Clock3 size={16} /> Monday · Wednesday · Friday</span><span><Check size={16} /> No tuition. No registration fee.</span></div><Link to="/academics" className="home-button home-button--outline">Meet KR8 Academics <ArrowRight size={16} /></Link></div>
      </section>

      <section className="home-method">
        <div className="home-method__top"><p className="home-kicker">03 / HOW WE LEARN</p><h2>Less scrolling.<br /><em>More making.</em></h2><p>Learning should feel like progress, not another tab left open. Here’s the rhythm we build around.</p></div>
        <div className="home-steps">
          {[{ n: "01", title: "Learn live", body: "Three focused sessions a week with mentors who work in the field.", icon: Laptop }, { n: "02", title: "Make every week", body: "Small, real briefs turn new ideas into a portfolio you can stand behind.", icon: Sparkles }, { n: "03", title: "Show your proof", body: "Graduate with a verifiable KR8 ID and a body of work that speaks for itself.", icon: ShieldCheck }].map(({ n, title, body, icon: Icon }) => <article className="home-step" key={n}><span className="home-step__number">{n}</span><Icon size={21} /><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </section>

      <section className="home-proof">
        <div className="home-proof__image"><img src="/media/cover-graphic.jpg" alt="A student’s graphic design project in progress" loading="lazy" /><span>MADE IN THE COHORT</span></div>
        <div className="home-proof__copy"><p className="home-kicker">04 / WORK THAT TRAVELS WITH YOU</p><h2>Your certificate is the beginning. <em>Your work is the proof.</em></h2><p>Build while you learn. Then take your projects, your KR8 ID and your next step with you—whether that’s a client, a role or another big goal.</p><Link to="/verify" className="home-text-link">See how credentials are verified <ArrowUpRight size={16} /></Link></div>
      </section>

      <section className="home-credential"><div><p className="home-kicker">05 / TRUST, WITH RECEIPTS</p><h2>Check the work.<br /><em>Check the credential.</em></h2><p>Every KR8 ID and certificate has a public record. Verify one before you hire, partner or share.</p></div><VerifyWidget compact /></section>

      <section className="home-final"><div className="home-final__mark">✳</div><p className="home-kicker">YOUR NEXT CHAPTER, ON YOUR TERMS</p><h2>Curious is a<br /><em>good place to start.</em></h2><p>Take a look around. When you’re ready, there’s a seat for you.</p><div className="home-actions"><Link to="/apply" className="home-button home-button--lime">Start a free application <ArrowRight size={17} /></Link><Link to="/admissions" className="home-final__secondary">See how admissions work</Link></div><div className="home-final__meta"><span><GraduationCap size={15} /> A KR8 Digitals school</span><span>Always tuition-free</span><span>{db.settings.cohortName} · applications & info</span></div></section>
    </main>
  );
}
