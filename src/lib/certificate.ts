import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";
import type { CertificateTier } from "./types";
import { formatDate } from "./utils";
import { trackByKey, trackName } from "../data/academy";

/* Real KR8 certificate artwork, taken from the production repository.
   Dedicated templates exist for the four original tracks; every newer track
   renders on the official reusable master template. */
const TEMPLATES: Record<CertificateTier, Record<string, string>> = {
  Professionalism: {
    graphic: "/cert/professionalism_graphic.jpg",
    video: "/cert/professionalism_video.jpg",
    web: "/cert/professionalism_web.jpg",
    reusable: "/cert/reusable_professionalism.jpg",
  },
  Completion: {
    graphic: "/cert/completion_graphic.jpg",
    video: "/cert/completion_video.jpg",
    web: "/cert/completion_web.jpg",
    reusable: "/cert/reusable_completion.jpg",
  },
};

const SIGNATURES: Record<string, string> = {
  graphic: "/signatures/graphic_design_coach_signature.png",
  video: "/signatures/video_editing_coach_signature.png",
  web: "/signatures/web_dev_coach_signature.png",
  content_creation: "/signatures/content_creation_coach_signature.png",
  admin: "/signatures/admin_signature.png",
};

export const ACHIEVEMENT_TEXT: Record<CertificateTier, string> = {
  Professionalism:
    "demonstrating excellence and proficiency in turning client requests into client satisfaction.",
  Completion:
    "gaining hands-on experience in turning client requests into finished deliverables.",
};

export function templateFor(trackKey: string, tier: CertificateTier) {
  const dedicated = TEMPLATES[tier][trackKey];
  return { url: dedicated ?? TEMPLATES[tier].reusable, dynamic: !dedicated };
}

/** "John Thomas Theophilus" → "JOHN T. THEOPHILUS" (house standard). */
export function formatCertificateName(raw: string): string {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length <= 2) return parts.join(" ").toUpperCase();
  const first = parts[0];
  const last = parts[parts.length - 1];
  const middle = parts
    .slice(1, -1)
    .map((p) => {
      const clean = p.replace(/[^A-Za-z]/g, "");
      return clean ? `${clean[0].toUpperCase()}.` : "";
    })
    .filter(Boolean)
    .join(" ");
  return `${first} ${middle} ${last}`.toUpperCase();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

async function ensureFonts() {
  try {
    await document.fonts.ready;
  } catch {
    /* noop */
  }
}

export type CertificateRenderInput = {
  studentName: string;
  trackKey: string;
  tier: CertificateTier;
  code: string;
  kr8Id: string;
  issuedAt: number;
  verifyUrl: string;
  origin?: string;
};

