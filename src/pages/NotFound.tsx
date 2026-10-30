import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import { TRACKS } from "../data/academy";
import { useSeo } from "../lib/seo";
import { ButtonLink } from "../components/ui";

export default function NotFound() {
  useSeo({ title: "Page not found", description: "That page does not exist at KR8 Academy.", path: "/404", noindex: true });

  return (
    <section className="shell grid min-h-[70vh] place-items-center py-16">
      <div className="max-w-xl text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-ink/12 bg-cream">
          <Compass size={22} className="text-plum" />
        </span>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Error 404</p>
        <h1 className="display display-xl mt-3">This room is empty.</h1>
        <p className="lede mx-auto mt-4 max-w-md">
          The page you were looking for has moved, graduated or never existed. The work, however, is still here.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <ButtonLink to="/" variant="primary">Back to the academy</ButtonLink>
          <ButtonLink to="/tracks" variant="ghost">Browse tracks</ButtonLink>
        </div>

        <div className="mt-10 border-t border-ink/10 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Popular right now</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {TRACKS.slice(0, 4).map((track) => (
              <Link
                key={track.key}
                to={`/tracks/${track.slug}`}
                className="rounded-full border border-ink/12 bg-cream px-3 py-1.5 text-[11.5px] font-medium text-ink/70 transition hover:border-plum/40 hover:text-plum"
              >
                {track.name}
              </Link>
            ))}
            <Link to="/verify" className="rounded-full border border-ink/12 bg-cream px-3 py-1.5 text-[11.5px] font-medium text-ink/70 transition hover:border-plum/40 hover:text-plum">
              Verify a certificate
            </Link>
          </div>
        </div>

        <Link to="/" className="mt-8 inline-flex items-center gap-1.5 text-[12px] text-muted transition hover:text-ink">
          <ArrowLeft size={13} /> Home
        </Link>
      </div>
    </section>
  );
}
