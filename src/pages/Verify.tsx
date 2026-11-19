import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Download,
  Search,
  ShieldCheck,
  ShieldX,
  UserRound,
} from "lucide-react";
import { findCertificate, findStudentByIdentifier, getCertificates, getStudent } from "../lib/store";
import { trackName } from "../data/academy";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { formatDate } from "../lib/utils";
import { ButtonLink, Pill, SectionHead, Avatar } from "../components/ui";
import { SectionIndex } from "../components/sections";
import { CertificatePreview } from "../components/CertificatePreview";
import { LocalOnlyNotice } from "../components/LocalOnlyNotice";

type Result =
  | { kind: "certificate"; code: string; name: string; trackKey: string; tier: "Completion" | "Professionalism"; issuedAt: number; revoked?: boolean; studentId: string }
  | { kind: "student"; id: string; name: string; trackKey: string; status: string; joined: number; certificates: ReturnType<typeof getCertificates> }
  | { kind: "none" };

export default function Verify() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const db = useDb();
  const [query, setQuery] = useState(identifier ?? "");
  const [submitted, setSubmitted] = useState(identifier ?? "");

  useEffect(() => {
    if (identifier) {
      setQuery(identifier);
      setSubmitted(identifier);
    }
  }, [identifier]);

  useSeo({
    title: "Local KR8 credential records",
    description:
      "Look up student IDs and certificate codes saved in this browser. This local-only preview has no shared or authoritative credential register.",
    path: "/verify",
  });

  const result: Result = useMemo(() => {
    const value = submitted.trim();
    if (!value) return { kind: "none" };
    const certificate = findCertificate(value);
    if (certificate) {
      const owner = getStudent(certificate.studentId);
      return {
        kind: "certificate",
        code: certificate.code,
        name: certificate.studentNameSnapshot || owner?.name || "Graduate",
        trackKey: certificate.trackKey,
        tier: certificate.tier,
        issuedAt: certificate.issuedAt,
        revoked: certificate.revoked,
        studentId: certificate.studentId,
      };
    }
    const student = findStudentByIdentifier(value);
    if (student) {
      return {
        kind: "student",
        id: student.id,
        name: student.name,
        trackKey: student.trackKey,
        status: student.status,
        joined: student.createdAt,
        certificates: getCertificates(student.id),
      };
    }
    return { kind: "none" };
  }, [submitted, db]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 on-dark">
        <img
          src="/media/hero-verify.jpg"
          alt="A smartphone scanning the QR code on a printed KR8 certificate — the code glowing cyan on screen and on the page"
          className="absolute inset-0 h-full w-full object-cover object-[64%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07050f]/78 via-[#07050f]/50 to-[#07050f]/6" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07050f]/70 via-[#07050f]/10 to-[#07050f]/32" aria-hidden="true" />
        <div className="shell relative py-16 sm:py-24">
          <SectionIndex index="Local lookup" label="This browser only" />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="display display-xl max-w-[16ch]">Look up a local record.</h1>
              <p className="lede mt-5 max-w-xl">
                Paste a KR8 ID or certificate code to search the records saved in this browser. This preview does not
                connect to a shared register and cannot independently establish a credential’s authenticity or validity.
              </p>
              <div className="mt-5"><LocalOnlyNotice compact /></div>

              <form
                className="mt-7 flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  const value = query.trim();
                  setSubmitted(value);
                  if (value) navigate(`/verify/${encodeURIComponent(value)}`, { replace: true });
                }}
              >
                <label className="sr-only" htmlFor="verify-page-input">KR8 ID or certificate code</label>
                <input
                  id="verify-page-input"
                  className="input h-[46px] sm:max-w-md"
                  placeholder="KR8-2026-GD-0001 or KR8-CERT-…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                  autoFocus
                />
                <button type="submit" className="btn btn-primary shrink-0">
                  <Search size={15} /> Look up record
                </button>
              </form>
              <p className="mt-2.5 text-[11px] text-muted">
                Tip: open your dashboard to copy your exact KR8 ID. Certificate codes start with KR8-CERT.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-[#120822]/85 p-5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-magenta-bright" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">What this lookup shows</p>
              </div>
              <ul className="mt-3 space-y-2 text-[12.5px] text-muted">
                <li className="flex gap-2"><span className="text-magenta-bright">·</span> Whether a matching record exists in this browser</li>
                <li className="flex gap-2"><span className="text-magenta-bright">·</span> The name, track and tier stored in that record</li>
                <li className="flex gap-2"><span className="text-magenta-bright">·</span> The issue date and any local revocation flag</li>
              </ul>
              <p className="mt-4 border-t border-white/8 pt-3 text-[11px] text-muted">
                Anyone with access to this browser can edit local data. Contact the Academy through a separately confirmed channel before relying on a certificate.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-12">
        {!submitted && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {db.certificates.slice(0, 4).map((cert) => (
              <Link
                key={cert.id}
                to={`/certificate/${encodeURIComponent(cert.code)}`}
                className="card card-lift p-4"
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted">{cert.tier}</p>
                <p className="mt-1.5 truncate font-display text-[14px] font-semibold">{cert.studentNameSnapshot}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted">{trackName(cert.trackKey)}</p>
                <p className="mt-3 font-mono text-[9px] text-muted">{cert.code}</p>
              </Link>
            ))}
          </div>
        )}

        {submitted && result.kind === "none" && (
          <div className="mx-auto max-w-xl rounded-2xl border border-danger/40 bg-danger/12 p-6 text-center">
            <ShieldX size={26} className="mx-auto text-red-500" />
            <h2 className="display mt-3 text-xl">No record found</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-body">
              We could not match “{submitted}”. Check for typos, use the full KR8 ID, or contact the academy at{" "}
              <a className="font-semibold text-magenta-bright" href={`mailto:${db.settings.supportEmail}`}>{db.settings.supportEmail}</a>.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setQuery(""); setSubmitted(""); navigate("/verify"); }}>
                Try another code
              </button>
            </div>
          </div>
        )}

        {submitted && result.kind === "certificate" && (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <div className={`rounded-2xl border p-5 ${result.revoked ? "border-danger/40 bg-danger/10" : "border-live/25 bg-live/[0.06]"}`}>
                <div className="flex items-center gap-2">
                  {result.revoked ? <ShieldX size={18} className="text-danger" /> : <BadgeCheck size={18} className="text-live" />}
                  <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${result.revoked ? "text-danger" : "text-live"}`}>
                    {result.revoked ? "Marked revoked locally" : "Local record found"}
                  </p>
                </div>
                <h2 className="display mt-3 text-2xl">{result.name}</h2>
                <p className="mt-1 text-[13px] text-body">
                  {result.tier} · {trackName(result.trackKey)}
                </p>
                <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 text-[12px] sm:grid-cols-2">
                  <p className="text-muted">Certificate code <span className="mt-0.5 block font-mono text-[11px] text-white">{result.code}</span></p>
                  <p className="text-muted">Issued <span className="mt-0.5 block font-medium text-white">{formatDate(result.issuedAt, { day: "numeric", month: "long", year: "numeric" })}</span></p>
                </div>
                {result.revoked && (
                  <p className="mt-3 rounded-lg bg-danger/15 p-2.5 text-[11px] text-danger">
                    This browser’s local record is marked as revoked. The local data is editable and is not an authoritative status check.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/certificate/${encodeURIComponent(result.code)}`} className="btn btn-primary btn-sm">
                    <Download size={14} /> View & download
                  </Link>
                  <Link to={`/verify/${encodeURIComponent(result.studentId)}`} className="btn btn-ghost btn-sm">
                    <UserRound size={14} /> Student record
                  </Link>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-raised p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">What this local record contains</p>
                <p className="mt-2 text-[12px] leading-relaxed text-muted">
                  This browser has a saved certificate entry matching the code. There is no shared register or cryptographic signature in this local-only app, so the page cannot prove the issuer, identity or current validity to another person. The QR code opens this page but does not fetch a central record.
                </p>
              </div>
            </div>

            <CertificatePreview
              input={{
                studentName: result.name,
                trackKey: result.trackKey,
                tier: result.tier,
                code: result.code,
                kr8Id: result.studentId,
                issuedAt: result.issuedAt,
                verifyUrl: `${window.location.origin}/certificate/${encodeURIComponent(result.code)}`,
              }}
              filename={`KR8-${result.name.replace(/\s+/g, "-")}-${result.tier}`}
            />
          </div>
        )}

        {submitted && result.kind === "student" && (
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <Avatar name={result.name} src={getStudent(result.id)?.avatar} size={52} ring />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-live">Local student record</p>
                  <h2 className="display truncate text-xl">{result.name}</h2>
                </div>
              </div>
              <div className="mt-5 space-y-2.5 border-t border-white/8 pt-4 text-[12.5px]">
                <p className="flex items-center justify-between gap-3"><span className="text-muted">KR8 ID</span><span className="font-mono text-[11px]">{result.id}</span></p>
                <p className="flex items-center justify-between gap-3"><span className="text-muted">Track</span><span className="font-medium">{trackName(result.trackKey)}</span></p>
                <p className="flex items-center justify-between gap-3"><span className="text-muted">Status</span><span className="font-medium capitalize">{result.status}</span></p>
                <p className="flex items-center justify-between gap-3"><span className="text-muted">Joined</span><span className="font-medium">{formatDate(result.joined)}</span></p>
                <p className="flex items-center justify-between gap-3"><span className="text-muted">Certificates</span><span className="font-medium">{result.certificates.filter((c) => !c.revoked).length}</span></p>
              </div>
              <p className="mt-4 rounded-lg bg-base p-3 text-[11px] leading-relaxed text-muted">
                This browser contains a student record; it is not proof of enrollment. The app has no shared or authoritative credential register.
              </p>
            </div>

            <div>
              <SectionHead eyebrow="Credentials" title="Issued certificates" />
              {result.certificates.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-white/15 p-6 text-center">
                  <Award size={20} className="mx-auto text-muted-2/70" />
                  <p className="mt-2 text-[13px] font-medium">No certificate issued yet</p>
                  <p className="mt-1 text-[12px] text-muted">This student is still working through the cohort.</p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {result.certificates.map((cert) => (
                    <Link key={cert.id} to={`/certificate/${encodeURIComponent(cert.code)}`} className="card card-lift flex items-center gap-3 p-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-magenta-fill text-white"><Award size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">{cert.tier} · {trackName(cert.trackKey)}</p>
                        <p className="font-mono text-[10px] text-muted">{cert.code}</p>
                      </div>
                      {cert.revoked ? <Pill>Marked revoked locally</Pill> : <Pill tone="live">Local record</Pill>}
                      <ArrowRight size={14} className="text-muted-2/70" />
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <ButtonLink to="/leaderboard" variant="ghost" arrow>
                  See the cohort leaderboard
                </ButtonLink>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
