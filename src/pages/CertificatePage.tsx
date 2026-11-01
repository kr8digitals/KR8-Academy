import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Award, BadgeCheck, CalendarDays, ShieldCheck, ShieldX, User } from "lucide-react";
import { findCertificate, getStudent } from "../lib/store";
import { trackName } from "../data/academy";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";
import { formatDate } from "../lib/utils";
import { ButtonLink, Pill } from "../components/ui";
import { CertificatePreview } from "../components/CertificatePreview";

export default function CertificatePage() {
  const { code = "" } = useParams();
  const db = useDb();
  const certificate = findCertificate(code);
  const owner = certificate ? getStudent(certificate.studentId) : undefined;

  useSeo({
    title: certificate ? `${certificate.tier} certificate · ${certificate.studentNameSnapshot}` : "Certificate not found",
    description: certificate
      ? `${certificate.tier} certificate in ${trackName(certificate.trackKey)} issued by KR8 Academy on ${formatDate(certificate.issuedAt)}. Verified credential ${certificate.code}.`
      : "This certificate could not be found in the KR8 Academy register.",
    path: `/certificate/${code}`,
    noindex: true,
  });

  if (!certificate) {
    return (
      <section className="shell py-24 text-center">
        <ShieldX size={30} className="mx-auto text-muted-2/60" />
        <h1 className="display display-md mt-4">Certificate not found</h1>
        <p className="lede mx-auto mt-3 max-w-md">
          No certificate matches “{code}”. Check the code on the document, or search the public register.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink to="/verify" variant="primary">Search the register</ButtonLink>
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
            <ArrowLeft size={13} /> Verification centre
          </Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Issued credential</p>
              <h1 className="display display-lg mt-2 max-w-[18ch]">
                {certificate.tier} certificate
              </h1>
              <p className="mt-2 text-[14px] text-muted">
                {trackName(certificate.trackKey)} · {certificate.studentNameSnapshot}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {certificate.revoked ? <Pill tone="default">Revoked</Pill> : <Pill tone="live"><ShieldCheck size={12} /> Verified</Pill>}
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
          {certificate.revoked && (
            <div className="mb-4 rounded-xl border border-danger/40 bg-danger/12 p-4">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-danger">
                <ShieldX size={14} /> Credential revoked
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-danger">
                {certificate.revokedReason ?? "This credential has been withdrawn by the academy."}
              </p>
            </div>
          )}

          <div className="card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Credential details</p>
            <dl className="mt-3 space-y-3 text-[12.5px]">
              <div className="flex items-start gap-2.5">
                <User size={14} className="mt-0.5 shrink-0 text-magenta-bright" />
                <div className="min-w-0">
                  <dt className="text-muted">Graduate</dt>
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
                  <dt className="text-muted">Signed by</dt>
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Share or verify</p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Send this page to an employer, or scan the QR on the certificate — both resolve to the same public
              record.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  navigator.clipboard?.writeText(verifyUrl);
                }}
              >
                Copy verification link
              </button>
              {owner && (
                <Link to={`/verify/${encodeURIComponent(owner.id)}`} className="btn btn-ghost btn-sm">
                  Student record
                </Link>
              )}
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Questions about this credential? Email{" "}
            <a className="font-semibold text-magenta-bright" href={`mailto:${db.settings.supportEmail}`}>{db.settings.supportEmail}</a>{" "}
            with the certificate code.
          </p>
        </aside>
      </section>
    </>
  );
}
