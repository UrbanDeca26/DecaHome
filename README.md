# Luxury Stay Property Management System

Luxury Stay is a single-property booking website with a CMS-style owner dashboard backed by Supabase.

The public website is read-only for guests. The owner dashboard is the editable control center for the property's content, pricing, bookings, and reviews.

## Architecture

```text
Public Website
      │
      ▼
Supabase Database
      ▲
      │
Admin Dashboard
```

## What the public site does

The public site displays:

- Hero section
- Live booking calculator
- Gallery
- Amenities
- Stay guide
- Reviews
- Luna concierge
- Footer and contact links

## What the admin dashboard manages

The owner dashboard is the source of truth for:

- Property settings
- Hero copy and booking labels
- Pricing manager
- Booking ledger
- Earnings summary
- Availability calendar
- Amenities
- Stay guide
- Reviews
- Luna AI knowledge
- Site settings

## Booking and accounting flow

1. A guest confirms a booking.
2. The booking is saved to Supabase.
3. The booking reference and review token are generated.
4. Confirmation emails are sent to the guest and owner.
5. The admin dashboard reads the same booking record.
6. Earnings are calculated from confirmed bookings only.

### Accounting

The dashboard shows automatic earnings totals for:

- This week
- This month
- This year
- Lifetime

Only confirmed or completed bookings count toward revenue.

## Pricing engine

The pricing manager is the single source of truth.

Editable values:

- Weekday rate
- Weekend rate
- Included guests
- Extra guest fee
- Pet fee
- Maximum guests
- Maximum pets

The public booking calculator, confirmation modal, booking emails, and admin booking summaries all read from the same saved values.

## Reviews

Verified guest reviews require:

- Booking reference
- Review token
- Completed stay

The owner can moderate reviews and send review invitations from the dashboard.

## Gallery policy

The gallery uses the existing asset set.

The owner can:

- Feature media
- Hide/show media
- Restore media
- Delete media
- Reorder media

Uploading new media from the dashboard is disabled.

## Booking API

The booking flow uses:

- `/api/book`
- `/api/bookings`
- `/api/reviews-list`
- `/api/reviews-submit`
- `/api/chat`
- `/api/chat-inquiry`
- `/api/admin-login`
- `/api/admin-status`
- `/api/admin-logout`

## Environment variables

Required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `BOOKING_TO`
- `GROQ_API_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_SECRET`

Optional:

- `PUBLIC_SITE_URL` — used in review invitation emails

## Supabase tables expected

The code expects at least:

### `bookings`

Typical fields:

- `id`
- `booking_ref`
- `guest_name`
- `guest_email`
- `guest_phone`
- `checkin`
- `checkout`
- `guests`
- `pets`
- `note`
- `pricing`
- `total`
- `status`
- `review_token`
- `review_submitted`
- `review_invitation_sent`
- `created_at`
- `confirmed_at`
- `cancelled_at`
- `checked_in_at`
- `checked_out_at`

### `reviews`

Used for verified reviews and moderation.

## Development notes

- The public site remains visually unchanged unless a shared source-of-truth field changes.
- Admin actions should update the shared data first, then the public UI should read from that data.
- If a booking is confirmed, it should appear in the booking ledger and accounting summaries.
- The dashboard is meant to behave like a real CMS / PMS, not a static settings form.
