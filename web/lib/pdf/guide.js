import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function buildPersonalizedGuide({ fullName, orderId, items }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawText = (text, x, y, size = 12, bold = false) => {
    page.drawText(String(text || ''), {
      x, y, size,
      font: bold ? fontBold : font,
      color: rgb(0, 0, 0),
    });
  };

  let y = height - 72;
  drawText('UrziStaff — Welcome Guide', 72, y, 20, true);
  y -= 24;
  drawText(`Order: ${orderId}`, 72, y, 10);
  y -= 32;
  drawText(`Hello ${fullName || 'there'},`, 72, y, 14);
  y -= 20;
  drawText('Thanks for your purchase! Here are a few steps to get started:', 72, y);
  y -= 24;

  const bullets = [
    'Join our support channel on Telegram if you need help',
    'We will contact you shortly via the Telegram you provided at checkout',
    'Meanwhile, review the tips below to get the most out of your new VA(s)'
  ];
  bullets.forEach((b) => { drawText(`• ${b}`, 72, y); y -= 18; });

  y -= 8;
  drawText('Order Items:', 72, y, 12, true);
  y -= 16;
  (Array.isArray(items) ? items : []).slice(0, 20).forEach((it, idx) => {
    drawText(`- ${it?.name || 'Listing'} — $${Number(it?.price||0).toFixed(2)}`, 90, y);
    y -= 16;
  });

  y -= 12;
  drawText('Tips for a successful start:', 72, y, 12, true);
  y -= 18;
  const tips = [
    'Define clear goals and KPIs during the first week',
    'Set daily check-ins and a feedback loop',
    'Share your preferred tools (task tracker, docs, calendars)',
  ];
  tips.forEach((t) => { drawText(`• ${t}`, 72, y); y -= 16; });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
