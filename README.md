# 🌱 LocalRoots AI

Karnataka-first, India-wide platform connecting customers with local businesses,
artisans, shops, food vendors, and cultural tourism destinations — powered by AI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-org/localroots-ai.git
cd localroots-ai
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase credentials (see `.env.example` for all keys).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
├── app/                     # Next.js App Router pages & layouts
│   ├── (customer)/          # Customer-facing routes (explore, map, about)
│   ├── (vendor)/            # Vendor routes (list business, dashboard)
│   ├── (admin)/             # Admin panel routes
│   └── auth/                # Auth routes (login, register)
├── components/
│   ├── layout/              # Navbar, Footer, page shells
│   ├── ui/                  # Reusable UI primitives (Button, Card, Badge…)
│   └── shared/              # Cross-feature composite components
├── features/
│   ├── search/              # Search logic & components
│   ├── listings/            # Business listing cards & detail views
│   ├── auth/                # Auth forms & session helpers
│   └── map/                 # Map integration
├── lib/
│   ├── supabase/            # Supabase client (browser) & server client
│   ├── utils/               # Pure helper functions (cn, format…)
│   └── hooks/               # Custom React hooks
└── types/                   # Shared TypeScript types & interfaces
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server at localhost:3000 |
| `npm run build` | Create production build |
| `npm start` | Start production server (after build) |
| `npm run lint` | Run ESLint |

---

## Environment Variables

See `.env.example` for the full list. Required keys:

- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public anon key (safe to expose in browser)
- `SUPABASE_SERVICE_ROLE_KEY` — Service-role key (server-only, never expose)

---

## Roadmap (Foundation ✅, Next Steps)

- [ ] Supabase schema migrations (users, listings, reviews)
- [ ] Business listing CRUD with image uploads
- [ ] AI-powered search and recommendations
- [ ] Interactive Karnataka district map
- [ ] Vendor onboarding & dashboard
- [ ] Customer reviews & ratings
- [ ] Admin moderation panel
- [ ] PWA support

---

Made with ❤️ for Karnataka & India.
