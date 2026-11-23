# Kinglet Furniture & Interior — Production API Reference
## Base URL: `http://localhost:5000/api/v1` (Production: `https://www.kingletbd.com/api/v1`)

All protected endpoints require an `Authorization: Bearer <JWT>` header with authorized admin roles (`SUPER_ADMIN`, `STORE_MANAGER`, `DISPATCH_OFFICER`).

---

## 1. Authentication & Security Endpoints
- **`POST /auth/login`**: Authenticates customers or administrators. Payload: `{ phone, password }`. Returns `{ token, user: { id, fullName, role, roles } }`.
- **`GET /auth/me`**: Returns current authenticated user session data.

---

## 2. Admin Operations & Dashboard
- **`GET /admin/dashboard/stats?range=30d`**: Returns financial KPIs, total sales, daily order trends, low stock warnings, and ticket count.
- **`GET /admin/notifications?limit=15`**: Retrieves live operational notifications.
- **`PATCH /admin/notifications/read`**: Marks notifications as read.

---

## 3. Order Management System (OMS)
- **`GET /admin/orders`**: Retrieves paginated orders with filters (`status`, `paymentStatus`, `search`, `page`, `limit`).
- **`GET /admin/orders/:id`**: Returns complete order detail, items snapshot, payment transactions, customer details, and milestone progression history.
- **`PUT /admin/orders/:id/status`**: Transitions order lifecycle (`PENDING` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `PREPARING` ➔ `READY_FOR_DISPATCH` ➔ `SHIPPED` ➔ `DELIVERED`). Enforces audit logging.
- **`PATCH /admin/orders/:id/payment`**: Updates payment status (`PARTIAL`, `PAID`, `FAILED`) and records transaction ID.
- **`POST /admin/orders/:id/tracking`**: Records shipping provider, tracking number, and estimated arrival date.
- **`POST /admin/orders/:id/cancel`**: Cancels order and atomically restores reserved product inventory.
- **`POST /admin/orders/:id/refund`**: Processes full or partial customer refunds.
- **`POST /admin/orders/bulk-delete`**: Deletes completed or test orders with audit log protection.

---

## 4. Product Catalog & Image Processing
- **`GET /admin/products`**: Lists all products with stock status and category mapping.
- **`POST /admin/products`**: Creates a new product with wood type, dimensions, finish, pricing, and SEO defaults.
- **`PUT /admin/products/:id`**: Updates product details; automatically tracks price revisions in `ProductPriceHistory`.
- **`PATCH /admin/products/:id/toggle-placement`**: Toggles showcase badges (`isFeatured`, `isNewArrival`, `isOffer`, `isShowroomClassic`).
- **`DELETE /admin/products/:id`**: Soft-deletes or deactivates a product.
- **`POST /admin/uploads`**: Multipart image upload processed through Sharp into optimized WebP formats with persistent disk storage.

---

## 5. Warehouse & Inventory Control
- **`GET /admin/inventory`**: Shows real-time warehouse stock (Available vs Reserved vs Low Stock Alert).
- **`POST /admin/inventory/adjust`**: Performs manual stock additions or damage write-offs with audit notes.
- **`GET /admin/inventory/movements`**: Complete audit ledger of all order reservations, deductions, and restorations.
- **`POST /admin/inventory/sweep-reservations`**: Clears expired cart reservations older than 2 hours.

---

## 6. Category Hierarchy
- **`GET /admin/categories`**: Retrieves complete parent-child category tree.
- **`POST /admin/categories`**: Creates a new category with slug, image, and meta descriptions.
- **`PUT /admin/categories/:id`**: Updates category metadata.
- **`DELETE /admin/categories/:id`**: Deletes empty categories or reassigns child products.

---

## 7. Customer Support, Leads & VIP Bookings
- **`GET /admin/tickets`**: Retrieves 3D interior inquiries, showroom VIP bookings, and custom sizing requests.
- **`PUT /admin/tickets/:id/status`**: Updates ticket state (`PENDING` ➔ `IN_PROGRESS` ➔ `RESOLVED`).
- **`POST /support/interior-inquiry`**: Public storefront endpoint for 3D interior design requests.
- **`POST /support/showroom-booking`**: Public storefront endpoint for Mirpur showroom VIP visits.
- **`POST /support/inquiry`**: Public storefront endpoint for custom sizing consultations.

---

## 8. Dynamic Technical SEO & Google Merchant Center
- **`GET /admin/seo/matrix`**: Returns page routes and their custom title, meta description, and indexing rules.
- **`POST /admin/seo/metadata`**: Upserts custom SEO tags and Schema.org overrides.
- **`GET /admin/seo/redirects`**: Lists active 301 / 302 URL redirects.
- **`POST /admin/seo/redirects`**: Creates a new 301 URL redirect.
- **`POST /admin/seo/sitemap/regenerate`**: Rebuilds the live XML sitemap (`/sitemap.xml`) directly from MySQL data.
- **`GET /api/v1/seo/google-merchant-feed.xml`**: Public RSS 2.0 XML product feed for Google Shopping.

---

## 9. Security, Audit Trail & System Backup
- **`GET /admin/audit-logs`**: Immutable ledger of administrative actions (who, what, when, IP address).
- **`GET /admin/backup/export`**: Full JSON / SQL data dump of all database tables.
- **`GET /admin/settings` & `PUT /admin/settings`**: Configures COD advance rule (৳5,000 default), delivery charges, and hotline phone numbers.

