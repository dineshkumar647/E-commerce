# Product review feature

## Review workflow
1. Customer opens a product detail page.
2. React requests `GET /api/reviews/:productId` and displays reviews and average rating.
3. Customer signs in and submits a 1–5 star rating, title, and comment.
4. Express verifies the JWT, validates fields, and checks MongoDB Orders for an order containing the product.
5. MongoDB stores one review per customer/product pair. A unique compound index prevents duplicates.
6. The client refreshes the review list and rating summary.

## API
- `GET /api/reviews/:productId` — public.
- `POST /api/reviews/:productId` — JWT required; body: `{ "rating": 5, "title": "Great product", "comment": "Works well and matches the description." }`.

Only customers with an order containing the product can post a review. The demo checks purchase history, not delivery completion. Payment processing is not connected; checkout is a university-project order simulation.
