const nodemailer = require('nodemailer');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (_) { resolve({}); }
    });
    req.on('error', reject);
  });
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let body = req.body;
    if (!body || typeof body !== 'object') body = await readBody(req);

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const message = String(body.message || '').trim();
    const page = String(body.page || 'chat').trim();
    const topic = String(body.topic || 'General inquiry').trim();

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const hostEmail = process.env.INQUIRY_TO || process.env.BOOKING_TO || process.env.ALERT_TO || process.env.SMTP_TO;
    const hostFrom = process.env.BOOKING_FROM || process.env.ALERT_FROM || process.env.SMTP_USER || 'luxury-stay@vercel.app';
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    if (!host || !hostEmail) {
      return res.status(500).json({ error: 'Missing SMTP_HOST or recipient email' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });

    const subject = `[Luxury Stay] Chat inquiry from ${name}`;
    const text = [
      `Topic: ${topic}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || '—'}`,
      `Page: ${page}`,
      '',
      'Message:',
      message,
    ].join('\n');

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937">
        <h2 style="margin:0 0 12px">New chat inquiry</h2>
        <p><strong>Topic:</strong> ${esc(topic)}</p>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Phone:</strong> ${esc(phone || '—')}</p>
        <p><strong>Page:</strong> ${esc(page)}</p>
        <p><strong>Message:</strong><br>${esc(message).replace(/\n/g, '<br>')}</p>
      </div>`;

    await transporter.sendMail({
      from: hostFrom,
      to: hostEmail,
      subject,
      text,
      html,
      replyTo: email,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to send inquiry' });
  }
};
