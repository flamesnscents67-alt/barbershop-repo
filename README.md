# The Gentlemen's Barber

Static front end (HTML, CSS, JS) + Supabase database. No build step.

## 1. Create the database (free)
1. Sign up at supabase.com and create a project.
2. SQL Editor > New query > paste all of `supabase/schema.sql` > Run.
3. Authentication: turn OFF "Allow new users to sign up" (so only you can log in).
4. Authentication > Users > Add user: your email + password (tick auto-confirm). This is the owner login.
5. Project Settings > API: copy the Project URL and the "anon public" key.
6. Paste both into `js/config.js`. Never use the service_role key.

## 2. Deploy on GitHub Pages
Push everything to a repo (keep `index.html` in the root), then Settings > Pages > Deploy from branch `main` / root.

## 3. Use it
Customers book at `book.html`; owner signs in at `auth.html` (also "Owner Login" in the footer) and manages bookings at `dashboard.html`.

Shop hours (10:00-20:00, closed Sunday), 30-minute start times and the Asia/Karachi timezone are enforced on the server in `schema.sql`.
