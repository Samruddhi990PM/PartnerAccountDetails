import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      notifEmail,
      htmlBody,          // pre-rendered HTML from frontend (preferred)
      officialEmail,
      phoneName,
      phoneNumber,
      remarks,
      ourWA    = [],
      yourWA   = [],
      platforms = []
    } = req.body;

    const to = notifEmail || 'samruddhi.waghchaure@strategycues.com';

    // Use the pre-rendered HTML from the frontend if available,
    // otherwise build it server-side (identical logic).
    const emailHtml = htmlBody || buildEmailHTML({
      officialEmail, phoneName, phoneNumber, remarks, ourWA, yourWA, platforms
    });

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Strategy Cues Onboarding" <${process.env.GMAIL_USER}>`,
      to,
      subject: `New Onboarding Submission — ${new Date().toLocaleDateString()}`,
      html: emailHtml,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: err.message });
  }
}

/* ─────────────────────────────────────────────────────────────
   Server-side email builder — all fields, white/cream cells,
   pastes cleanly into Excel.
───────────────────────────────────────────────────────────── */
function buildEmailHTML(d) {
  // Cell styles — white/light so copy-paste into Excel gives clean cells
  const TH  = 'background:#c49a00;color:#111111;padding:9px 14px;font-weight:700;font-size:12px;text-align:left;border:1px solid #a07800;letter-spacing:.04em;text-transform:uppercase;';
  const LBL = 'background:#f5f0e0;color:#555555;padding:8px 14px;font-weight:600;font-size:13px;text-align:left;border:1px solid #dddddd;width:210px;white-space:nowrap;';
  const VAL = 'background:#ffffff;color:#111111;padding:8px 14px;font-size:13px;border:1px solid #dddddd;';
  const ALT = 'background:#fafaf6;color:#111111;padding:8px 14px;font-size:13px;border:1px solid #dddddd;';
  const HDR = 'background:#f5f0e0;color:#444444;padding:7px 14px;font-weight:700;font-size:11px;text-align:left;border:1px solid #dddddd;text-transform:uppercase;letter-spacing:.05em;';
  const TBL = 'width:100%;border-collapse:collapse;margin-bottom:22px;font-family:Arial,sans-serif;font-size:13px;';

  const sec = (title, cols) =>
    `<tr><th colspan="${cols}" style="${TH}">${title}</th></tr>`;

  const kv = (label, val, alt) =>
    `<tr><td style="${LBL}">${label}</td><td style="${alt ? ALT : VAL}">${val || '—'}</td></tr>`;

  // Our WhatsApp rows
  const waOurRows = (d.ourWA || []).length
    ? d.ourWA.map((w, i) => `<tr>
        <td style="${i % 2 ? ALT : VAL}">${w.name || '—'}</td>
        <td style="${i % 2 ? ALT : VAL}">${w.number || '—'}</td>
      </tr>`).join('')
    : `<tr><td colspan="2" style="${VAL}">—</td></tr>`;

  // Emergency WhatsApp rows
  const waYourRows = (d.yourWA || []).length
    ? d.yourWA.map((w, i) => `<tr>
        <td style="${i % 2 ? ALT : VAL}">${w.name || '—'}</td>
        <td style="${i % 2 ? ALT : VAL}">${w.number || '—'}</td>
      </tr>`).join('')
    : `<tr><td colspan="2" style="${VAL}">—</td></tr>`;

  // Platform rows — Platform, Username, Password, OTP Goes To
  const platRows = (d.platforms || []).length
    ? d.platforms.map((p, i) => `<tr>
        <td style="${i % 2 ? ALT : VAL}"><strong>${p.platform || '—'}</strong></td>
        <td style="${i % 2 ? ALT : VAL}">${p.username || '—'}</td>
        <td style="${i % 2 ? ALT : VAL}">${p.password || '—'}</td>
        <td style="${i % 2 ? ALT : VAL}">${p.otp || '—'}</td>
      </tr>`).join('')
    : `<tr><td colspan="4" style="${VAL}">—</td></tr>`;

  const submittedAt = new Date().toLocaleString();

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#eeebe3;">
<div style="font-family:Arial,sans-serif;background:#f5f2ea;max-width:700px;margin:0 auto;border-radius:10px;overflow:hidden;border:1px solid #dddddd;">

  <!-- Header -->
  <div style="background:#1a1a1a;padding:22px 28px;border-bottom:3px solid #c49a00;">
    <div style="font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#c49a00;margin-bottom:7px;">Strategy Cues</div>
    <h2 style="margin:0;font-size:19px;font-weight:700;color:#f0ead8;">New Onboarding Submission</h2>
    <p style="margin:5px 0 0;font-size:12px;color:#888888;">Submitted: ${submittedAt}</p>
  </div>

  <div style="padding:22px 28px;background:#f5f2ea;">

    <!-- 1. General Information -->
    <table style="${TBL}">
      ${sec('General Information', 2)}
      ${kv('Official Email ID', d.officialEmail, false)}
      ${kv('Our Contact Name (Verification No.)', d.phoneName, true)}
      ${kv('Our Phone Number for Verification', d.phoneNumber, false)}
    </table>

    <!-- 2. Our WhatsApp Numbers -->
    <table style="${TBL}">
      ${sec('Our WhatsApp Numbers for Communication', 2)}
      <tr>
        <th style="${HDR}">Name</th>
        <th style="${HDR}">Number</th>
      </tr>
      ${waOurRows}
    </table>

    <!-- 3. Customer Emergency WhatsApp -->
    <table style="${TBL}">
      ${sec('Customer Emergency WhatsApp Numbers', 2)}
      <tr>
        <th style="${HDR}">Name</th>
        <th style="${HDR}">Number</th>
      </tr>
      ${waYourRows}
    </table>

    <!-- 4. Platform Login Credentials — all 4 columns -->
    <table style="${TBL}">
      ${sec('Platform Login Credentials', 4)}
      <tr>
        <th style="${HDR}">Platform</th>
        <th style="${HDR}">Username</th>
        <th style="${HDR}">Password</th>
        <th style="${HDR}">OTP Goes To</th>
      </tr>
      ${platRows}
    </table>

    <!-- 5. Remarks -->
    <table style="${TBL}">
      ${sec('Remarks & Comments', 2)}
      ${kv('Remarks', d.remarks ? d.remarks.replace(/\n/g, '<br>') : '—', false)}
    </table>

  </div>

  <!-- Footer -->
  <div style="background:#1a1a1a;padding:12px 28px;border-top:1px solid #333333;font-size:11px;color:#666666;">
    Auto-generated by Strategy Cues Onboarding Form &nbsp;·&nbsp; ${submittedAt}
  </div>

</div>
</body>
</html>`;
}
