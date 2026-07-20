
# Luxury Stay

Single-page condo booking site with:
- Premium hero video
- Glass-style, owner-editable amenities
- Gallery and video walkthroughs
- Exact location and nearby landmarks
- Booking requirements, pricing, and house rules
- Self check-in and checkout guide
- Guest review comments
- Google Maps and Waze links
- Groq-powered concierge endpoint
- Owner login at the bottom of the page
- Guest review manager
- Media manager for photos and videos
- Booking email endpoint

## Required environment variables for deployment

For the booking inquiry email endpoint:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `BOOKING_TO`

For the concierge:
- `GROQ_API_KEY`

For the owner login:
- `ADMIN_PASSWORD`
- `ADMIN_SECRET` (optional; defaults to `ADMIN_PASSWORD` if omitted)

## Location and guide content

The site is configured for Urban Deca Homes Ortigas Extension, Pasig City, BLDG Q - Area 4/3.

The AI concierge answers from the visible property details, including parking, pricing, house rules, booking requirements, check-in steps, and checkout reminders.

## Amenities

Amenities are stored in the browser so the owner can add, hide, edit, or delete them from the dashboard without changing code.

## Media

Videos are provided as MP4 files in the `assets` folder:
- `tour-01.mp4`
- `tour-02.mp4`

## Notes

The owner tools appear only after signing in from the bottom of the page. The review, media, and amenity managers update the site state in the browser for testing and content management flow.


## Luna concierge

The chat now acts as Luna, the virtual concierge. It routes guests to the correct site section and can send an inquiry email when the question is not listed on the page.


## Replacement package

This ZIP includes the complete set of files needed to replace the current site code.
