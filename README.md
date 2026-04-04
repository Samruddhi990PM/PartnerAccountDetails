# Strategy Cues — Partner Account Setup Form

A secure onboarding form for holiday home owners to submit their platform credentials and contact details to Strategy Cues.

---

## Overview

| Component | Description |
|---|---|
| **Onboarding Form** | Client-facing form to collect account details |
| **Supabase** | Secure database storage for all submissions |
| **Resend** | Email notification service |
| **Team Dashboard** | Password-protected internal view of all submissions |

---

## Project Structure

```
PartnerAccountDetails/
├── public/
│   ├── index.html          # Onboarding form (client-facing)
│   └── dashboard.html      # Team dashboard (password protected)
├── api/
│   ├── send-email.js       # Handles Supabase save + Resend email
│   └── dashboard-data.js   # Serves submission data to dashboard
├── vercel.json             # Vercel routing config
├── package.json            # Dependencies
└── .gitignore
```

---

## How It Works

### On Form Submission (2 independent actions):

**Action 1 — Save to Supabase**
- All form fields saved to `onboarding_submissions` table
- If save fails, raw data saved to `failed_submissions` table as backup

**Action 2 — Send Email via Resend**
- Email sent to `reports@strategycues.com`
- Contains submission summary and a link to the team dashboard
- Sent from `onboarding@mail.strategycues.com`

---

## Form Fields Captured

| Section | Fields |
|---|---|
| General | Official Email, Contact Name, Verification Number |
| Our WhatsApp | Name, Number (multiple) |
| Emergency WhatsApp | Name, Contact (multiple) |
| Platform Credentials | Platform, Username, Password, OTP Goes To (multiple) |
| Remarks | Additional notes |

---

## Team Dashboard

**URL:** `https://partner-account-details-six.vercel.app/dashboard.html`

- Password protected (single team password)
- Shows all submissions in expandable cards
- Full platform credentials visible with Show/Hide password toggle
- Search and sort submissions
- Sourced directly from Supabase

---

## Environment Variables

Set these in **Vercel → Settings → Environment Variables**:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (keep secret) |
| `RESEND_API_KEY` | Resend API key for email sending |
| `NOTIFICATION_EMAIL` | Email address to receive submission notifications |
| `VERCEL_URL_FULL` | Base URL of the Vercel deployment (no trailing slash) |
| `DASHBOARD_PASSWORD` | Team password for accessing the dashboard |

---
## Supabase Edge Function - Email alert on insert in the table.


- Sends email to samruddhi.waghchaure@strategycues.com on new insert in onboarding_submissions table
- Created via Supabase → Edge Functions → Deploy a New Function - via Editor
- Includes email template + logic (no separate webhook needed)
- Fits for now; will need standardization with webhooks if scaled


## Supabase Tables

### `onboarding_submissions`
| Column | Type | Description |
|---|---|---|
| `id` | uuid | Auto-generated primary key |
| `submitted_at` | timestamptz | Submission timestamp |
| `official_email` | text | Client's official email |
| `phone_name` | text | Verification contact name |
| `verification_num` | text | Phone number for verification |
| `our_wa` | jsonb | Our WhatsApp numbers array |
| `emergency_wa` | jsonb | Client emergency WhatsApp array |
| `platforms` | jsonb | Platform credentials array |
| `remarks` | text | Additional notes |

### `failed_submissions`
| Column | Type | Description |
|---|---|---|
| `id` | uuid | Auto-generated primary key |
| `failed_at` | timestamptz | Failure timestamp |
| `error_msg` | text | Error message from Supabase |
| `raw_payload` | jsonb | Full raw form payload |

---

## Email Configuration (Resend)

- **Domain:** `mail.strategycues.com` (DNS verified via GoDaddy)
- **From:** `onboarding@mail.strategycues.com`
- **To:** Configured via `NOTIFICATION_EMAIL` env var
- **DNS Records added:** DKIM TXT, SPF TXT, MX (on `send.mail` subdomain)

---

## Deployment

```bash
git add .
git commit -m "your message"
git push
```

Vercel auto-deploys on every push to `main`.

---

## Security Notes

- Supabase service key is stored in Vercel env vars only — never in code
- Dashboard password is stored in Vercel env vars only — never in code
- Platform passwords are visible only on the password-protected dashboard
- Email notifications contain a summary only — no credentials in email
- `.gitignore` excludes all test files with hardcoded secrets

---

## Local Testing

To test Supabase connection locally:
```bash
node test-supabase.js   # excluded from git via .gitignore
```

To test Resend email locally:
```bash
node test-resend.js     # excluded from git via .gitignore
```

---

## URLs

| Page | URL |
|---|---|
| Onboarding Form | `https://partner-account-details-six.vercel.app` |
| Team Dashboard | `https://partner-account-details-six.vercel.app/dashboard.html` |
| API — Save & Email | `https://partner-account-details-six.vercel.app/api/send-email` |
| API — Dashboard Data | `https://partner-account-details-six.vercel.app/api/dashboard-data` |
