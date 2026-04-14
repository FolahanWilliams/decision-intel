# Supabase Email Templates

Branded HTML templates for the Supabase auth emails. These must be **pasted into the Supabase Dashboard manually** — there's no API that syncs them from the repo.

## How to apply

1. Open Supabase Dashboard → your project → **Authentication** → **Email Templates**
2. Pick the template type from the dropdown (Confirm signup, Reset password, etc.)
3. Replace the subject line with the suggested one from the top of each file
4. Copy the HTML from the matching file in this folder and paste into the body field
5. Click **Save changes**

## Template mapping

| File | Supabase template slot | Subject line |
|---|---|---|
| [confirm-signup.html](confirm-signup.html) | Confirm signup | Confirm your Decision Intel account |
| [reset-password.html](reset-password.html) | Reset Password | Reset your Decision Intel password |

## Template variables

Supabase renders these server-side. Do not rename them — keep the `{{ .VariableName }}` syntax exactly as written.

- `{{ .ConfirmationURL }}` — the link the user clicks (verification, reset, magic link)
- `{{ .Email }}` — the user's email address
- `{{ .SiteURL }}` — your configured site URL
- `{{ .Token }}` / `{{ .TokenHash }}` — raw/hashed tokens (rarely used directly)

## Design conventions

- Light theme only (matches product)
- Green accent `#16A34A` for primary CTA
- 560px max-width card on `#F8FAFC` background
- Inline styles only (email clients strip `<style>` tags)
- Preheader text hidden with the `display:none; max-height:0` trick
- No web fonts — system font stack for deliverability
- All links repeated as plain text below the button (accessibility + clients that block buttons)

## Templates still to write

- Magic link (if/when passwordless auth is added)
- Change email address
- Invite user (multi-seat plans)

Match the pattern in the existing files — same brand bar, same CTA style, same footer.
