import prisma from "../db/prisma.js";
import { cache } from "../utils/cache.js";

export const DEFAULT_COD_SECURITY_ADVANCE_BDT = 5000;

export const DEFAULT_SYSTEM_SETTINGS = [
  // 1. Payment & Financial
  {
    key: "cod_security_advance_bdt",
    value: "5000",
    group: "payment",
    description: "Mandatory COD advance security payment in BDT (payable via bKash / Bank before COD dispatch)",
  },
  {
    key: "bkash_merchant_number",
    value: "+8801676-900442",
    group: "payment",
    description: "Official bKash Merchant / Personal number displayed for manual bKash advance & MFS transfers",
  },
  {
    key: "bank_account_details",
    value: "Kinglet Furniture & Interior • Dutch-Bangla Bank (Mirpur Br.) • A/C: 115.110.0048291",
    group: "payment",
    description: "Official Bank transfer account details for COD security advance & bank transfers",
  },
  {
    key: "emi_tenures_available",
    value: "3,6,9,12,18,24,30,36",
    group: "payment",
    description: "Comma-separated Bank EMI installment tenures in months (e.g. 3,6,9,12,18,24,30,36)",
  },
  {
    key: "emi_rates_json",
    value: JSON.stringify([
      { tenure: 3, label: "3 Months", rate: 6.00 },
      { tenure: 6, label: "6 Months", rate: 6.50 },
      { tenure: 9, label: "9 Months", rate: 6.95 },
      { tenure: 12, label: "12 Months", rate: 9.29 },
      { tenure: 18, label: "18 Months", rate: 12.99 },
      { tenure: 24, label: "24 Months", rate: 18.34 },
      { tenure: 30, label: "30 Months", rate: 19.76 },
      { tenure: 36, label: "36 Months", rate: 24.22 },
    ]),
    group: "payment",
    description: "JSON array of official Bank EMI interest & processing charges per tenure",
  },

  // 2. General Settings
  {
    key: "site_name",
    value: "Kinglet Furniture & Interior",
    group: "general",
    description: "Brand store title displayed across headers and metadata",
  },
  {
    key: "site_title",
    value: "Leading Luxury Seasoned Mahogany Furniture Brand in Bangladesh",
    group: "general",
    description: "SEO title displayed on browser tab and home header",
  },
  {
    key: "site_tagline",
    value: "10-Year Timber Guarantee • 100% Kiln-Seasoned Chittagong Mahogany & Oak Veneer",
    group: "general",
    description: "Official brand tagline and value proposition",
  },
  {
    key: "primary_phone",
    value: "+880 1898-878815",
    group: "general",
    description: "Official 24/7 hotline telephone number",
  },
  {
    key: "primary_email",
    value: "info.kingletbd@gmail.com",
    group: "general",
    description: "Official customer concierge email address",
  },
  {
    key: "whatsapp_number",
    value: "+880 1898-878815",
    group: "general",
    description: "Official WhatsApp concierge number for direct ordering and consultation",
  },
  {
    key: "showroom_address",
    value: "752/2, West Shewrapara, Begum Rokeya Sarani, Mirpur, Dhaka-1216",
    group: "general",
    description: "Official flagship experience hub showroom address",
  },
  {
    key: "currency_symbol",
    value: "৳",
    group: "general",
    description: "Primary currency symbol for store pricing",
  },
  {
    key: "facebook_url",
    value: "https://www.facebook.com/kingletbd",
    group: "general",
    description: "Official Facebook page URL",
  },
  {
    key: "instagram_url",
    value: "https://www.instagram.com/kingletbd",
    group: "general",
    description: "Official Instagram profile URL",
  },
  {
    key: "youtube_url",
    value: "https://www.youtube.com/@kingletbd",
    group: "general",
    description: "Official YouTube channel URL",
  },
  {
    key: "twitter_url",
    value: "https://twitter.com/kingletbd",
    group: "general",
    description: "Official Twitter / X profile URL",
  },
  {
    key: "linkedin_url",
    value: "https://www.linkedin.com/company/kingletbd",
    group: "general",
    description: "Official LinkedIn company page URL",
  },
  {
    key: "tiktok_url",
    value: "https://www.tiktok.com/@kingletbd",
    group: "general",
    description: "Official TikTok profile URL",
  },
  {
    key: "footer_address",
    value: "752/2, West Shewrapara, Begum Rokeya Sarani, Mirpur, Dhaka 1216",
    group: "footer",
    description: "Store address displayed in the footer and contact sections",
  },
  {
    key: "footer_phone",
    value: "+880 1898-878815, +880 1898-878816, 01676900442",
    group: "footer",
    description: "Store phone numbers displayed in the footer and contact sections",
  },
  {
    key: "footer_email",
    value: "info.kingletbd@gmail.com",
    group: "footer",
    description: "Store email displayed in the footer and contact sections",
  },
  {
    key: "footer_gateway_img",
    value: "https://www.kingletbd.com/storage/images/OM_1760886037KTtGSCGp.png",
    group: "footer",
    description: "Payment gateway image banner displayed in the footer (321x31)",
  },
  {
    key: "working_days_from_to",
    value: "Everyday except Sunday",
    group: "working_days",
    description: "Store weekly working days description",
  },
  {
    key: "friday_start",
    value: "9:00 AM",
    group: "working_days",
    description: "Friday opening time",
  },
  {
    key: "friday_end",
    value: "10:00 PM",
    group: "working_days",
    description: "Friday closing time",
  },
  {
    key: "satureday_start",
    value: "10:00 AM",
    group: "working_days",
    description: "Saturday to Thursday opening time",
  },
  {
    key: "satureday_end",
    value: "08:00 PM",
    group: "working_days",
    description: "Saturday to Thursday closing time",
  },
  {
    key: "copy_right",
    value: "Designed and Developed by Ridgeben IT Solutions Ltd. Copyright©2026, All Rights Reserved.",
    group: "general",
    description: "Copyright disclaimer displayed at the bottom of the website",
  },
  {
    key: "custom_css",
    value: "",
    group: "appearance",
    description: "Custom CSS styles dynamically injected into storefront <head>",
  },
  {
    key: "google_analytics_id",
    value: "UA-106757798-1",
    group: "seo",
    description: "Google Analytics / GA4 Tracking Measurement ID",
  },
  {
    key: "meta_keywords",
    value: "Kinglet,Kinglet Bangladesh,Kinglet Furniture,Best Furniture Showroom in BD,Home Furniture,Office furniture",
    group: "seo",
    description: "SEO Meta Keywords",
  },
  {
    key: "meta_description",
    value: "Kinglet Bangladesh ltd is no. 1 home furniture showroom in Bangladesh",
    group: "seo",
    description: "SEO Meta Description",
  },
  {
    key: "home_page_title",
    value: "Leading Furniture Store in Bangladesh",
    group: "general",
    description: "Home page SEO browser tab title",
  },
  {
    key: "primary_color",
    value: "#EC2226",
    group: "appearance",
    description: "Primary theme brand color",
  },
  {
    key: "currency_direction",
    value: "0",
    group: "general",
    description: "Currency direction: 0 for Left (৳ 100), 1 for Right (100 ৳)",
  },
  {
    key: "decimal_separator",
    value: ".",
    group: "general",
    description: "Price decimal separator",
  },
  {
    key: "thousand_separator",
    value: ",",
    group: "general",
    description: "Price thousand separator",
  },
  {
    key: "logo",
    value: "https://www.kingletbd.com/storage/images/OM_1760884761NzeZb9h8.png",
    group: "media",
    description: "Main header brand logo image URL",
  },
  {
    key: "favicon",
    value: "https://www.kingletbd.com/storage/images/OM_17608847525DnZPuIu.png",
    group: "media",
    description: "Browser tab favicon image URL",
  },
  {
    key: "loader",
    value: "https://www.kingletbd.com/storage/images/OM_1761223679xWum3x0L.jpeg",
    group: "media",
    description: "Preloader spinner image URL",
  },
  {
    key: "is_loader",
    value: "0",
    group: "media",
    description: "Enable or disable preloader (1 = active, 0 = inactive)",
  },
  {
    key: "min_price",
    value: "0",
    group: "shop",
    description: "Minimum filterable price on storefront",
  },
  {
    key: "max_price",
    value: "200000",
    group: "shop",
    description: "Maximum filterable price on storefront",
  },

  // 3. Home Notice Scroller
  {
    key: "notice_scroller_enabled",
    value: "false",
    group: "appearance",
    description: "Toggle top running announcement ticker on/off",
  },
  {
    key: "notice_scroller_text",
    value: "✨ Winter Season Luxury Offer: Get up to 25% Off on Seasoned Solid Mahogany Bedroom Suites • 0% EMI across 18 Banks • Free Assembly in Dhaka • Call Hotline: +8801676900442",
    group: "appearance",
    description: "Text content scrolling along the top header banner",
  },
  {
    key: "notice_scroller_bg",
    value: "#0f172a",
    group: "appearance",
    description: "Background color of the top announcement ticker",
  },
  {
    key: "notice_scroller_speed",
    value: "28s",
    group: "appearance",
    description: "Animation cycle duration for ticker marquee",
  },

  // 4. Menu Builder
  {
    key: "site_navigation_menu",
    value: JSON.stringify([
      { label: "Home", url: "/" },
      { label: "Bed Room", url: "/category/bed-room" },
      { label: "Living Room", url: "/category/living-room" },
      { label: "Dining", url: "/category/dining" },
      { label: "Door", url: "/category/door" },
      { label: "Office", url: "/category/office" },
      { label: "Interior", url: "/interior" },
      { label: "Offers", url: "/offers" },
      { label: "Showrooms", url: "/showrooms" },
    ]),
    group: "navigation",
    description: "JSON array of top navigation bar menu links",
  },

  // 5. Home Page Sections
  {
    key: "home_page_sections",
    value: JSON.stringify({
      showHeroSlider: true,
      showQuickCategories: true,
      showNewArrivals: true,
      showBorderlessShowcase: true,
      showWinterSale: true,
      showAuthorityBlock: true,
      newArrivalsHeading: "New Arrivals & Signature Collections",
      featuredHeading: "Signature Kiln-Seasoned Teak & Mahogany",
    }),
    group: "appearance",
    description: "JSON toggles and headings for Homepage layout sections",
  },

  // 6. Services / Craftsmanship Pillars
  {
    key: "site_features_list",
    value: JSON.stringify([
      {
        icon: "ShieldCheck",
        title: "100% Kiln-Dried Seasoned Timber",
        description: "Harvested from certified sustainable forestry. Moisture-metered below 10% to prevent warping, cracking, and termite damage.",
      },
      {
        icon: "Sparkles",
        title: "5-Stage Italian PU Lacquer",
        description: "Automated spray booth finishing using imported Italian polyurethane lacquers. Heat resistant, UV protected, and silky satin touch.",
      },
      {
        icon: "Truck",
        title: "Nationwide Safe Delivery & Assembly",
        description: "White-glove dispatch team delivering to all 64 districts in Bangladesh with free carpenter installation in Dhaka city.",
      },
      {
        icon: "Award",
        title: "10-Year Timber Replacement Guarantee",
        description: "Every mastercrafted bed, sofa, dining table and almirah is sealed with our official 10-year timber replacement warranty certificate.",
      },
    ]),
    group: "appearance",
    description: "JSON array of craftsmanship service pillars displayed across storefront",
  },

  // 7. Visibility
  {
    key: "site_feature_visibility",
    value: JSON.stringify({
      enableWishlist: true,
      enableCompare: true,
      enableFloatingWhatsApp: true,
      enableEmiModal: true,
      enableCustomerReviews: true,
      enableCustomSizingModal: true,
      enableQuickView: true,
    }),
    group: "appearance",
    description: "JSON toggles controlling storefront widget and modal visibility",
  },

  // 8. Storage Settings
  {
    key: "storage_driver",
    value: "local",
    group: "storage",
    description: "Active storage driver: local or s3",
  },
  {
    key: "max_upload_size_mb",
    value: "15",
    group: "storage",
    description: "Maximum allowable image upload size in megabytes",
  },

  // 9. Social Login
  {
    key: "google_login_enabled",
    value: "false",
    group: "auth",
    description: "Toggle Google OAuth customer login on/off",
  },
  {
    key: "google_client_id",
    value: "",
    group: "auth",
    description: "Google OAuth 2.0 Web Client ID",
  },
  {
    key: "facebook_login_enabled",
    value: "false",
    group: "auth",
    description: "Toggle Facebook customer login on/off",
  },
  {
    key: "facebook_app_id",
    value: "",
    group: "auth",
    description: "Facebook Developer App ID",
  },

  // 10. Email Settings
  {
    key: "smtp_host",
    value: "smtp.gmail.com",
    group: "email",
    description: "Outgoing SMTP mail server hostname",
  },
  {
    key: "smtp_port",
    value: "587",
    group: "email",
    description: "SMTP mail server port (587 or 465)",
  },
  {
    key: "smtp_user",
    value: "info.kingletbd@gmail.com",
    group: "email",
    description: "SMTP account username / email",
  },
  {
    key: "smtp_from_name",
    value: "Kinglet Furniture & Interior",
    group: "email",
    description: "Sender display name on outgoing order confirmation emails",
  },
  {
    key: "smtp_encryption",
    value: "tls",
    group: "email",
    description: "SMTP encryption protocol (tls or ssl)",
  },

  // 11. SMS Settings
  {
    key: "sms_provider",
    value: "mim_sms",
    group: "sms",
    description: "Active Bangladeshi SMS gateway provider (mim_sms, greenweb, ssl_wireless)",
  },
  {
    key: "sms_sender_id",
    value: "KINGLET",
    group: "sms",
    description: "Approved Masking or Non-Masking Sender ID with BTRC",
  },
  {
    key: "sms_order_placed_template",
    value: "Dear {customer_name}, your Kinglet Furniture order {order_number} has been received. Track live: https://www.kingletbd.com/track-order?code={tracking_code}",
    group: "sms",
    description: "SMS template dispatched upon successful order checkout",
  },
  {
    key: "sms_dispatch_template",
    value: "Dear {customer_name}, order {order_number} is out for delivery via {courier_name}. Call hotline: +8801676900442",
    group: "sms",
    description: "SMS template dispatched upon shipment handover",
  },

  // 12. Announcement Modal / Toast
  {
    key: "announcement_enabled",
    value: "false",
    group: "marketing",
    description: "Toggle promotional modal popup on storefront entry",
  },
  {
    key: "announcement_title",
    value: "🎉 Exclusive Winter Bridal Furniture Packages",
    group: "marketing",
    description: "Title of the storefront promotional popup",
  },
  {
    key: "announcement_message",
    value: "Visit our Mirpur Flagship Experience Hub or order online to get instant flat 10% cash discount & 10-year replacement warranty on solid mahogany bedroom sets!",
    group: "marketing",
    description: "Announcement body text",
  },
  {
    key: "announcement_button_text",
    value: "Explore Bridal Offers →",
    group: "marketing",
    description: "Call to action button text on the announcement modal",
  },
  {
    key: "announcement_button_url",
    value: "/offers",
    group: "marketing",
    description: "Destination URL when announcement button is clicked",
  },

  // 13. Cookies Alert
  {
    key: "cookies_alert_enabled",
    value: "true",
    group: "appearance",
    description: "Toggle cookie consent notice on storefront",
  },
  {
    key: "cookies_alert_message",
    value: "We use essential cookies and kiln-seasoning telemetry to ensure you get the best handcrafted timber shopping experience.",
    group: "appearance",
    description: "Message displayed on cookie consent banner",
  },
  {
    key: "cookies_alert_button_text",
    value: "Accept & Continue",
    group: "appearance",
    description: "Acceptance button text",
  },

  // 14. Maintenance Mode
  {
    key: "maintenance_mode_enabled",
    value: "false",
    group: "system",
    description: "Toggle whole-site maintenance mode (admins can bypass)",
  },
  {
    key: "maintenance_message",
    value: "We are currently upgrading Kinglet's timber catalog and online showroom. We will be back online shortly. For urgent inquiries, call: +8801676900442.",
    group: "system",
    description: "Message shown to customers while maintenance mode is active",
  },
  {
    key: "maintenance_allow_admin",
    value: "true",
    group: "system",
    description: "Allow authenticated administrators to view site during maintenance",
  },

  // 15. Schema.org Settings
  {
    key: "schema_org_type",
    value: "FurnitureStore",
    group: "seo",
    description: "Schema.org entity type (FurnitureStore / LocalBusiness)",
  },
  {
    key: "schema_brand_name",
    value: "Kinglet Bangladesh Ltd",
    group: "seo",
    description: "Official entity name in Google Knowledge Graph",
  },
  {
    key: "schema_geo_latitude",
    value: "23.7915",
    group: "seo",
    description: "Mirpur showroom latitude coordinate",
  },
  {
    key: "schema_geo_longitude",
    value: "90.3734",
    group: "seo",
    description: "Mirpur showroom longitude coordinate",
  },
  {
    key: "schema_opening_hours",
    value: "Mo-Sa 09:00-22:00",
    group: "seo",
    description: "Showroom opening hours specification",
  },
  {
    key: "schema_rating_value",
    value: "4.9",
    group: "seo",
    description: "Aggregate rating value for rich snippets",
  },
  {
    key: "schema_review_count",
    value: "428",
    group: "seo",
    description: "Total review count for Google rich snippets",
  },

  // 16. Robots.txt
  {
    key: "custom_robots_txt",
    value: `# Kinglet Bangladesh Ltd - Production Robots.txt for Search Engine Crawlers
# Official Canonical Domain: https://www.kingletbd.com/

User-agent: *
Allow: /
Allow: /category/
Allow: /product/
Allow: /flash-sale
Allow: /offers
Allow: /interior
Allow: /showrooms
Allow: /warranty-care
Allow: /faq
Allow: /about-us
Allow: /privacy-policy
Allow: /warranty-terms
Allow: /exchange-return
Allow: /delivery
Allow: /care-maintenance
Allow: /contact

# Private User Sessions, Cart & Checkout (Disallow indexing)
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /cart
Disallow: /checkout
Disallow: /order-confirmation
Disallow: /order-confirmation/
Disallow: /account
Disallow: /login
Disallow: /register
Disallow: /track-order

# Internal parameter filters & search queries to avoid duplicate content
Disallow: /*?search=*
Disallow: /*&search=*

# XML Sitemap
Sitemap: https://www.kingletbd.com/sitemap.xml
`,
    group: "seo",
    description: "Live editable robots.txt directives for search engine web crawlers",
  },

  // 17. Language Settings
  {
    key: "default_language",
    value: "en",
    group: "localization",
    description: "Default storefront display language (en or bn)",
  },
  {
    key: "enable_bengali_transliteration",
    value: "true",
    group: "localization",
    description: "Display bilingual timber terminology across catalog and product specs",
  },

  // 18. Policy & Content Pages
  {
    key: "website_policy_pages",
    value: JSON.stringify([
      {
        id: "faq",
        slug: "faq",
        title: "Frequently Asked Questions (FAQ)",
        subtitle: "Find answers regarding Kinglet Furniture orders, policies, VAT, and services in Bangladesh.",
        path: "/faq",
        badge: "LIVE STOREFRONT",
        summary: "Order processes, VAT regulations, seasonal clearance discounts, and delivery FAQ.",
        content: "Great furniture, incredible offers! Experience the perfect combination of quality and savings at Kinglet. Special seasonal offers and bundled bridal sets are available online and in our Mirpur showroom.\n\nAll product prices of Kinglet Furniture are displayed excluding VAT as per Bangladesh Government regulations. The applicable government taxes are clearly specified during checkout and on your official invoice.\n\nWe offer door-delivery service throughout Dhaka and all 64 districts in Bangladesh. The customer is responsible for all associated transportation and labor charges.\n\nEvery piece is crafted from 100% seasoned solid timber with Italian PU finish and sealed with our 10-year timber guarantee.",
        metaTitle: "Frequently Asked Questions (FAQ) | Kinglet Furniture Bangladesh",
        metaDescription: "Answers to common questions about Kinglet seasoned mahogany furniture orders, delivery timeline, custom sizes, 0% EMI and 10-year timber warranty.",
      },
      {
        id: "about-us",
        slug: "about-us",
        title: "About Us",
        subtitle: "Kinglet Furniture & Interior Limited: Where Craftsmanship Meets Contemporary Living",
        path: "/about-us",
        badge: "LIVE STOREFRONT",
        summary: "Company heritage, skilled artisans, factory direct sales, and solid timber philosophy.",
        content: "Founded in 2019, Kinglet Furniture & Interior is a premier manufacturer and direct retailer of fine home and office furnishings. We blend innovative, contemporary design with uncompromising craftsmanship to create interiors that inspire. Our dedicated team of skilled designers constantly researches new trends and technologies, ensuring our collections are as forward-thinking as they are functional.\n\nQuality is the foundation of everything we make. In our advanced manufacturing facility, over 100 skilled artisans utilize cutting-edge technology and the finest raw materials to build every product to perfect standards. By controlling the entire process—from design and production to direct sales in our own showroom—we guarantee exceptional value without ever compromising on integrity.\n\nAbove all, we believe our customers are partners. We are committed to providing not just beautiful, lasting furniture, but also an unparalleled standard of service. Your vision is our inspiration, and your satisfaction is the true measure of our success.",
        metaTitle: "About Kinglet Bangladesh Ltd | Seasoned Mahogany & Luxury Furniture Heritage",
        metaDescription: "Learn about Kinglet Bangladesh Ltd, founded in 2019, crafting timeless kiln-seasoned Mahogany furniture with automated Italian PU finish.",
      },
      {
        id: "privacy-policy",
        slug: "privacy-policy",
        title: "Privacy Policy",
        subtitle: "Last Updated: 2026 • Kinglet Furniture and Interior",
        path: "/privacy-policy",
        badge: "LIVE STOREFRONT",
        summary: "Customer phone, address, and online payment transaction privacy standards in Bangladesh.",
        content: "Welcome to Kinglet Furniture and Interior. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you visit our website, visit our showrooms, or interact with our services in Bangladesh.\n\n1. Information We Collect: We collect information to provide you with a seamless experience and improve our services, including your name, phone number, email address, delivery address, and payment confirmation details.\n\n2. How We Use Your Information: We use the information we collect to process purchases, arrange delivery, installation, and manage returns or warranties; to respond to inquiries; and to protect our mutual transactions.\n\n3. How We Share Your Information: We value your trust and do not sell your personal data. We share details solely with licensed logistics partners for delivery.\n\n4. Data Security: We implement TLS encryption and secure database controls to safeguard your confidential customer profile.",
        metaTitle: "Privacy Policy | Kinglet Bangladesh Ltd",
        metaDescription: "Official privacy and data protection policy for Kinglet Bangladesh Ltd online shoppers and showroom visitors.",
      },
      {
        id: "warranty-terms",
        slug: "warranty-terms",
        title: "Warranty & Service Terms",
        subtitle: "Warranty Policy – Kinglet Furniture & Interior",
        path: "/warranty-terms",
        badge: "LIVE STOREFRONT",
        summary: "12-month service warranty, 5-year wood-louse guarantee, and replacement conditions.",
        content: "• 12-Month Service Warranty: Covers parts and labor for wood cracks and loose joints. It excludes damages resulting from misuse or normal wear and tear.\n\n• 5-Year Wood-Louse Guarantee: 5-year guarantee against wood-louse (ghun puka). Infested parts will be replaced free of charge.\n\n• Exclusions: No warranty or guarantee is applicable for glass, fabric, rexine, marble, termite, and other decorative accessories.\n\n• Customized Orders: All customized furniture orders are non-refundable.\n\n• Challan Inspection: Please inspect goods thoroughly upon delivery. Any problems must be noted in writing on the challan at that time. Subsequent claims will not be accepted.\n\n• Invoice Requirement: For availing warranty service, customers must present the original copy of the Invoice.",
        metaTitle: "Warranty & Service Terms | 10-Year Timber Guarantee | Kinglet Bangladesh Ltd",
        metaDescription: "Kinglet Furniture warranty terms: 12-month service warranty, 5-year wood-louse guarantee, and 10-year timber guarantee in Bangladesh.",
      },
      {
        id: "exchange-return",
        slug: "exchange-return",
        title: "Exchange and Return",
        subtitle: "Authentic guidelines for furniture exchange and refunds at Kinglet",
        path: "/exchange-return",
        badge: "LIVE STOREFRONT",
        summary: "3-day exchange with 5% service fee and 3-day return with 10% charge policy.",
        content: "• Exchange Policy: Furniture can be exchanged in good condition within 3 days with a 5% service charge. Note: It is not applicable for customized orders, set-broken products, or fabric products.\n\n• Return-Refund Policy: Furniture can be returned in good condition within 3 days and money can be refunded with a 10% service charge. Note: It is not applicable for customized orders, set-broken products, or fabric products.\n\n• Inspection Procedure: Items must be inspected upon delivery with our assembly carpenter. Written acknowledgement on the delivery challan is mandatory.",
        metaTitle: "Exchange and Return Policy | Kinglet Furniture Bangladesh",
        metaDescription: "Learn about Kinglet Furniture exchange and return guidelines: 3-day window, service charges, and customer satisfaction terms.",
      },
      {
        id: "delivery",
        slug: "delivery",
        title: "Delivery",
        subtitle: "Delivery Policy – Kinglet Furniture & Interior",
        path: "/delivery",
        badge: "LIVE STOREFRONT",
        summary: "White-glove delivery to all 64 districts, challan sign-off, and customer care.",
        content: "• Door-Delivery Service: We offer convenient door-delivery service across Bangladesh. The customer is responsible for all associated transportation and labor charges.\n\n• Inspection Upon Delivery: Please inspect all goods thoroughly upon delivery. Any problems, scratches, or issues must be noted in writing on the challan at that time. Subsequent claims will not be accepted.\n\n• Customer Handling Care: Customers are requested to carry and position products with due care once received from our delivery team to preserve joints and finishes.\n\n• Assembly: Complimentary carpenter assembly is provided within Dhaka metropolitan area.",
        metaTitle: "Delivery Policy & Nationwide Shipping | Kinglet Bangladesh Ltd",
        metaDescription: "Safe nationwide delivery of seasoned wooden furniture across all 64 districts in Bangladesh with free carpenter installation in Dhaka.",
      },
      {
        id: "care-maintenance",
        slug: "care-maintenance",
        title: "Care & Maintenance",
        subtitle: "Expert guidelines to preserve your solid wood and upholstery furniture",
        path: "/care-maintenance",
        badge: "LIVE STOREFRONT",
        summary: "Preserving Italian PU lacquer, ambient humidity control, and upholstery maintenance.",
        content: "• Solid Wood Care: To prevent staining, please wipe any spills immediately with a soft, dry cloth. For everyday care, simply dust with a soft, dry cloth. For cleaning, use a slightly damp cloth and then dry the surface immediately to prevent water spots.\n\n• Protect From Humidity & Heat: To ensure longevity, protect fine wood from extreme humidity and temperature. Solid wood tops may expand in summer and contract in winter, which is a normal and harmless natural process. Always use a protective pad under hot or damp items.\n\n• Solvents & Direct Sun: Avoid placing products containing solvents (nail polish remover, perfume, hairspray, glass cleaner) directly on wooden surfaces. Protect from continuous direct sunlight to prevent UV fading.\n\n• Moving Furniture: To protect your floors and the furniture joinery, please lift rather than drag when repositioning pieces.",
        metaTitle: "Care & Maintenance Guide | Seasoned Timber Longevity | Kinglet Furniture",
        metaDescription: "Practical guide to maintaining kiln-seasoned mahogany furniture, Italian PU lacquer luster, and fabric upholstery.",
      },
    ]),
    group: "cms",
    description: "Editable content and policy pages (FAQs, About Us, Privacy Policy, Warranty, Exchange & Return, Delivery, Care & Maintenance)",
  },
];

