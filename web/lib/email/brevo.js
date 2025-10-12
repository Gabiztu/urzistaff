import * as Brevo from '@getbrevo/brevo';

const api = new Brevo.TransactionalEmailsApi();
const auth = api.authentications['apiKey'];
auth.apiKey = process.env.BREVO_API_KEY || '';

export async function sendGuideEmail({ toEmail, toName, subject, html, text, attachments }) {
  if (!process.env.BREVO_API_KEY) throw new Error('BREVO_API_KEY missing');
  const fromEmail = process.env.GUIDE_FROM_EMAIL || process.env.FROM_EMAIL || 'no-reply@example.com';
  const fromName = process.env.GUIDE_FROM_NAME || process.env.FROM_NAME || 'UrziStaff';

  const send = new Brevo.SendSmtpEmail();
  send.to = [{ email: toEmail, name: toName || undefined }];
  send.sender = { email: fromEmail, name: fromName };
  send.subject = subject || 'Your UrziStaff Guide';
  if (html) send.htmlContent = html;
  if (text) send.textContent = text;
  if (attachments && attachments.length) {
    send.attachment = attachments.map((a) => ({
      name: a.name,
      content: a.content, // base64
      contentType: a.contentType || 'application/pdf',
    }));
  }
  const res = await api.sendTransacEmail(send);
  // Brevo returns { messageId: string, ... }
  return { messageId: res?.messageId || null, raw: res };
}
