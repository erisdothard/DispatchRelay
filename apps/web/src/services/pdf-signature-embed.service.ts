import { PDFDocument, rgb } from 'pdf-lib';

export interface EmbedSignatureParams {
  pdfUrl: string; // Original unsigned BOL PDF URL
  signatureDataUrl: string; // Canvas signature as data URL (image/png)
  signatoryName: string; // "John Doe"
  signedAt: Date; // Timestamp
}

export interface EmbedSignatureResult {
  blob: Blob;
  docHash: string; // SHA-256 of unsigned PDF
  signedDocHash: string; // SHA-256 of signed PDF
}

/** Compute SHA-256 hex digest of an ArrayBuffer using Web Crypto API. */
async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];

function hasMagic(bytes: ArrayBuffer, magic: number[]): boolean {
  const head = new Uint8Array(bytes.slice(0, magic.length));
  return magic.every((b, i) => head[i] === b);
}

/** Decode any browser-renderable image (e.g. SVG, WebP) to PNG bytes via a canvas. */
async function rasterizeToPng(
  bytes: ArrayBuffer,
  contentType: string,
): Promise<ArrayBuffer | null> {
  if (typeof document === 'undefined') return null;
  const url = URL.createObjectURL(new Blob([bytes], { type: contentType || 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Unsupported image'));
      img.src = url;
    });
    const scale = Math.min(2, 2000 / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round((img.naturalWidth || 612) * scale);
    canvas.height = Math.round((img.naturalHeight || 792) * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    return blob ? await blob.arrayBuffer() : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Open the source as a PDF. Drivers often upload a photo of the paper BOL instead of a PDF —
 * in that case wrap the image on a Letter page, leaving room for the signature block below it.
 */
async function loadAsPdf(bytes: ArrayBuffer, contentType: string): Promise<PDFDocument> {
  if (hasMagic(bytes, PDF_MAGIC)) return PDFDocument.load(bytes);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const png = hasMagic(bytes, PNG_MAGIC)
    ? bytes
    : hasMagic(bytes, JPEG_MAGIC)
      ? null
      : await rasterizeToPng(bytes, contentType);
  const image = hasMagic(bytes, JPEG_MAGIC)
    ? await pdfDoc.embedJpg(bytes)
    : png
      ? await pdfDoc.embedPng(png)
      : null;

  if (image) {
    const box = { x: 40, y: 240, width: 532, height: 512 };
    const scale = Math.min(box.width / image.width, box.height / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    page.drawImage(image, {
      x: box.x + (box.width - width) / 2,
      y: box.y + (box.height - height) / 2,
      width,
      height,
    });
  } else {
    page.drawText('Original document attached separately.', {
      x: 50,
      y: 700,
      size: 11,
      color: rgb(0.3, 0.3, 0.3),
    });
  }
  return pdfDoc;
}

export async function embedSignatureIntoPdf(
  params: EmbedSignatureParams,
): Promise<EmbedSignatureResult> {
  const { pdfUrl, signatureDataUrl, signatoryName, signedAt } = params;

  // 1. Load original document (PDF, or an image of the paper BOL)
  const response = await fetch(pdfUrl);
  if (!response.ok) throw new Error(`Failed to load PDF (${response.status})`);
  const contentType = response.headers.get('content-type') ?? '';
  const pdfBytes = await response.arrayBuffer();

  // 1b. Hash unsigned original
  const docHash = await sha256Hex(pdfBytes);

  const pdfDoc = await loadAsPdf(pdfBytes, contentType);

  // 2. Embed signature PNG
  const signatureImageBytes = await fetch(signatureDataUrl).then((r) => {
    if (!r.ok) throw new Error(`Failed to load signature image (${r.status})`);
    return r.arrayBuffer();
  });
  const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

  // 3. Get last page (or create signature page)
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { width, height } = lastPage.getSize();

  // 4. Draw signature block at bottom of last page
  const signatureBlockY = 100; // 100px from bottom
  const signatureBlockX = 50; // 50px from left

  // Background box for signature block
  lastPage.drawRectangle({
    x: signatureBlockX - 10,
    y: signatureBlockY - 10,
    width: width - 100,
    height: 120,
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  });

  // "ELECTRONICALLY SIGNED" header
  lastPage.drawText('ELECTRONICALLY SIGNED', {
    x: signatureBlockX,
    y: signatureBlockY + 90,
    size: 10,
    color: rgb(0.2, 0.6, 0.2),
  });

  // Signature image
  lastPage.drawImage(signatureImage, {
    x: signatureBlockX,
    y: signatureBlockY + 30,
    width: 180,
    height: 50,
  });

  // Signatory name
  lastPage.drawText(`Signed by: ${signatoryName}`, {
    x: signatureBlockX + 200,
    y: signatureBlockY + 55,
    size: 10,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Timestamp
  const timestamp = signedAt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  lastPage.drawText(`Date: ${timestamp}`, {
    x: signatureBlockX + 200,
    y: signatureBlockY + 35,
    size: 10,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Verification text
  lastPage.drawText('This document has been electronically signed via FreightX', {
    x: signatureBlockX,
    y: signatureBlockY + 5,
    size: 8,
    color: rgb(0.4, 0.4, 0.4),
  });

  // 5. Save merged PDF
  const mergedPdfBytes = await pdfDoc.save();

  // 5b. Hash signed PDF
  const signedDocHash = await sha256Hex(new Uint8Array(mergedPdfBytes).buffer as ArrayBuffer);

  const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
  return { blob, docHash, signedDocHash };
}
