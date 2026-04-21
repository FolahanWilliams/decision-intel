# Design Partner — Stripe Setup Checklist

> Setup the founder does once, before the first design-partner seat signs. Keep this file up to date when anything changes so the next-time setup for a new seat is a 15-minute job.

## What you are creating in Stripe

1. **A dedicated Stripe Product** for the design-partner tier, separate from the public Strategy product. Reason: different price ($1,999 vs $2,499), different metadata, and you want design-partner invoices to read cleanly in year-end accounting.

2. **A recurring Price** at $1,999/month on that product, locked for 12 billing cycles, then either:
   - Auto-transitions to the $2,499 Strategy price via a **Subscription Schedule** (preferred — zero manual intervention at Month 13), OR
   - Manually upgraded by the founder when Month 12 arrives (simpler, but requires discipline).

3. **An Invoice for the commitment fee** ($1,999, one-time, payable within 5 business days of the MSA Effective Date). This is the partner's first month's fee, billed up front.

4. **A Payment Link** (or Checkout Session) scoped to the product above, with the partner's email pre-filled, sent as the single action item after the MSA is signed.

---

## Step-by-step

### 1. Create the Product

Stripe dashboard → Products → Add product.

| Field | Value |
|-------|-------|
| **Name** | `Decision Intel Strategy — Design Partner` |
| **Description** | `12-month design partner seat. $1,999/mo locked for Year 1; transitions to $2,499/mo for Year 2 under MSA §5.4.` |
| **Metadata** | `tier=strategy`, `cohort=design_partner_2026`, `year1_rate=1999`, `year2_rate=2499` |
| **Statement descriptor** | `DECISION-INTEL DP` (must be ≤22 chars) |

### 2. Create the Price

On the product you just created → Add price.

| Field | Value |
|-------|-------|
| **Amount** | `$1,999.00 USD` |
| **Billing** | Recurring · Monthly |
| **Tax behavior** | Exclusive (invoice states sales tax separately) |
| **Metadata** | `cohort=design_partner_2026` |

Save the Price ID (starts with `price_`). You'll reference it in the Subscription Schedule or the Checkout session.

### 3. Subscription Schedule (recommended — zero manual transition)

Stripe dashboard → Subscriptions → Schedules → New schedule.

Phases:
- **Phase 1 (12 months):** Price = $1,999/mo (the Price you just created). Iterations = 12.
- **Phase 2 (indefinite):** Price = the existing public **Strategy** price ID ($2,499/mo). This is the phase Month 13 transitions to automatically.

Attach the schedule to the partner's Stripe Customer. Next billing cycle onwards, Stripe handles the transition automatically.

### 4. Commitment fee — one-time invoice

When the MSA is signed, before the recurring subscription starts:

- Stripe → Invoices → Create invoice → Customer = partner
- Line item: `Design partner commitment fee — Year 1 Month 1 (applied against first monthly billing cycle)` · $1,999 · one-time
- Due: 5 business days from invoice date
- Payment methods: card, ACH, wire

When this invoice is paid, activate the Subscription Schedule above with a billing anchor date **one month out** so the partner is not double-billed in Month 1. (The commitment fee IS Month 1's fee.)

### 5. Payment Link (alternative, simpler path)

If you prefer to skip Subscription Schedules for Year 1 and handle the Year 2 transition manually:

- Stripe → Payment links → Create payment link
- Price = the $1,999/mo Price ID
- Collect billing address: on
- Metadata: `cohort=design_partner_2026`, `partner_id=<design-partner-application-id>`
- Send the link to the partner after the MSA is signed

Set a calendar reminder for **Month 11** on each partner to handle the manual transition to Strategy at $2,499.

---

## Environment / code wiring

These env vars need values on Vercel before the first design-partner Checkout session fires:

| Env var | Purpose |
|---------|---------|
| `STRIPE_SECRET_KEY` | already set — nothing to change |
| `STRIPE_WEBHOOK_SECRET` | already set — nothing to change |
| `NEXT_PUBLIC_STRIPE_DESIGN_PARTNER_PRICE_ID` | `price_...` from step 2. Use in the design-partner checkout flow if/when we automate it. Until then, the MSA workflow stays manual (invoice + Payment Link). |

`src/lib/stripe.ts` already exposes `PLANS.team` (Strategy tier). When the automated design-partner checkout is built, add a new `PLANS.designPartner` entry with the new Price ID and `metadata.cohort = 'design_partner_2026'` so webhooks can route accordingly.

---

## Post-signup checklist (for each partner)

- [ ] MSA signed + countersigned, archived in `docs/positioning/partners/<partner-slug>/`
- [ ] DPA signed (Schedule A of the MSA), archived in same directory
- [ ] Commitment-fee invoice paid (check Stripe payment intent)
- [ ] Subscription Schedule (or manual recurring billing) active in Stripe
- [ ] Founder-partner Slack channel provisioned
- [ ] Partner added to the design-partner email list (weekly digest, early-access invites)
- [ ] `DesignPartnerApplication.status` updated to `accepted` in the database
- [ ] Week-1 intro call booked + first audit scheduled
- [ ] Calendar reminder for Month 11 review set (regardless of whether you used a Subscription Schedule — a manual check-in is how you keep the trust)