let defaultsEnsured = false;

export const settingsService = {
  /**
   * Ensure critical OMS & payment settings exist in WebsiteSetting without overwriting admin edits
   */
  async ensureDefaults() {
    if (defaultsEnsured) return;
    try {
      for (const def of DEFAULT_SYSTEM_SETTINGS) {
        await prisma.websiteSetting.upsert({
          where: { key: def.key },
          update: {},
          create: def,
        });
      }
      defaultsEnsured = true;
    } catch (err) {
      console.warn("[SettingsService] Could not ensure defaults:", err.message);
    }
  },

  /**
   * Fetch all settings as key -> value map
   */
  async getSettingsMap() {
    await this.ensureDefaults();
    const rows = await prisma.websiteSetting.findMany();
    const map = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return map;
  },

  /**
   * Read numeric setting safely with fallback
   */
  async getNumber(key, fallback) {
    await this.ensureDefaults();
    try {
      const row = await prisma.websiteSetting.findUnique({ where: { key } });
      if (!row) return fallback;
      const num = Number(row.value);
      return Number.isFinite(num) && num >= 0 ? num : fallback;
    } catch {
      return fallback;
    }
  },

  /**
   * Read configurable COD security advance amount in BDT
   */
  async getCodSecurityAdvanceBdt() {
    return this.getNumber("cod_security_advance_bdt", 5000);
  },

  /**
   * Read public payment instructions & gateway configuration
   */
  async getPaymentPublicConfig() {
    const map = await this.getSettingsMap();
    const codAdvanceBdt = Number(map.cod_security_advance_bdt);
    const hasLiveSsl =
      Boolean(process.env.SSLCOMMERZ_STORE_ID) &&
      process.env.SSLCOMMERZ_STORE_ID !== "test_kinglet_store" &&
      !process.env.SSLCOMMERZ_STORE_ID.startsWith("test_");

    return {
      codAdvanceBdt: Number.isFinite(codAdvanceBdt) && codAdvanceBdt >= 0 ? codAdvanceBdt : 5000,
      bkashMerchantNumber: map.bkash_merchant_number || "+8801676-900442",
      bankAccountDetails:
        map.bank_account_details ||
        "Kinglet Furniture & Interior • Dutch-Bangla Bank (Mirpur Br.) • A/C: 115.110.0048291",
      emiTenures: (map.emi_tenures_available || "3,6,9,12,18,24,30,36")
        .split(",")
        .map((n) => Number(n.trim()))
        .filter((n) => Number.isFinite(n) && n > 0),
      emiPlans: (() => {
        try {
          if (map.emi_rates_json) {
            const parsed = JSON.parse(map.emi_rates_json);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch {
          // fallback to standard schedule
        }
        return [
          { tenure: 3, label: "3 Months", rate: 6.00 },
          { tenure: 6, label: "6 Months", rate: 6.50 },
          { tenure: 9, label: "9 Months", rate: 6.95 },
          { tenure: 12, label: "12 Months", rate: 9.29 },
          { tenure: 18, label: "18 Months", rate: 12.99 },
          { tenure: 24, label: "24 Months", rate: 18.34 },
          { tenure: 30, label: "30 Months", rate: 19.76 },
          { tenure: 36, label: "36 Months", rate: 24.22 },
        ];
      })(),
      gatewayMode: hasLiveSsl ? "LIVE" : "SANDBOX",
      emiGatewayConfigured: hasLiveSsl,
    };
  },

  /**
   * Get dynamic EMI configuration and schedule
   */
  async getEmiConfig() {
    const config = await this.getPaymentPublicConfig();
    return {
      tenures: config.emiTenures,
      plans: config.emiPlans,
    };
  },

  /**
   * Calculate EMI breakdown on server side
   */
  async calculateEmi(amount, tenure = 12) {
    const { plans } = await this.getEmiConfig();
    const baseAmount = Math.max(0, Number(amount) || 0);
    const tenureNum = Number(tenure) || 12;

    const plan = plans.find((p) => p.tenure === tenureNum) || {
      tenure: tenureNum,
      rate: 9.29,
      label: `${tenureNum} Months`,
    };

    const rate = Number(plan.rate) || 0;
    const bankCharge = Math.round(baseAmount * (rate / 100));
    const totalPayable = baseAmount + bankCharge;
    const monthlyInstallment = tenureNum > 0 ? Math.round(totalPayable / tenureNum) : totalPayable;

    return {
      tenure: tenureNum,
      rate,
      baseAmount,
      bankCharge,
      totalPayable,
      monthlyInstallment,
      label: plan.label || `${tenureNum} Months`,
    };
  },

  /**
   * Update EMI plans in database
   */
  async updateEmiSettings({ tenures, plans }) {
    const tenuresStr = Array.isArray(tenures)
      ? tenures.join(",")
      : typeof tenures === "string"
      ? tenures
      : "3,6,9,12,18,24,30,36";

    const plansJson = Array.isArray(plans)
      ? JSON.stringify(plans)
      : typeof plans === "string"
      ? plans
      : JSON.stringify([]);

    await Promise.all([
      prisma.websiteSetting.upsert({
        where: { key: "emi_tenures_available" },
        update: { value: tenuresStr },
        create: {
          key: "emi_tenures_available",
          value: tenuresStr,
          group: "payment",
          description: "Comma-separated Bank EMI installment tenures in months",
        },
      }),
      prisma.websiteSetting.upsert({
        where: { key: "emi_rates_json" },
        update: { value: plansJson },
        create: {
          key: "emi_rates_json",
          value: plansJson,
          group: "payment",
          description: "Official Bank EMI interest rates per tenure",
        },
      }),
    ]);

    cache.flush();
    return this.getEmiConfig();
  },

  /**
   * Get contact hotline and WhatsApp numbers
   */
  async getContactConfig() {
    await this.ensureDefaults();
    const settings = await prisma.websiteSetting.findMany({
      where: {
        key: {
          in: ["primary_phone", "whatsapp_number", "footer_phone", "primary_email", "showroom_address"],
        },
      },
    });

    const map = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });

    return {
      primary_phone: map.primary_phone || "+8801676900442",
      whatsapp_number: map.whatsapp_number || "+880 1898-878815",
      footer_phone: map.footer_phone || map.primary_phone || "+8801676900442",
      primary_email: map.primary_email || "info.kingletbd@gmail.com",
      showroom_address: map.showroom_address || "752/2, West Shewrapara, Begum Rokeya Sarani, Mirpur, Dhaka-1216",
    };
  },

  /**
   * Update contact hotline and WhatsApp numbers
   */
  async updateContactSettings({ primary_phone, whatsapp_number, footer_phone }) {
    const updates = [];
    if (primary_phone !== undefined) {
      updates.push(
        prisma.websiteSetting.upsert({
          where: { key: "primary_phone" },
          update: { value: String(primary_phone).trim() },
          create: {
            key: "primary_phone",
            value: String(primary_phone).trim(),
            group: "general",
            description: "Official 24/7 hotline telephone number",
          },
        })
      );
    }

    if (whatsapp_number !== undefined) {
      updates.push(
        prisma.websiteSetting.upsert({
          where: { key: "whatsapp_number" },
          update: { value: String(whatsapp_number).trim() },
          create: {
            key: "whatsapp_number",
            value: String(whatsapp_number).trim(),
            group: "general",
            description: "Official WhatsApp concierge number",
          },
        })
      );
    }

    if (footer_phone !== undefined) {
      updates.push(
        prisma.websiteSetting.upsert({
          where: { key: "footer_phone" },
          update: { value: String(footer_phone).trim() },
          create: {
            key: "footer_phone",
            value: String(footer_phone).trim(),
            group: "footer",
            description: "Footer display phone numbers",
          },
        })
      );
    }

    await Promise.all(updates);
    cache.flush();
    return this.getContactConfig();
  },
};
