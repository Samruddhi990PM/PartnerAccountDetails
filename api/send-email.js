const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      officialEmail,
      phoneName,
      phoneNumber,
      ourWA      = [],
      yourWA     = [],
      platforms  = [],
      remarks,
      notifEmail
    } = req.body;

    // Sanitise notifEmail — trim whitespace, fallback to default
    const to = (notifEmail || '').trim() || 'samruddhi.waghchaure@strategycues.com';

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // ── 1. Save to Supabase ──
    const emergencyWA = yourWA.map(function(w) {
      return { emer_name: w.name || null, emer_contact: w.number || null };
    });

    const { error: dbError } = await supabase
      .from('onboarding_submissions')
      .insert({
        official_email:   officialEmail || null,
        phone_name:       phoneName     || null,
        verification_num: phoneNumber   || null,
        our_wa:           ourWA,
        emergency_wa:     emergencyWA,
        platforms:        platforms,
        remarks:          remarks       || null
      });

    if (dbError) {
      console.error('Supabase insert error:', dbError.message);
      // Save raw payload to fallback table so data is not lost
      await supabase.from('failed_submissions').insert({
        error_msg:   dbError.message,
        raw_payload: req.body
      });
    }

    // ── 2. Send email via Resend ──
    // Styles — light background so table pastes cleanly into Excel
    var TH  = 'background:#c49a00;color:#111;padding:9px 14px;font-weight:700;font-size:12px;text-align:left;border:1px solid #a07800;text-transform:uppercase;letter-spacing:.04em;';
    var LBL = 'background:#f5f0e0;color:#555;padding:8px 14px;font-weight:600;font-size:13px;border:1px solid #ddd;width:200px;';
    var VAL = 'background:#fff;color:#111;padding:8px 14px;font-size:13px;border:1px solid #ddd;';
    var ALT = 'background:#fafaf6;color:#111;padding:8px 14px;font-size:13px;border:1px solid #ddd;';
    var HDR = 'background:#f5f0e0;color:#444;padding:7px 12px;font-weight:700;font-size:11px;border:1px solid #ddd;text-transform:uppercase;';
    var TBL = 'width:100%;border-collapse:collapse;margin-bottom:20px;font-family:Arial,sans-serif;font-size:13px;';

    function sec(t, c) {
      return '<tr><th colspan="' + c + '" style="' + TH + '">' + t + '</th></tr>';
    }
    function kv(l, v, a) {
      return '<tr><td style="' + LBL + '">' + l + '</td><td style="' + (a ? ALT : VAL) + '">' + (v || '-') + '</td></tr>';
    }

    var ourWARows = ourWA.length
      ? ourWA.map(function(w, i) {
          return '<tr><td style="' + (i%2?ALT:VAL) + '">' + (w.name||'-') + '</td>'
               + '<td style="' + (i%2?ALT:VAL) + '">' + (w.number||'-') + '</td></tr>';
        }).join('')
      : '<tr><td colspan="2" style="' + VAL + '">-</td></tr>';

    var emerRows = yourWA.length
      ? yourWA.map(function(w, i) {
          return '<tr><td style="' + (i%2?ALT:VAL) + '">' + (w.name||'-') + '</td>'
               + '<td style="' + (i%2?ALT:VAL) + '">' + (w.number||'-') + '</td></tr>';
        }).join('')
      : '<tr><td colspan="2" style="' + VAL + '">-</td></tr>';

    // Passwords masked — show only first 2 chars then ****
    var platRows = platforms.length
      ? platforms.map(function(p, i) {
          var maskedPwd = p.password
            ? p.password.substring(0, 2) + '****'
            : '-';
          return '<tr>'
            + '<td style="' + (i%2?ALT:VAL) + '"><strong>' + (p.platform||'-') + '</strong></td>'
            + '<td style="' + (i%2?ALT:VAL) + '">' + (p.username||'-') + '</td>'
            + '<td style="' + (i%2?ALT:VAL) + '">' + maskedPwd + '</td>'
            + '<td style="' + (i%2?ALT:VAL) + '">' + (p.otp||'-') + '</td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="4" style="' + VAL + '">-</td></tr>';

    var submittedAt = new Date().toLocaleString();

    var html = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#eeebe3;">'
      + '<div style="font-family:Arial,sans-serif;background:#f5f2ea;max-width:700px;margin:0 auto;border-radius:10px;overflow:hidden;border:1px solid #ddd;">'

      + '<div style="background:#1a1a1a;padding:22px 28px;border-bottom:3px solid #c49a00;">'
      + '<div style="font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#c49a00;margin-bottom:7px;">Strategy Cues</div>'
      + '<h2 style="margin:0;font-size:19px;font-weight:700;color:#f0ead8;">New Onboarding Submission</h2>'
      + '<p style="margin:5px 0 0;font-size:12px;color:#888;">Submitted: ' + submittedAt + '</p>'
      + '</div>'

      + '<div style="padding:22px 28px;background:#f5f2ea;">'

      + '<table style="' + TBL + '">'
      + sec('General Information', 2)
      + kv('Official Email ID',    officialEmail, false)
      + kv('Contact Name',         phoneName,     true)
      + kv('Verification Number',  phoneNumber,   false)
      + '</table>'

      + '<table style="' + TBL + '">'
      + sec('Our WhatsApp Numbers', 2)
      + '<tr><th style="' + HDR + '">Name</th><th style="' + HDR + '">Number</th></tr>'
      + ourWARows
      + '</table>'

      + '<table style="' + TBL + '">'
      + sec('Customer Emergency WhatsApp', 2)
      + '<tr><th style="' + HDR + '">Name</th><th style="' + HDR + '">Number</th></tr>'
      + emerRows
      + '</table>'

      + '<table style="' + TBL + '">'
      + sec('Platform Login Credentials', 4)
      + '<tr>'
      + '<th style="' + HDR + '">Platform</th>'
      + '<th style="' + HDR + '">Username</th>'
      + '<th style="' + HDR + '">Password</th>'
      + '<th style="' + HDR + '">OTP Goes To</th>'
      + '</tr>'
      + platRows
      + '</table>'

      + '<table style="' + TBL + '">'
      + sec('Remarks', 2)
      + kv('Notes', remarks ? remarks.replace(/\n/g, '<br>') : '-', false)
      + '</table>'

      + '<div style="background:#fff8e1;border:1px solid #f0c040;border-radius:6px;padding:10px 14px;font-size:11px;color:#7a5c00;margin-top:4px;">'
      + 'Passwords are partially masked in this email. Full credentials are stored securely in Supabase.'
      + '</div>'

      + '</div>'
      + '<div style="background:#f5f0e0;border:1px solid #ddd;border-radius:8px;padding:16px 20px;margin:0 0 16px;">'
      + '<p style="margin:0 0 8px;font-size:14px;color:#1a1a1a;font-weight:600;">Account details received for: ' + (officialEmail || phoneName || 'New Customer') + '</p>'
      + '<p style="margin:0 0 12px;font-size:13px;color:#555;">Jump to the dashboard for full details including platform credentials.</p>'
      + '<a href="' + (process.env.VERCEL_URL_FULL || 'https://your-site.vercel.app') + '/dashboard" '
      + 'style="display:inline-block;background:#c49a00;color:#111;padding:9px 20px;border-radius:7px;font-weight:700;font-size:13px;text-decoration:none;">'
      + 'View Full Details &#8594;</a>'
      + '</div>'
      + '<div style="background:#1a1a1a;padding:12px 28px;border-top:1px solid #333;font-size:11px;color:#666;">'
      + 'Auto-generated by Strategy Cues Onboarding Form - ' + submittedAt
      + '</div>'
      + '</div></body></html>';

    // ── Send email — failure here should NOT block success response ──
    try {
      var emailResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({
          from:    'Strategy Cues Onboarding <onboarding@mail.strategycues.com>',
          to:      [to, 'reports@strategycues.com'].filter(function(e) {
            return typeof e === 'string' && e.trim().indexOf('@') !== -1;
          }),
          subject: 'New Onboarding Submission - ' + new Date().toLocaleDateString(),
          html:    html
        })
      });
      var emailResult = await emailResp.json();
      if (!emailResp.ok) {
        console.error('Resend error:', emailResult.message || JSON.stringify(emailResult));
      }
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
      // Data is already saved in Supabase — email failure is non-fatal
    }

    // ── Always return success if Supabase saved OK ──
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
};
