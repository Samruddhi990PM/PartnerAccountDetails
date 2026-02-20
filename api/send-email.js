// api/send-email.js
// Vercel Serverless Function — receives form data, sends email via Gmail SMTP

const nodemailer = require('nodemailer');

// Helper: pad string to fixed width for ASCII table
function pr(s, n) {
  s = String(s || '');
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}
function hr2(a, b)        { return '+' + '-'.repeat(a + 2) + '+' + '-'.repeat(b + 2) + '+'; }
function hr3(a, b, c)     { return '+' + '-'.repeat(a + 2) + '+' + '-'.repeat(b + 2) + '+' + '-'.repeat(c + 2) + '+'; }
function row2(x, y, a, b) { return '| ' + pr(x, a) + ' | ' + pr(y, b) + ' |'; }
function row3(x, y, z, a, b, c) { return '| ' + pr(x, a) + ' | ' + pr(y, b) + ' | ' + pr(z, c) + ' |'; }
function sec(title, w)    { return '+' + '='.repeat(w) + '+\n| ' + pr(' ' + title, w - 1) + ' |\n+' + '='.repeat(w) + '+'; }

function buildPlainTable(data) {
  const L = [];
  L.push('STRATEGY CUES — ONBOARDING FORM SUBMISSION');
  L.push('Submitted : ' + new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dubai' }));
  L.push('');

  // General Info
  const c1 = 28, c2 = 42;
  L.push(sec('GENERAL INFORMATION', c1 + c2 + 5));
  L.push(row2('Field', 'Value', c1, c2));
  L.push(hr2(c1, c2));
  L.push(row2('Official Email ID',        data.officialEmail, c1, c2)); L.push(hr2(c1, c2));
  L.push(row2('Phone Contact Name',       data.phoneName,     c1, c2)); L.push(hr2(c1, c2));
  L.push(row2('Phone No. (Verification)', data.phoneNumber,   c1, c2)); L.push(hr2(c1, c2));
  L.push('');

  // Our WhatsApp
  const w1 = 22, w2 = 30;
  L.push(sec('OUR WHATSAPP NUMBERS FOR COMMUNICATION', w1 + w2 + 5));
  L.push(row2('Name', 'Number', w1, w2)); L.push(hr2(w1, w2));
  if (data.ourWA && data.ourWA.length) {
    data.ourWA.forEach(w => { L.push(row2(w.name, w.number, w1, w2)); L.push(hr2(w1, w2)); });
  } else {
    L.push(row2('(none)', '', w1, w2)); L.push(hr2(w1, w2));
  }
  L.push('');

  // Emergency WhatsApp
  L.push(sec('YOUR EMERGENCY WHATSAPP NUMBERS', w1 + w2 + 5));
  L.push(row2('Name', 'Number', w1, w2)); L.push(hr2(w1, w2));
  if (data.yourWA && data.yourWA.length) {
    data.yourWA.forEach(w => { L.push(row2(w.name, w.number, w1, w2)); L.push(hr2(w1, w2)); });
  } else {
    L.push(row2('(none)', '', w1, w2)); L.push(hr2(w1, w2));
  }
  L.push('');

  // Platform Credentials
  const p1 = 18, p2 = 22, p3 = 22;
  L.push(sec('PLATFORM LOGIN CREDENTIALS', p1 + p2 + p3 + 8));
  L.push(row3('Platform', 'Username', 'Password', p1, p2, p3)); L.push(hr3(p1, p2, p3));
  if (data.platforms && data.platforms.length) {
    data.platforms.forEach(p => { L.push(row3(p.platform, p.username, p.password, p1, p2, p3)); L.push(hr3(p1, p2, p3)); });
  } else {
    L.push(row3('(none)', '', '', p1, p2, p3)); L.push(hr3(p1, p2, p3));
  }

  return L.join('\n');
}

function buildHTMLTable(data) {
  const th = (txt) => `<th style="background:#d4a843;color:#111;padding:10px 16px;text-align:left;font-weight:600;letter-spacing:.04em">${txt}</th>`;
  const td = (txt) => `<td style="padding:10px 16px;border-bottom:1px solid #2e2e2e;color:#f0ead8">${txt || '—'}</td>`;
  const tdL = (txt) => `<td style="padding:10px 16px;border-bottom:1px solid #2e2e2e;color:#b8b0a0;font-weight:600;width:220px">${txt || '—'}</td>`;
  const secHeader = (txt) => `
    <tr><td colspan="3" style="background:#1a1a1a;padding:14px 16px;border-top:3px solid #d4a843">
      <span style="font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#d4a843;font-weight:700">${txt}</span>
    </td></tr>`;

  const ourWARows = (data.ourWA && data.ourWA.length)
    ? data.ourWA.map((w, i) => `<tr style="background:${i % 2 ? '#1e1e1e' : '#252525'}">${td(w.name)}${td(w.number)}</tr>`).join('')
    : `<tr style="background:#1e1e1e">${td('(none)')}${td('')}</tr>`;

  const yourWARows = (data.yourWA && data.yourWA.length)
    ? data.yourWA.map((w, i) => `<tr style="background:${i % 2 ? '#1e1e1e' : '#252525'}">${td(w.name)}${td(w.number)}</tr>`).join('')
    : `<tr style="background:#1e1e1e">${td('(none)')}${td('')}</tr>`;

  const platRows = (data.platforms && data.platforms.length)
    ? data.platforms.map((p, i) => `<tr style="background:${i % 2 ? '#1e1e1e' : '#252525'}">${td(p.platform)}${td(p.username)}${td(p.password)}</tr>`).join('')
    : `<tr style="background:#1e1e1e">${td('(none)')}${td('')}${td('')}</tr>`;

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:680px;margin:32px auto;background:#111;border-radius:12px;overflow:hidden;border:1px solid #2e2e2e">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a1a1a,#222);padding:28px 32px;border-bottom:2px solid #d4a843">
    <div style="font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#d4a843;margin-bottom:8px;font-weight:700">Strategy Cues</div>
    <h2 style="margin:0;font-size:22px;font-weight:600;color:#f0ead8">New Onboarding Submission</h2>
    <p style="margin:6px 0 0;font-size:13px;color:#6a6050">Submitted: ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dubai' })}</p>
  </div>

  <!-- Body -->
  <div style="padding:24px 32px">
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #2e2e2e;border-radius:8px;overflow:hidden">
      <thead><tr>${th('Field')}${th('Value')}</tr></thead>
      <tbody>
        ${secHeader('General Information')}
        <tr style="background:#1e1e1e">${tdL('Official Email ID')}${td(data.officialEmail)}</tr>
        <tr style="background:#252525">${tdL('Phone Contact Name')}${td(data.phoneName)}</tr>
        <tr style="background:#1e1e1e">${tdL('Phone No. (Verification)')}${td(data.phoneNumber)}</tr>
      </tbody>
    </table>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #2e2e2e;border-radius:8px;overflow:hidden">
      <thead><tr>${th('Name')}${th('Number')}</tr></thead>
      <tbody>
        ${secHeader('Our WhatsApp Numbers for Communication')}
        ${ourWARows}
      </tbody>
    </table>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #2e2e2e;border-radius:8px;overflow:hidden">
      <thead><tr>${th('Name')}${th('Number')}</tr></thead>
      <tbody>
        ${secHeader('Your Emergency WhatsApp Numbers')}
        ${yourWARows}
      </tbody>
    </table>

    <table style="width:100%;border-collapse:collapse;border:1px solid #2e2e2e;border-radius:8px;overflow:hidden">
      <thead><tr>${th('Platform')}${th('Username')}${th('Password')}</tr></thead>
      <tbody>
        ${secHeader('Platform Login Credentials')}
        ${platRows}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div style="background:#1a1a1a;padding:16px 32px;border-top:1px solid #2e2e2e;font-size:12px;color:#6a6050">
    Auto-generated by Strategy Cues Onboarding Form &nbsp;·&nbsp; Do not reply to this email
  </div>
</div>
</body>
</html>`;
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers (allow your Vercel domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const data = req.body;

    // Validate required field
    if (!data.officialEmail) {
      return res.status(400).json({ error: 'Official email is required' });
    }

    // Create Gmail SMTP transporter
    // Credentials come from Vercel Environment Variables (never hardcoded)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // TLS
      auth: {
        user: process.env.GMAIL_USER,     // e.g. yourname@gmail.com
        pass: process.env.GMAIL_APP_PASS  // 16-char App Password from Google
      }
    });

    // Recipient — can be overridden per-request if needed
    const toEmail = data.notifEmail || process.env.DEFAULT_TO_EMAIL || 'samruddhi.waghchaure@strategycues.com';

    await transporter.sendMail({
      from: `"Strategy Cues Onboarding" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `Onboarding Submission — ${data.officialEmail}`,
      text: buildPlainTable(data),   // plain-text fallback (ASCII table)
      html: buildHTMLTable(data)     // rich HTML version
    });

    return res.status(200).json({ success: true, message: 'Email sent successfully' });

  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Failed to send email', detail: err.message });
  }
}
