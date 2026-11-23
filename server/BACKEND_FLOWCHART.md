# Kinglet Bangladesh Ltd — Admin Portal (`kingletbd.com/admin`)
## Full Backend Architecture & Functionalities Flowchart

This document details the complete backend architecture, data processing pipelines, and module workflows powering the Kinglet Furniture & Interior Admin Operations Portal (`/admin`).

---

## ১. Master Backend Architecture Flowchart (`/admin`)

Full end-to-end map from Administrator Authentication through RBAC middleware, backend controllers, and MySQL 8.0 database persistence:

```mermaid
flowchart TD
    AdminUser(["👨‍💼 Kinglet Administrator / Staff"]) --> LoginUI["Admin Login Portal (/admin/login)"]
    
    subgraph AuthTier["1. Security & RBAC Middleware"]
        LoginUI -->|POST /api/v1/auth/login| AuthCheck{"Verify Phone/Email & Password"}
        AuthCheck -->|Valid| IssueJWT["Issue Admin JWT Token (Role: SUPER_ADMIN / STORE_MANAGER / DISPATCH)"]
        AuthCheck -->|Invalid| RejectAuth["401 Unauthorized + Rate Limit Counter"]
        IssueJWT --> RBACGuard["requireAuth & requireRole Middleware"]
    end

    RBACGuard --> AdminLayout["Admin Dashboard & Navigation Hub (/admin)"]

    subgraph CoreAdminModules["2. Admin Operations Modules"]
        AdminLayout --> M_Dash["🏠 Dashboard & KPIs"]
        AdminLayout --> M_Orders["📋 Order Management (OMS)"]
        AdminLayout --> M_Products["🅿️ Products & Attributes"]
        AdminLayout --> M_Categories["🗂️ Category Hierarchy"]
        AdminLayout --> M_Inventory["📦 Inventory & Stock Movement"]
        AdminLayout --> M_Transactions["🔀 Payments & Verification"]
        AdminLayout --> M_Ecommerce["💻 Coupons & Shipping Rates"]
        AdminLayout --> M_Tickets["🎫 Leads & VIP Bookings"]
        AdminLayout --> M_SEO["🌐 SEO Matrix & Redirects"]
        AdminLayout --> M_CMS["📰 Banners, Blogs & Settings"]
        AdminLayout --> M_System["👤 Users, Audit Logs & Backup"]
    end

    subgraph BackendControllers["3. Backend API Services (Express 5)"]
        M_Dash --> C_Dash["adminRoutes.js: /dashboard/stats & /notifications"]
        M_Orders --> C_Orders["orderRoutes.js & adminRoutes.js: /orders/*"]
        M_Products --> C_Products["productRoutes.js & imageRoutes.js: /products & /uploads"]
        M_Categories --> C_Categories["categoryRoutes.js: /categories/*"]
        M_Inventory --> C_Inventory["adminRoutes.js: /inventory/adjust & /movements"]
        M_Transactions --> C_Transactions["paymentRoutes.js: /payments & /transactions"]
        M_Ecommerce --> C_Ecommerce["couponRoutes.js: /coupons & /shipping-methods"]
        M_Tickets --> C_Tickets["supportRoutes.js: /tickets & /interior-inquiry"]
        M_SEO --> C_SEO["seo.service.js: /seo/matrix & /sitemap/regenerate"]
        M_CMS --> C_CMS["cmsRoutes.js: /banners, /faqs, /settings"]
        M_System --> C_System["adminRoutes.js: /audit-logs & /backup/export"]
    end

    subgraph DatabaseTier["4. Persistent Database (MySQL 8.0 via Prisma)"]
        C_Dash --> DB_Read[(Live Metrics & Sales Snapshot)]
        C_Orders --> DB_Orders[(Order, OrderItem, OrderStatusHistory)]
        C_Products --> DB_Products[(Product, ProductImage, ProductPriceHistory)]
        C_Categories --> DB_Categories[(Category Tree)]
        C_Inventory --> DB_Inventory[(Inventory, StockMovement Ledger)]
        C_Transactions --> DB_Payments[(PaymentTransaction, RefundRecord)]
        C_Ecommerce --> DB_Coupons[(Coupon, ShippingMethod)]
        C_Tickets --> DB_Tickets[(SupportTicket, CustomerAddress)]
        C_SEO --> DB_SEO[(SeoMetadata, UrlRedirect, Sitemap.xml)]
        C_CMS --> DB_CMS[(HomepageBanner, WebsiteSetting)]
        C_System --> DB_System[(User, AuditLog, Full SQL/JSON Dump)]
    end
```

