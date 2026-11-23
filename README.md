# ShopFlow — E-Commerce Shopping & Order Management System using DFA

A university mini-project integrating:
- **22ITT51 – Full Stack Web Development:** React, Node.js, Express.js and MongoDB.
- **22ITT52 – Computer Networks:** HTTP/HTTPS, REST communication, JSON, CORS, TLS deployment notes and secure API practices.
- **22ITT53 – Formal Languages and Automata Theory:** Deterministic Finite Automaton (DFA) validates order-status transitions.

## Main features
- Product catalogue with category filter, search and price sorting.
- Product detail popup with customer review list, average rating and 1–5 star review form.
- Verified-purchase reviews: customer must have ordered the product; one review per customer/product.
- Persistent wishlist with saved-product filtering.
- Shopping cart, quantity controls and checkout form.
- Form validation on client and server.
- Customer registration/login with hashed passwords and JWT authentication.
- Place orders and view order history/tracking timeline.
- Admin demo login and order status management.
- DFA validation: only legal order status transitions are accepted.
- REST API, Helmet security headers, rate limiting, CORS configuration and environment-based secrets.
- Responsive interface and sample product seed data.

## Requirements
- Node.js 18+
- MongoDB Community Server or MongoDB Atlas
- npm

## Run locally
1. Open this folder in VS Code.
2. Install root helper:
   ```bash
   npm install
   ```
3. Install both applications:
   ```bash
   npm run install:all
   ```
4. Copy `server/.env.example` to `server/.env` and set your MongoDB URL and JWT secret.
5. Seed sample products and demo users:
   ```bash
   npm run seed --prefix server
   ```
6. Start backend and frontend:
   ```bash
   npm run dev
   ```
7. Open `http://localhost:5173`.

Backend runs at `http://localhost:5000`.

### Demo accounts
- Admin: `admin@shopflow.demo` / `Admin@123`
- Customer: `customer@shopflow.demo` / `Customer@123`

Change demo passwords before any public deployment.

## DFA model
The DFA recognizes valid order-status sequences. States:
- `PLACED` (start)
- `CONFIRMED`
- `PACKED`
- `SHIPPED`
- `OUT_FOR_DELIVERY`
- `DELIVERED` (accepting)
- `CANCELLED` (accepting terminal state)

Valid transitions:
- PLACED → CONFIRMED or CANCELLED
- CONFIRMED → PACKED or CANCELLED
- PACKED → SHIPPED
- SHIPPED → OUT_FOR_DELIVERY
- OUT_FOR_DELIVERY → DELIVERED
- DELIVERED and CANCELLED are terminal states.

A transition not listed above is rejected by the backend with HTTP 400. See `docs/dfa.md` for the state diagram and complete transition table.

## API overview
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health |
| GET | `/api/products` | List/search products |
| GET | `/api/reviews/:productId` | Read product reviews and average rating |
| POST | `/api/reviews/:productId` | Submit verified-purchase review |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/orders/my` | Customer order history |
| POST | `/api/orders` | Place order |
| GET | `/api/orders/:id` | Order details |
| PATCH | `/api/orders/:id/status` | Admin DFA-validated status update |

All protected routes use `Authorization: Bearer <token>`.

## Subject mapping
See `docs/subject-mapping.md` for how the project demonstrates all three subjects, including Computer Networks and FLAT deliverables.

## GitHub submission checklist
- [ ] Upload complete project source.
- [ ] Include screenshots of home, cart, checkout and tracking pages.
- [ ] Include `docs/dfa.md` (diagram + transition table).
- [ ] Include `docs/subject-mapping.md`.
- [ ] Add your name, register number and department to the report cover page if required.
- [ ] Never upload `.env`, passwords or private keys.

## Product reviews API
- `GET /api/reviews/:productId` — public review list and average rating
- `POST /api/reviews/:productId` — authenticated verified-purchase review (`rating`, `title`, `comment`)
- A customer can submit one review per product. The server verifies that the customer has an order containing that product.
