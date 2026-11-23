# Three-Subject Integration

## 22ITT51 — Full Stack Web Development
- React + Vite provide component-based user interface and client-side form validation.
- Node.js + Express.js provide REST endpoints and middleware.
- MongoDB + Mongoose store users, products and orders.
- JWT authentication protects customer and admin routes.
- Sample inputs: register details, product quantity, shipping address and order status.
- Sample output: order number, total amount and order tracking timeline.

## 22ITT52 — Computer Networks
- Browser communicates with Express server using HTTP request/response.
- REST API uses standard methods: GET, POST and PATCH.
- JSON is the application data format; HTTP status codes communicate success or errors.
- CORS controls which browser origins may call the API.
- Helmet adds common HTTP security headers; rate limiting reduces repeated request abuse.
- For production, deploy behind HTTPS/TLS. HTTPS encrypts data in transit and protects integrity; configure TLS at the hosting platform/reverse proxy. Do not send passwords or tokens over plain HTTP in production.
- Example flow: React browser → HTTPS request → Express API → Mongoose → MongoDB → JSON response.

## 22ITT53 — Formal Languages and Automata Theory
- A DFA checks whether an order-status event is legal for the current state.
- The state set, alphabet, initial state, accepting states and transition function are documented in `dfa.md`.
- The API rejects illegal transitions with HTTP 400, so an order cannot jump directly from PLACED to SHIPPED.
- State transition diagram and transition table are included in `dfa.md`.

## Sample test cases
| Input sequence | Expected result |
|---|---|
| CONFIRM, PACK, SHIP, OUT_FOR_DELIVERY, DELIVER | DELIVERED |
| CANCEL | CANCELLED |
| SHIP while PLACED | Rejected |
| PACK while SHIPPED | Rejected |
| Any event after DELIVERED | Rejected |


## Added customer review feature
- **Full Stack Web Development:** React product detail/review UI, Express review endpoints, Mongoose Review model, JWT authentication and form validation.
- **Computer Networks:** browser-to-server HTTP GET/POST requests, JSON API communication, authentication header and REST endpoint design.
- **Formal Languages and Automata Theory:** the existing order-management DFA remains implemented and documented; review eligibility is separately checked against stored purchase history.