---

## ২. Order Management System (OMS) Backend Flowchart

Step-by-step lifecycle handling COD security advances, manual bKash/Bank TrxID verification, factory joinery progression, shipment, and atomic restock guard:

```mermaid
flowchart TD
    OrderReceived(["New Order in System"]) --> FetchOrder["GET /api/v1/admin/orders/:id"]
    
    subgraph OrderVerificationStep["Step 1: Order & Advance Verification"]
        FetchOrder --> CheckPaymentType{"Payment Method?"}
        
        CheckPaymentType -->|COD Advance ৳5,000| CheckTrx["Customer Submitted bKash/Bank TrxID"]
        CheckPaymentType -->|Online Gateway| AutoVerified["Already Paid via PGW"]
        
        CheckTrx --> AdminVerifies{"Admin Checks Bank/MFS Ledger"}
        AdminVerifies -->|TrxID Matches| ApprovePayment["PATCH /api/v1/admin/orders/:id/payment<br/>(status: PARTIALLY_PAID, advanceAmount: ৳5,000)"]
        AdminVerifies -->|Fake / Unpaid| RejectPayment["PATCH /api/v1/admin/orders/:id/payment<br/>(status: FAILED / CANCELLED)"]
    end

    ApprovePayment --> ConfirmOrder["PUT /api/v1/admin/orders/:id/status<br/>(orderStatus: CONFIRMED)"]
    AutoVerified --> ConfirmOrder

    subgraph ManufacturingStep["Step 2: Factory Production Pipeline (3-20 Days)"]
        ConfirmOrder --> ProcessOrder["PUT /orders/:id/status (PROCESSING)<br/>👉 Allocate Seasoned Mahogany / Oak Veneer"]
        ProcessOrder --> PrepareOrder["PUT /orders/:id/status (PREPARING)<br/>👉 Vacuum Kiln-Drying (Moisture < 10%) & Master Joinery"]
        PrepareOrder --> QAReady["PUT /orders/:id/status (READY_FOR_DISPATCH)<br/>👉 5-Stage Italian PU Spray & 100% Quality Inspection"]
    end

    subgraph LogisticsDispatchStep["Step 3: Courier Dispatch & Delivery"]
        QAReady --> AssignCourier["POST /api/v1/admin/orders/:id/tracking<br/>(courierName, trackingNumber, estimatedDeliveryDate)"]
        AssignCourier --> ShipOrder["PUT /orders/:id/status (SHIPPED / OUT_FOR_DELIVERY)<br/>White-Glove Fleet (Dhaka) / Wooden Crate (64 Districts)"]
        ShipOrder --> CompleteDelivery["PUT /orders/:id/status (DELIVERED)<br/>Collect Remaining Due Amount at Doorstep<br/>Update paymentStatus = PAID"]
    end

    subgraph CancellationAndRestock["Step 4: Cancellation & Atomic Restock Guard"]
        RejectPayment --> CancelOrder["PUT /api/v1/admin/orders/:id/cancel"]
        ProcessOrder -->|Customer Cancelled| CancelOrder
        CancelOrder --> AtomicRestock["ACID Transaction:<br/>1. orderStatus = CANCELLED<br/>2. Inventory availableQuantity += item.quantity<br/>3. INSERT INTO StockMovement (ORDER_CANCELLED_RESTORE)"]
    end

    CompleteDelivery --> OrderCompleted(["🎉 Order Successfully Completed & 10-Yr Warranty Activated"])
```

