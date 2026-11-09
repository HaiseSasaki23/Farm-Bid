# Bidding Farm: Frontend

React + TypeScript + Vite. Runs today against a mock API stored in the browser (localStorage), so you can build and demo every screen before the backend exists.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then builds to dist/
```

Demo accounts (password `demo1234`): `farmer@demo.com` and `buyer@demo.com`.
The login page has "Fill farmer", "Fill buyer" and "Reset demo data" buttons.

Trying both roles: all demo data and the login live in this browser's localStorage, so farmers and buyers see each other's bids and notifications, but only one account can be logged in per browser profile. Switch accounts by logging out and in. A second tab shares the same login (logging in as the buyer there replaces the farmer's session), although changes made in one tab do refresh the other without a reload.

A quick demo that touches everything: log in as `buyer@demo.com`, place a bid on a listing, log out, log in as that listing's farmer and accept the bid (Maria `farmer@demo.com` owns the rice, corn and eggplant listings; `liza@demo.com` owns the mango and banana; `ramon@demo.com` owns the tomato and cabbage), complete the sale under Sales, then log back in as the buyer to see the bid status and notification.

## Screens

| Role | Route | What it does |
|---|---|---|
| Both | `/login`, `/register` | Register as Farmer or Buyer, then log in. Role decides where you land. |
| Farmer | `/farmer` | Dashboard: pending bids, active listings, accepted bids, sales, bidding activity, AI shortcut |
| Farmer | `/farmer/listings` | Create, edit, delete, close (mark unavailable), mark sold, reopen. Quality is a 1 to 5 star rating. Photo upload. |
| Farmer | `/farmer/listings/:id/bids` | Compare offers, run AI bid analysis, accept or reject |
| Farmer | `/farmer/transactions` | Complete or cancel a sale |
| Buyer | `/buyer` | Dashboard: pending and accepted bids, newest harvests, recent bids |
| Buyer | `/buyer/browse` | Search by crop; filter by location, price, quantity, quality; sort by newest, lowest price, highest starting price |
| Buyer | `/buyer/listings/:id` | Full details and the bid form (price per unit and quantity, with validation) |
| Buyer | `/buyer/bids` | Track Pending, Accepted, Rejected, Cancelled. Cancel pending bids. |
| Buyer | `/buyer/transactions` | Purchases |
| Both | `/{role}/notifications` | List, mark as read, mark all as read. Unread count shows in the nav. |

## Folder map

```
src/
  types.ts                 domain types, named after the class diagram
  api/                     ALL data access lives here (see "Connecting the backend")
    mockDb.ts              localStorage database + seed data
    authService.ts  harvestService.ts  bidService.ts
    transactionService.ts  notificationService.ts  aiAnalysisService.ts
    index.ts               the only file the UI imports from
  context/                 AuthContext, ToastContext
  hooks/useQuery.ts        load data + auto-refresh after any write
  components/              ui.tsx (badges, price tag, stars, modal...), Layout, ListingCard, ListingForm
  pages/                   login/register, shared pages, farmer/, buyer/
  styles.css               design tokens + components (no CSS framework)
```

## Connecting the backend

The screens never touch localStorage. They call the services in `src/api`, and each method has a comment with the endpoint it should become. To go live, replace the method bodies with `fetch` calls (keep names, arguments and return types) and delete `mockDb.ts`.

| Service method | Suggested endpoint |
|---|---|
| `authService.register / login / me` | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| `harvestService.search / get / mine` | `GET /api/harvests`, `GET /api/harvests/:id`, `GET /api/harvests/mine` |
| `harvestService.create / update / remove` | `POST /api/harvests`, `PUT /api/harvests/:id`, `DELETE /api/harvests/:id` |
| `harvestService.setStatus` | `PATCH /api/harvests/:id/status` (`Available`, `Unavailable`, `Sold`) |
| `bidService.submit / cancel` | `POST /api/bids`, `POST /api/bids/:id/cancel` |
| `bidService.forListing / received / mine` | `GET /api/harvests/:id/bids`, `GET /api/bids/received`, `GET /api/bids/mine` |
| `bidService.accept / reject` | `POST /api/bids/:id/accept`, `POST /api/bids/:id/reject` |
| `transactionService.mine / complete / cancel` | `GET /api/transactions/mine`, `POST /api/transactions/:id/complete`, `POST /api/transactions/:id/cancel` |
| `notificationService.*` | `GET /api/notifications`, `POST /api/notifications/:id/read`, `POST /api/notifications/read-all` |
| `aiAnalysisService.analyze` | `POST /api/harvests/:id/analysis` (backend calls Gemini) |

Things the mock does that the real backend must also do, because the screens rely on them:

- The user comes from the JWT. The frontend never sends a user id.
- Send the JWT as `Authorization: Bearer …` (the mock stores it under `localStorage.bf_token`).
- `accept` is one atomic action: lock the bid, reject the other pending bids on that listing, set the listing to `Reserved`, create the transaction, and notify buyers.
- Transaction `complete` sets the listing to `Sold`. `cancel` sets it back to `Available`.
- Bid validation: listing is `Available`, `bidAmount >= startingPrice`, `quantity <= listing.quantity`. The UI checks these too, but the server must enforce them.
- Throw errors with a human-readable message. The UI shows `error.message` as is.
- Images: the mock stores a resized data URL in `imagePath`. For real uploads, send the file and store the returned URL instead.

## Decisions I made (change any of them)

1. **Prices are per unit.** `bidAmount` and `startingPrice` are per kg, crate, etc. Total = price × quantity, which matches `AgreedPrice` and `TotalAmount` in your Transaction class.
2. **Listing status has four values:** `Available`, `Reserved` (a bid was accepted, transaction pending), `Sold`, `Unavailable`. Your diagram only lists a status string, so add `Reserved` on the backend or tell me to drop it.
3. **Accepting a bid closes the whole listing**, even if the bid covers only part of the stock, because your flowchart rejects all other bids. If farmers should be able to sell the rest, the listing would need a remaining-quantity field.
4. **Farmer completes or cancels the transaction.** Buyers only view it. Your flowchart didn't say who does this.
5. **After registering, the user goes to Login** (not auto-logged-in), as in the flowchart.
6. **Buyers see only the number of bids** on a listing, not other buyers' amounts. Easy to change in `ListingDetail.tsx`.
7. **Cancelling a bid does not notify the farmer** (matches the flowchart). Add one in `bidService.cancel` if you want it.
8. Currency is Philippine peso. Crop emoji tiles stand in until a farmer uploads a photo.

## Not included yet

- Real API calls and token refresh
- Tests (the flows were checked end to end in a browser during development)
- Password reset, profile editing, and an admin area, since none were in the brief
