# Holiwood Reviews

Custom review system for holiwood.ca — customers submit reviews, they sit
pending until you approve/edit/add photos in the dashboard at `/admin`.

## Deploy steps

1. Create a new GitHub repository (e.g. `holiwood-reviews`), and upload all
   these files to it (drag-and-drop works on github.com for a new repo).
2. Go to vercel.com → "Add New Project" → import the `holiwood-reviews`
   GitHub repo.
3. Before deploying, add these Environment Variables in Vercel (see
   `.env.example` for what they should look like):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (from Supabase → Settings → API Keys —
     the "service_role" secret key, NOT the anon key)
   - `ADMIN_PASSWORD` (a password you choose for the dashboard)
4. Click Deploy. Vercel will give you a URL like
   `https://holiwood-reviews.vercel.app`.
5. Open `shopify-widget-snippet.html`, replace `YOUR-VERCEL-URL` with your
   real Vercel URL, then paste the snippet into your Shopify product page
   template via the theme editor's "Custom Liquid" section.
6. Go to `https://your-vercel-url.vercel.app/admin` and log in with your
   `ADMIN_PASSWORD` to manage reviews.

## How it works

- Customers submit reviews on the product page → stored as "pending"
- You review them at `/admin` → approve, edit text, add/remove photos
- Once approved, the review shows automatically on the product page
