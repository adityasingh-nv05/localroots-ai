# Testing LocalRoots AI

## Automated checks

```bash
npm run typecheck   # TypeScript, strict mode
npm run lint        # ESLint (Next.js rules)
npm run test:unit   # 59 unit tests for data, search, filters, sorting, ratings and favourites
npm run build       # production build
npm run check       # all of the above in order
```

`test:unit` needs Node 22.6 or newer. It uses Node's built-in test runner, so there are no extra dependencies.

## Manual checklist

Start the app with `npm run dev`, then open http://localhost:3000.

### Listing page (`/explore`)
1. Cards show an image (or a coloured placeholder), name, category, city and district, description, rating with count, and a verification badge.
2. Click a card title: it opens the business profile.
3. Resize to phone width (about 375 px): cards stack in one column, and the location chips scroll sideways.

### Search (`/explore`)
Type each of these in the search box and press Apply. Each should return the listed businesses.

| Search | Expected result |
|---|---|
| `Kaveri` | Kaveri Filter Kaapi House (by name) |
| `filter coffee` | Kaveri Filter Kaapi House (by tag and product) |
| `brass diya` | Hampi Stone & Brass Works (by product) |
| `estate walk` | Coorg Coffee Trail Guides (by service) |
| `handicrafts` | Hampi Stone & Brass Works (by category) |
| `mysuru` | Mysuru Silk Weave Studio (by city) |
| `dharwad` | Hubballi Organic Farm Shop (by district) |
| `xyzzy` | Empty state: "No listings match your filters" |

### Filters and sorting
1. Choose a category (for example Food): two listings appear.
2. Choose Mangaluru as the location: only Mangaluru Seafood Kitchen appears.
3. Set sort to "Highest rated": Coorg Coffee Trail Guides (4.8) is first. "Most popular" puts Kaveri Filter Kaapi House (128 ratings) first.
4. Click Reset: the filters clear and all listings return.
5. The URL changes with each filter (for example `/explore?location=mangaluru&sort=rating`), so a filtered view can be shared.

### Karnataka exploration
1. Each location chip shows a count. Bengaluru shows 2.
2. Click Hampi: only the Hampi listing appears, and the chip is highlighted.
3. Check that Bengaluru, Mysuru, Mangaluru, Udupi, Coorg, Hampi and Hubballi each have a chip.

### Favourites
1. On a listing card, click **Save**. The button turns red and reads **Saved**.
2. Reload the page: it is still saved.
3. Open `/favorites`: the business appears. Its card is also present on the detail page.
4. Click **Saved** again to unsave. It disappears from `/favorites`.
5. Save two or three businesses, then click **Clear all** and confirm. The page shows the empty state.
6. Open the site in a private window and check that favourites are not shared with your normal window.

### Business profile (`/business/kaveri-filter-kaapi-house`)
1. Gallery: two sample illustrations are shown.
2. Products and services: Products list lists filter coffee items. Services shows nothing (none for this business). For `/business/coorg-coffee-trail-guides`, the estate walk appears under Services with "from ₹1,200".
3. Reviews and ratings: a summary with average, count and star bars appears above the review list.
4. Contact: address, and phone or email if present. Website and social links appear only when the sample has them.
5. Location: click "Open in Google Maps". It opens a new tab with the coordinates.
6. Verification: shows "Verification pending" or "Not verified". It never shows "Verified" for sample data.
7. Visit `/business/does-not-exist`: the "Business not found" page appears.

### Loading and error states
- Loading: refresh `/explore` on a slow connection (browser devtools, throttling). Skeleton cards appear first.
- Error: the error boundary shows "We couldn't load listings" with a "Try again" button. To test it, temporarily make `listBusinesses` throw in `business-service.ts`, then revert.
- Blocked storage: in a browser that blocks site data, `/favorites` shows "Favourites can't be saved here".

### Responsive
Check the explore page, a profile page and `/favorites` at about 375 px, 768 px and 1280 px.

## What the tests cover
- `favorites-storage.test.ts`: reading and writing favourites, validation, duplicate handling, limit.
- `ratings.test.ts`: averages, star counts, percentages, empty input.
- `business-service.test.ts`: search by name, tag, product, service, category, city and district; location filter; combined filters; sorting; location counts; lookups.
- `sample-data.test.ts`: unique ids and slugs, valid categories and ratings, coordinate pairs, no verified samples, every image file exists, every location has a listing.