---

## ৩. Product Catalog & Multi-Image Pipeline Flowchart

Image Sharp processing, WebP compression, EXIF stripping, and persistent disk caching:

```mermaid
flowchart LR
    AdminForm["Admin Product Form (Name, Material, Wood Finish, Base Price, Dimensions)"] --> UploadImage["Select High-Res Photos"]
    
    subgraph ImageSharpPipeline["Image Processing Pipeline (/api/v1/admin/uploads)"]
        UploadImage --> Multer["Multer Memory Buffer"]
        Multer --> SharpProcess["Sharp Engine:<br/>1. Convert to .webp format<br/>2. Optimize compression (85% quality)<br/>3. Strip dangerous EXIF metadata"]
        SharpProcess --> DiskSave["Save to /storage/objects/<hash>.webp with 1-Year Cache Headers"]
    end

    DiskSave --> CreateProduct["POST /api/v1/admin/products"]
    
    subgraph ProductDatabaseLogic["Product Persistence Logic"]
        CreateProduct --> SlugGen["Auto-generate Unique Slug & SKU (e.g. KL-BED-421)"]
        SlugGen --> SaveProductDB["INSERT INTO Product & ProductImage"]
        SaveProductDB --> InitInventory["Auto-create Inventory Record (Default stock: 5 units)"]
        SaveProductDB --> AutoSEO["Auto-generate Schema.org Meta (Title, Description, Canonical)"]
    end

    SaveProductDB --> LiveProduct(["Product Live on Storefront & Sitemaps"])
```

---

## ৪. Lead & Consultation Desk Flowchart (`/admin/orders?filter=tickets`)

Customer inquiries from 3D consultation, showroom VIP bookings, and custom sizing:

```mermaid
flowchart TD
    subgraph StorefrontForms["Customer Storefront Triggers"]
        F1["Interior 3D Consultation Form"] -->|POST /api/v1/support/interior-inquiry| B1["Validate Phone (01XXXXXXXXX) + Anti-Spam Honeypot"]
        F2["VIP Showroom Booking Form"] -->|POST /api/v1/support/showroom-booking| B2["Validate Date, Guests & Preferred Showroom"]
        F3["Custom Dimensions Inquiry Modal"] -->|POST /api/v1/support/inquiry| B3["Validate Custom Width, Length & Wood Specs"]
    end

    B1 --> CreateTicket["INSERT INTO SupportTicket (ticketCode: KL-INT-..., KL-SHW-..., KL-INQ-...)"]
    B2 --> CreateTicket
    B3 --> CreateTicket

    CreateTicket --> PushAdminNotif["Create AdminNotification (Type: LEAD_ALERT, Priority: HIGH)"]
    CreateTicket --> WhatsAppCTA["Generate Direct WhatsApp Link to Chief Architect / Director"]

    subgraph AdminDeskAction["Admin Operations (/admin/orders?filter=tickets)"]
        PushAdminNotif --> AdminViews["Admin Views Customer Requirements & Phone"]
        AdminViews --> CallCustomer["Direct Call / WhatsApp Consultation"]
        CallCustomer --> UpdateStatus["PUT /api/v1/admin/tickets/:id/status (IN_PROGRESS ➔ RESOLVED)"]
    end
```

---

## ৫. Complete Admin Portal Backend Endpoints Reference Table

