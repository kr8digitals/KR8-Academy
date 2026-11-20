import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Search, ShieldCheck, Laptop, Smartphone, Monitor } from "lucide-react";
import { Link } from "react-router-dom";
import { TRACKS, TESTIMONIALS, PROGRAMME } from "../data/academy";
import { useSeo, organizationJsonLd } from "../lib/seo";
import { VerifyWidget } from "../components/showcase";

function deviceIcon(device: string) {
  if (device === "Phone only") return <Smartphone size={12} />;
  if (device === "Laptop required") return <Laptop size={12} />;
  return <Monitor size={12} />;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const featured = TESTIMONIALS.find((t) => t.featured) ?? TESTIMONIALS[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TRACKS;
    return TRACKS.filter((t) => `${t.name} ${t.tagline} ${t.snippet} ${t.device}`.toLowerCase().includes(q));
  }, [query]);

  useSeo({
    title: "KR8 Academy — Tuition-free digital skills. Live cohorts. Verified proof.",
    description: `Free 8-week cohorts. ${PROGRAMME.classDays} ${PROGRAMME.classTime}. Earn a verifiable certificate you can prove.`,
    path: "/",
    jsonLd: organizationJsonLd,
  });

  return (
    <main>
      {/* HERO - ink aurora, matches kr8digitals.vercel.app */}
      <section className="hero-aurora starfield relative overflow-hidden">
        <div className="shell relative z-10 pt-12 pb-10 lg:pt-16 lg:pb-14">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-center">
            <div>
              <p className="eyebrow">KR8 Academy · {PROGRAMME.cohortName} · {PROGRAMME.onboardingDate} onboarding</p>
              <h1 className="display display-xl mt-5">
                Pick a skill.
                <br />
                <span className="text-gradient">Practise with purpose.</span>
                <br />
                Earn your proof.
              </h1>
              <p className="lede mt-5 max-w-[50ch]">Tuition-free, 8-week live cohorts. You bring curiosity, we bring the roadmap. Classes {PROGRAMME.classDays} {PROGRAMME.classTime}. Assignments the next day. Mindset Shift on Sundays. Graduate with work you can defend anywhere.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/apply" className="btn btn-primary btn-lg">Find your starting point <ArrowRight size={18} /></Link>
                <Link to="/skills" className="btn btn-ghost btn-lg">Explore all 7 skills <ArrowUpRight size={16} /></Link>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-muted">
                <span className="pill pill-live">Applications open</span>
                <span>· Onboarding {PROGRAMME.onboardingDate} · First class {PROGRAMME.classesBeginDate}</span>
              </div>
            </div>
            <div className="relative">
              <div className="hero-photo aspect-[4/3] overflow-hidden">
                <img src="/media/hero-home.jpg" alt="KR8 learners collaborating in a sunlit studio" className="h-full w-full object-cover" fetchPriority="high" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 rounded-2xl bg-black/55 px-3 py-2.5 backdrop-blur">
                  <span className="flex items-center gap-2 text-[11px] font-semibold text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-live" /> Live cohorts · Aba · Lagos · Online</span>
                  <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-white/70">{PROGRAMME.beginnerWeeks} → {PROGRAMME.advancedWeeks}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="stat-card py-3"><div className="text-[10px] uppercase tracking-widest text-muted">Tuition</div><div className="stat-value text-[1.6rem]">₦0</div><div className="text-[10px] text-muted">forever free</div></div>
                <div className="stat-card py-3"><div className="text-[10px] uppercase tracking-widest text-muted">Skills</div><div className="stat-value text-[1.6rem]">7</div><div className="text-[10px] text-muted">to master</div></div>
                <div className="stat-card py-3"><div className="text-[10px] uppercase tracking-widest text-muted">Cohort</div><div className="stat-value text-[1.4rem]">{PROGRAMME.cohortName}</div><div className="text-[10px] text-muted">{PROGRAMME.classesBeginDate} start</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE WAYS - matches kr8digitals One brand three ways */}
      <section className="shell py-12 lg:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">One school, three ways to grow</p>
          <h2 className="display display-lg mt-4">Less scrolling. <span className="text-gradient">More making.</span></h2>
          <p className="lede mx-auto mt-3 max-w-[60ch]">Live lessons, real briefs, and feedback that actually moves your work forward. Not a video library.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <img src="/media/mentors-studio.jpg" alt="Mentors teaching in studio" className="h-44 w-full rounded-xl object-cover" loading="lazy" />
            <h3 className="mt-4 font-display text-[1.1rem] font-semibold">The school</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">Structured 8-week cohorts. 24 live classes, assignments every other day, Mindset Shift on Sundays. You earn attendance, feedback, and a certificate you can verify.</p>
            <ul className="mt-3 space-y-1 text-[12px] text-body"><li>✓ Zero cost, always</li><li>✓ Guided by working practitioners</li><li>✓ Accountability built in</li></ul>
          </div>
          <div className="card p-5">
            <img src="/media/community.jpg" alt="Community together" className="h-44 w-full rounded-xl object-cover" loading="lazy" onError={(e) => (e.currentTarget.style.display='none')} />
            <div className="tile-media h-44 hidden" style={{display: 'none'}}><img src="/media/cohort-critique.jpg" alt="Students reviewing work together" loading="lazy" /></div>
            <img src="/media/cohort-critique.jpg" alt="Students reviewing work together" className="h-44 w-full rounded-xl object-cover community-fallback" loading="lazy" />
            <h3 className="mt-4 font-display text-[1.1rem] font-semibold">The community</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">A tribe where status doesn’t decide who you are. Bonds form here, questions get answered, and nobody grows alone.</p>
            <ul className="mt-3 space-y-1 text-[12px] text-body"><li>✓ No status barriers</li><li>✓ Real accountability</li><li>✓ Lifelong network</li></ul>
          </div>
          <div className="card p-5">
            <img src="/media/graduates-stage.jpg" alt="Graduates on stage" className="h-44 w-full rounded-xl object-cover" loading="lazy" />
            <h3 className="mt-4 font-display text-[1.1rem] font-semibold">The proof</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">Graduation is earned: 80% attendance, 100% assignments, Mindset Shift, and a passing grade. Professionalism is rare — work KR8 can defend anywhere.</p>
            <ul className="mt-3 space-y-1 text-[12px] text-body"><li>✓ Verifiable QR certificate</li><li>✓ Public week-by-week report</li><li>✓ Employer introduction via KR8</li></ul>
          </div>
        </div>
      </section>

      {/* COURSES - matches Courses you can master */}
      <section className="shell py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="display display-md">Courses you can master, for free</h2>
            <p className="mt-2 max-w-[55ch] text-sm text-muted">Every course is free to learn. Pick one when you register and it becomes part of your KR8 ID. Filter by what you can do today.</p>
          </div>
          <label className="flex items-center gap-2 rounded-full border border-white/12 bg-raised px-3 py-2 text-sm">
            <Search size={16} className="text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try ‘design’ or ‘phone only’" className="bg-transparent outline-none placeholder:text-muted" />
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((track) => (
            <Link key={track.key} to={`/skills/${track.slug}`} className="group card card-lift overflow-hidden p-0">
              <div className="relative h-44 overflow-hidden">
                <img src={track.cover} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" loading="lazy" />
                <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-ink">{track.code} · {track.duration}</span>
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">{deviceIcon(track.device)} {track.device}</span>
              </div>
              <div className="p-4">
                <h3 className="font-display text-[1.05rem] font-semibold leading-tight">{track.name}</h3>
                <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">{track.tagline}</p>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-magenta-bright">Learn this skill <ArrowRight size={14} /></div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-raised px-4 py-3 text-sm text-muted">
          <strong className="text-white">Need help choosing?</strong> Website Development vs Front-End: Web lets you ship on your phone with WordPress/Framer AI. Front-End needs a laptop and teaches code (HTML/CSS/JS/React). <Link to="/skills" className="text-magenta-bright hover:underline">Compare all 7 →</Link>
        </div>
      </section>

      {/* MOTIONVERSE PROOF - coach work display */}
      <section className="shell py-8">
        <div className="card overflow-hidden">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 lg:p-8">
              <p className="eyebrow">Proof a coach can defend</p>
              <h2 className="display display-md mt-3">Your coach’s work is the standard</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">Stevenson (Motionverse) — Graphic Design — builds brand identities you can see in Lagos shops and on Instagram. When he calls your flyer “professional,” he means it can stand next to his. That’s what Professionalism means at KR8.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-base p-3"><div className="text-[11px] font-bold uppercase tracking-widest text-live">What you’ll make</div><div className="mt-1 text-sm">Brand package for a real local business — logo, flyer, social templates.</div></div>
                <div className="rounded-xl border border-white/10 bg-base p-3"><div className="text-[11px] font-bold uppercase tracking-widest text-live">How you’ll prove it</div><div className="mt-1 text-sm">5+ portfolio pieces + 2 final projects. Coach features exceptional work to verification (with your permission).</div></div>
              </div>
              <Link to="/skills/graphic-design" className="btn btn-ghost mt-5">See Graphic Design syllabus <ArrowUpRight size={14} /></Link>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-base p-3">
              <img src="/media/cover-graphic.jpg" alt="Graphic design brand package example" className="h-40 w-full rounded-xl object-cover" loading="lazy" />
              <img src="/media/cover-video.jpg" alt="Video editing timeline" className="h-40 w-full rounded-xl object-cover" loading="lazy" />
              <img src="/media/cover-web.jpg" alt="Website development showcase" className="h-40 w-full rounded-xl object-cover" loading="lazy" />
              <img src="/media/cover-frontend.jpg" alt="Front-end development code showcase" className="h-40 w-full rounded-xl object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="shell py-8">
        <h2 className="display display-md">From curious to creator, <span className="text-gradient">step by step</span></h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            { n: "01", title: "Register free", body: "Tell us your official name, WhatsApp, DOB, skill and device. Sign the pledge with your typed name.", accent: "#ff5bd8" },
            { n: "02", title: "Get your KR8 ID", body: "Permanent ID like KR82026R73HDGD. You see your WhatsApp classroom link immediately.", accent: "#e026c4" },
            { n: "03", title: "Learn & show up", body: "Mon/Wed/Fri classes, Tue/Thu/Sat assignments on WhatsApp. Redeem your personal code on the site.", accent: "#7a1fa8" },
            { n: "04", title: "Graduate & grow", body: "Verify your certificate, share your week-by-week report, or add another skill after release.", accent: "#38e0ff" },
          ].map((s) => (
            <div key={s.n} className="card p-5">
              <div className="step-orb" style={{ background: `linear-gradient(140deg, ${s.accent}, #1a0a2c)` }}>{s.n}</div>
              <h3 className="mt-4 font-display font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL - real graduate video autoplay */}
      <section className="shell py-8">
        <div className="panel-glow p-6 lg:p-8">
          <div className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="eyebrow">What students say — real videos, not actors</p>
              <h2 className="display display-md mt-3 text-white">“I thought it was just a WhatsApp group. <span className="text-gradient">Eight weeks later I had a portfolio.”</span></h2>
              <p className="mt-3 text-sm text-white/70">Hear {featured.name}, {featured.skill} — {featured.role}. Captions available. Muted autoplay; turn on sound when ready.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/60"><span>✓ Tuition-free</span><span>·</span><span>Live feedback</span><span>·</span><span>Verifiable proof</span></div>
              <Link to="/verify" className="btn btn-accent mt-5">Verify a graduate <ShieldCheck size={16} /></Link>
            </div>
            <div className="hero-photo aspect-video relative overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={featured.video} poster={featured.img} controls playsInline preload="none" className="h-full w-full object-cover" />
              <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">{featured.name} · {featured.duration}s</div>
            </div>
          </div>
        </div>
      </section>

      {/* VERIFY */}
      <section className="shell py-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="display display-md">Your creative journey <span className="text-gradient">starts free</span></h2>
            <p className="mt-2 text-sm text-muted">Join KR8 Academy today. Pick a skill, meet the tribe, and start building the future you actually want.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/apply" className="btn btn-primary">Register for free <ArrowRight size={16} /></Link>
              <a href="https://wa.me/2348125687509" target="_blank" rel="noreferrer" className="btn btn-ghost">Chat on WhatsApp</a>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-muted"><span>Mon/Wed/Fri 8–9pm WAT</span><span>·</span><span>Check-in 9pm–midnight</span><span>·</span><span>{PROGRAMME.cohortName} open</span></div>
          </div>
          <VerifyWidget compact={false} />
        </div>
      </section>
    </main>
  );
}
