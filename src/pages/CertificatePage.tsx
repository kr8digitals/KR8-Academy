import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Award, BadgeCheck, CalendarDays, ShieldCheck, ShieldX, User } from "lucide-react";
import { findCertificate, getStudent } from "../lib/store";
import { trackName } from "../data/academy";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { formatDate } from "../lib/utils";
import { ButtonLink, Pill } from "../components/ui";
import { CertificatePreview } from "../components/CertificatePreview";
import { LocalOnlyNotice } from "../components/LocalOnlyNotice";

export default function CertificatePage() {
  const { code = "" } = useParams();
  const db = useDb();
  const certificate = findCertificate(code);
  const owner = certificate ? getStudent(certificate.studentId) : undefined;

  useSeo({
    title: certificate ? `${certificate.tier} certificate record · ${certificate.studentNameSnapshot}` : "Certificate record not found",
    description: certificate
      ? `A local ${certificate.tier} certificate record in ${trackName(certificate.trackKey)} for code ${certificate.code}. This browser-only record is not an independent verification.`
      : "No matching certificate record was found in this browser's local Academy data.",
    path: `/certificate/${code}`,
    noindex: true,
  });

  if (!certificate) {
    return (
      <section className="shell py-24 text-center">
        <ShieldX size={30} className="mx-auto text-muted-2/60" />
        <h1 className="display display-md mt-4">Certificate not found</h1>
        <p className="lede mx-auto mt-3 max-w-md">
          No matching certificate record was found in this browser. Check the code or open this page in the browser profile that contains the local record.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink to="/verify" variant="primary">Search local records</ButtonLink>
          <ButtonLink to="/" variant="ghost">Back home</ButtonLink>
        </div>
      </section>
    );
  }

  const verifyUrl = `${window.location.origin}/certificate/${encodeURIComponent(certificate.code)}`;

  return (
    <>
      <section className="border-b border-white/10">
        <div className="shell py-10">
          <Link to="/verify" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition hover:text-white">
            <ArrowLeft size={13} /> Local record lookup
          </Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Local certificate record</p>
              <h1 className="display display-lg mt-2 max-w-[18ch]">
                {certificate.tier} certificate record
              </h1>
              <p className="mt-2 text-[14px] text-muted">
                {trackName(certificate.trackKey)} · {certificate.studentNameSnapshot}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {certificate.revoked ? <Pill tone="default">Marked revoked locally</Pill> : <Pill tone="live"><ShieldCheck size={12} /> Local record found</Pill>}
              <Pill>{certificate.tier}</Pill>
            </div>
          </div>
        </div>
      </section>

      <section className="shell grid gap-8 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <CertificatePreview
          input={{
            studentName: certificate.studentNameSnapshot,
            trackKey: certificate.trackKey,
            tier: certificate.tier,
            code: certificate.code,
            kr8Id: certificate.studentId,
            issuedAt: certificate.issuedAt,
            verifyUrl,
          }}
          filename={`KR8-${certificate.studentNameSnapshot.replace(/\s+/g, "-")}-${certificate.tier}`}
        />

        <aside>
          <div className="mb-4"><LocalOnlyNotice compact /></div>
          {certificate.revoked && (
            <div className="mb-4 rounded-xl border border-danger/40 bg-danger/12 p-4">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-danger">
                <ShieldX size={14} /> Marked revoked locally
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-danger">
                {certificate.revokedReason ?? "This browser’s local record is marked as revoked; the status is not independently verified."}
              </p>
            </div>
          )}

          <div className="card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Local record details</p>
            <dl className="mt-3 space-y-3 text-[12.5px]">
              <div className="flex items-start gap-2.5">
                <User size={14} className="mt-0.5 shrink-0 text-magenta-bright" />
                <div className="min-w-0">
                  <dt className="text-muted">Name in local record</dt>
                  <dd className="font-medium">{certificate.studentNameSnapshot}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <BadgeCheck size={14} className="mt-0.5 shrink-0 text-magenta-bright" />
                <div className="min-w-0">
                  <dt className="text-muted">KR8 ID</dt>
                  <dd className="font-mono text-[11.5px]">{certificate.studentId}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Award size={14} className="mt-0.5 shrink-0 text-magenta-bright" />
                <div className="min-w-0">
                  <dt className="text-muted">Award</dt>
                  <dd className="font-medium">Certificate of {certificate.tier} · {trackName(certificate.trackKey)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CalendarDays size={14} className="mt-0.5 shrink-0 text-magenta-bright" />
                <div className="min-w-0">
                  <dt className="text-muted">Issued</dt>
                  <dd className="font-medium">{formatDate(certificate.issuedAt, { day: "numeric", month: "long", year: "numeric" })}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-magenta-bright" />
                <div className="min-w-0">
                  <dt className="text-muted">Issuer name stored</dt>
                  <dd className="font-medium">{certificate.issuedBy}</dd>
                </div>
              </div>
            </dl>

            <div className="mt-4 border-t border-white/8 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Certificate code</p>
              <p className="mt-1 break-all font-mono text-[11px]">{certificate.code}</p>
            </div>
          </div>

          <div className="mt-4 card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Share this local record link</p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              The link and certificate QR open this page, but another browser will not have access to this profile’s local data. They do not provide independent or global verification.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  navigator.clipboard?.writeText(verifyUrl);
                }}
              >
                Copy local record link
              </button>
              {owner && (
                <Link to={`/verify/${encodeURIComponent(owner.id)}`} className="btn btn-ghost btn-sm">
                  Student record
                </Link>
              )}
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Questions about this local record? Email{" "}
            <a className="font-semibold text-magenta-bright" href={`mailto:${db.settings.supportEmail}`}>{db.settings.supportEmail}</a>{" "}
            with the certificate code.
          </p>
        </aside>
      </section>
    </>
  );
}
