# Supabase

Migrations live in `migrations/`. Apply them in filename order with the Supabase CLI or paste the SQL into the project's SQL Editor.

The booking schema intentionally separates:

- locations and per-location settings;
- barbers, services and their many-to-many skills;
- recurring shift templates and concrete daily shifts;
- customers, appointments and immutable service snapshots;
- appointment status history for audit/reporting.

The backend uses the service-role key and remains the only writer. RLS is enabled without public write policies so browser clients cannot mutate operational data directly.

`202607130005_public_booking.sql` adds multi-service website bookings. The
`create_website_booking` RPC validates the customer, referral, services, shift,
barber skills and slot capacity, then creates the appointment and immutable
service snapshots in one database transaction. Execute permission is limited to
the backend's `service_role`.

`202607130006_member_cards.sql` backfills a member/referral code for existing
customers and gives customers created by reception the same automatic code.

`202607130007_friendly_referral_codes.sql` replaces long random member codes
with memorable five-character codes derived from the customer's first name,
such as `TUAN7`, while preserving case-insensitive uniqueness.
