import { PDFDocument, rgb } from 'pdf-lib';

export interface EmbedSignatureParams {
  pdfUrl: string; // Original unsigned BOL PDF URL
  signatureDataUrl: string; // Canvas signature as data URL (image/png)
  signatoryName: string; // "John Doe"
  signedAt: Date; // Timestamp
}

export async function embedSignatureIntoPdf(params: EmbedSignatureParams): Promise<Blob> {
  const { pdfUrl, signatureDataUrl, signatoryName, signedAt } = params;

  // 1. Load original PDF
  const pdfBytes = await fetch(pdfUrl).then((r) => {
    if (!r.ok) throw new Error(`Failed to load PDF (${r.status})`);
    return r.arrayBuffer();
  });
  const pdfDoc = await PDFDocument.load(pdfBytes);

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
  return new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
}