| অ্যাডমিন মেনু লিংক | ফ্রন্টএন্ড পাথ | ব্যাকএন্ড API এন্ডপয়েন্ট | HTTP মেথড | ব্যাকএন্ড ও ডেটাবেজ একশন |
| :--- | :--- | :--- | :---: | :--- |
| **Dashboard** | `/admin` | `/api/v1/admin/dashboard/stats` | `GET` | মোট সেলস, দৈনিক অর্ডার, লো স্টক অ্যালার্ট ও চার্ট ডেটা রিটার্ন করে। |
| **All Orders** | `/admin/orders` | `/api/v1/admin/orders` | `GET` | ফিল্টারসহ সব অর্ডারের তালিকা ও কাস্টমার স্ন্যাপশট লোড করে। |
| **Order Status** | `/admin/orders` | `/api/v1/admin/orders/:id/status` | `PUT` | অর্ডারের স্ট্যাটাস পরিবর্তন করে এবং `OrderStatusHistory`-তে লগ রাখে। |
| **Verify Payment** | `/admin/orders` | `/api/v1/admin/orders/:id/payment` | `PATCH` | bKash/Bank TrxID অ্যাপ্রুভ করে এবং ৳৫,০০০ সিওডি অ্যাডভান্স লেজারে যোগ করে। |
| **Dispatch Tracking**| `/admin/orders` | `/api/v1/admin/orders/:id/tracking` | `POST` | কুরিয়ার নাম, ট্র্যাকিং নম্বর ও আনুমানিক ডেলিভারির তারিখ সেভ করে। |
| **Cancel & Restock**| `/admin/orders` | `/api/v1/admin/orders/:id/cancel` | `POST` | অর্ডার বাতিল করে এবং ইনভেন্টরিতে কাঠের স্টক স্বয়ংক্রিয়ভাবে ফেরত দেয়। |
| **Manage Products** | `/admin/products`| `/api/v1/admin/products` | `GET`, `POST` | কাঠের ধরন, ফিনিশ, ওয়ারেন্টি ও সাইজ অনুযায়ী প্রোডাক্ট তৈরি ও সার্চ। |
| **Image Upload** | `/admin/products`| `/api/v1/admin/uploads` | `POST` | শার্প (Sharp) দিয়ে হাই-রেজ ছবিকে অপটিমাইজড `.webp`-তে কনভার্ট করে সেভ করে। |
| **Manage Inventory**| `/admin/inventory`| `/api/v1/admin/inventory/adjust` | `POST` | ম্যানুয়াল স্টক যোগ/বিয়োগ করে এবং `StockMovement` অডিট ট্রেইল সংরক্ষণ করে। |
| **Categories** | `/admin/categories`| `/api/v1/admin/categories` | `GET`, `POST` | ক্যাটাগরি ও সাব-ক্যাটাগরি ট্রি তৈরি ও স্লাগ ম্যানেজ করে। |
| **Coupons** | `/admin/coupons` | `/api/v1/admin/coupons` | `GET`, `POST` | ডিসকাউন্ট কুপন তৈরি, এক্সপায়ারি ও ব্যবহার সীমা নির্ধারণ করে। |
| **Lead Tickets** | `/admin/orders` | `/api/v1/admin/tickets` | `GET`, `PUT` | ইন্টেরিয়র ৩ডি ডিজাইন ও শোরুম ভিআইপি বুকিং স্ট্যাটাস ম্যানেজ করে। |
| **SEO Studio** | `/admin/seo` | `/api/v1/admin/seo/sitemap/regenerate` | `POST` | লাইভ ডাটাবেজ থেকে Google XML সাইটম্যাপ রিয়েল-টাইমে পুনরুৎপাদন করে। |
| **Audit Logs** | `/admin/orders` | `/api/v1/admin/audit-logs` | `GET` | কোন অ্যাডমিন কখন কোন অর্ডারে কি পরিবর্তন করেছেন তার অপরিবর্তনীয় প্রমাণ রাখে। |
| **Transactions** | `/admin/orders` | `/api/v1/admin/transactions` | `GET` | গেটওয়ে ও ম্যানুয়াল MFS লেনদেনের সম্পূর্ণ তালিকা রিটার্ন করে। |
| **Customers** | `/admin/orders` | `/api/v1/admin/customers` | `GET` | কাস্টমার প্রোফাইল, মোট অর্ডার সংখ্যা ও মোট খরচ লোড করে। |
| **Settings** | `/admin/content` | `/api/v1/admin/settings` | `GET`, `PUT` | সিওডি অ্যাডভান্স রুল, ডেলিভারি ফি ও হটলাইন কনফিগার করে। |