export async function renderCertificate(input: CertificateRenderInput): Promise<string> {
  const { url, dynamic } = templateFor(input.trackKey, input.tier);
  await ensureFonts();

  const [template, qrData] = await Promise.all([
    loadImage(url),
    QRCode.toDataURL(input.verifyUrl, { margin: 1, width: 420, errorCorrectionLevel: "M" }),
  ]);
  const qrImage = await loadImage(qrData);

  const width = template.naturalWidth || 1600;
  const height = template.naturalHeight || 1040;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  ctx.drawImage(template, 0, 0, width, height);

  /* Name — sits above the printed line at 51.16% of the height. */
  const centerX = Math.round(width * 0.4185);
  const baselineY = Math.round(height * 0.5116);
  const maxWidth = Math.round(width * 0.48);
  let fontSize = Math.round(width * 0.036);
  const nameFont = (size: number) => `700 ${size}px "Bricolage Grotesque Variable", "Inter Variable", sans-serif`;
  const formatted = formatCertificateName(input.studentName);
  ctx.font = nameFont(fontSize);
  while (ctx.measureText(formatted).width > maxWidth && fontSize > 16) {
    fontSize -= 1;
    ctx.font = nameFont(fontSize);
  }
  ctx.fillStyle = "#12001f";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(formatted, centerX, baselineY - Math.max(8, Math.round(fontSize * 0.14)));

  /* Reusable master template needs the course, the achievement line and signatures. */
  if (dynamic) {
    const track = trackByKey(input.trackKey);
    const courseName = track?.name ?? trackName(input.trackKey);

    ctx.fillStyle = "#3d1250";
    ctx.font = `600 ${Math.round(width * 0.023)}px "Bricolage Grotesque Variable", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(courseName.toUpperCase(), width * 0.4185, height * 0.585);

    ctx.fillStyle = "#4a3f4f";
    ctx.font = `400 ${Math.round(width * 0.0135)}px "Inter Variable", sans-serif`;
    wrapText(ctx, `For successfully completing the 8-week ${courseName} cohort, ${ACHIEVEMENT_TEXT[input.tier]}`, width * 0.4185, height * 0.63, width * 0.5, width * 0.021);

    try {
      const coachSig = await loadImage(SIGNATURES[input.trackKey] ?? SIGNATURES.admin);
      drawSignature(ctx, coachSig, width * 0.13, height * 0.775, width * 0.16);
    } catch {
      /* signature is decorative — never block issuance */
    }
  }

  try {
    const adminSig = await loadImage(SIGNATURES.admin);
    drawSignature(ctx, adminSig, width * 0.475, height * 0.775, width * 0.17);
  } catch {
    /* noop */
  }

  /* QR verification badge, bottom-right. */
  const qrSize = Math.max(120, Math.min(240, Math.round(width * 0.105)));
  const padding = Math.round(qrSize * 0.09);
  const captionHeight = Math.round(qrSize * 0.26);
  const cardWidth = qrSize + padding * 2;
  const cardHeight = qrSize + padding * 2 + captionHeight;
  const marginX = Math.round(width * 0.045);
  const marginY = Math.round(height * 0.08);
  const qrX = width - cardWidth - marginX;
  const qrY = height - cardHeight - marginY;
  const radius = Math.round(cardWidth * 0.07);

  ctx.save();
  ctx.shadowColor = "rgba(20, 10, 26, 0.28)";
  ctx.shadowBlur = Math.round(qrSize * 0.1);
  ctx.shadowOffsetY = Math.round(qrSize * 0.03);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(qrX, qrY, cardWidth, cardHeight, radius);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(18, 0, 31, 0.14)";
  ctx.lineWidth = Math.max(1, Math.round(width * 0.0008));
  ctx.beginPath();
  ctx.roundRect(qrX, qrY, cardWidth, cardHeight, radius);
  ctx.stroke();

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrImage, qrX + padding, qrY + padding, qrSize, qrSize);
  ctx.restore();

  ctx.fillStyle = "#12001f";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.round(qrSize * 0.078)}px "Inter Variable", sans-serif`;
  ctx.fillText("SCAN TO VERIFY", qrX + cardWidth / 2, qrY + padding + qrSize + captionHeight * 0.34);
  ctx.fillStyle = "#7a1fa8";
  ctx.font = `700 ${Math.round(qrSize * 0.062)}px ui-monospace, monospace`;
  ctx.fillText(input.kr8Id, qrX + cardWidth / 2, qrY + padding + qrSize + captionHeight * 0.74);

  /* Footer reference line. */
  ctx.fillStyle = "#5a2a6b";
  ctx.font = `${Math.round(width * 0.0105)}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText(
    `${input.code}  ·  ISSUED ${formatDate(input.issuedAt).toUpperCase()}  ·  ACADEMY.KR8DIGITALS.COM`,
    width / 2,
    height - Math.round(height * 0.022)
  );

  return canvas.toDataURL("image/png");
}

function drawSignature(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  targetWidth: number
) {
  const ratio = img.naturalHeight / img.naturalWidth;
  const width = targetWidth;
  const height = width * ratio;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.drawImage(img, x, y - height, width, height);
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  lines.forEach((entry, index) => ctx.fillText(entry, x, y + index * lineHeight));
}

function toBlob(dataUrl: string): Blob {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "image/png" });
}

export function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadCertificatePdf(dataUrl: string, filename: string) {
  const blob = toBlob(dataUrl);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const doc = await PDFDocument.create();
  const image = await doc.embedPng(bytes);
  const page = doc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  const pdfBytes = await doc.save();
  const buffer = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(buffer);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
