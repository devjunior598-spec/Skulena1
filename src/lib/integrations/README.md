# Integration boundary

Add provider adapters here so product code does not depend directly on a vendor SDK.

Planned boundaries:

- `maps` — Google Maps or Mapbox search, geocoding and map rendering
- `payments` — Paystack billing and webhook verification
- `notifications` — email, SMS and WhatsApp delivery
- `media` — image/video processing and moderation
- `analytics` — product analytics and performance events
- `monitoring` — error reporting and tracing

Keep secrets server-only and validate all provider callbacks. Frontend role checks are never an authorization boundary.
