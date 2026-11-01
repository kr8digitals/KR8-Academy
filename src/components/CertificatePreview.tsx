import { useEffect, useState } from "react";
import { Download, FileText, Loader2, ShieldCheck } from "lucide-react";
import { downloadCertificatePdf, downloadDataUrl, renderCertificate, type CertificateRenderInput } from "../lib/certificate";
import { cn } from "../lib/utils";
import { useToast } from "../lib/toast";

export function CertificatePreview({
  input,
  className,
  showActions = true,
  filename = "kr8-academy-certificate",
}: {
  input: CertificateRenderInput;
  className?: string;
  showActions?: boolean;
  filename?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const toast = useToast();

  useEffect(() => {
    let alive = true;
    setDataUrl(null);
    setError(null);
    renderCertificate(input)
      .then((url) => {
        if (alive) setDataUrl(url);
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : "Could not render the certificate.");
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.studentName, input.trackKey, input.tier, input.code, input.kr8Id, input.verifyUrl, input.issuedAt]);

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white shadow-[0_24px_60px_-40px_rgba(20,15,26,0.5)]">
        {dataUrl ? (
          <img src={dataUrl} alt={`KR8 Academy certificate of ${input.tier.toLowerCase()} for ${input.studentName}`} className="block w-full" />
        ) : error ? (
          <div className="grid aspect-[1.55/1] place-items-center p-6 text-center">
            <div>
              <p className="text-sm font-semibold text-danger">Preview unavailable</p>
              <p className="mt-1 text-xs text-muted">{error}</p>
            </div>
          </div>
        ) : (
          <div className="grid aspect-[1.55/1] place-items-center">
            <Loader2 size={22} className="spin text-magenta-bright/70" />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="pill pill-magenta">
          <ShieldCheck size={12} /> Verifiable
        </span>
        <span className="pill">{input.tier}</span>
        <span className="ml-auto font-mono text-[10px] text-muted">{input.code}</span>
      </div>

      {showActions && dataUrl && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={cn("btn btn-primary btn-sm")}
            disabled={busy !== null}
            onClick={async () => {
              setBusy("pdf");
              try {
                await downloadCertificatePdf(dataUrl, `${filename}.pdf`);
                toast.success("Certificate downloaded", "A print-ready PDF has been saved.");
              } catch {
                toast.error("Download failed", "Please try again in a moment.");
              } finally {
                setBusy(null);
              }
            }}
          >
            {busy === "pdf" ? <Loader2 size={14} className="spin" /> : <FileText size={14} />}
            Download PDF
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={busy !== null}
            onClick={() => {
              downloadDataUrl(`${filename}.png`, dataUrl);
              toast.success("Image saved", "High-resolution PNG downloaded.");
            }}
          >
            <Download size={14} /> Save PNG
          </button>
        </div>
      )}
    </div>
  );
}
