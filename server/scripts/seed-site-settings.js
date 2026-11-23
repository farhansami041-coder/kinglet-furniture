import prisma from "../src/db/prisma.js";

const settingsToSeed = [
  // 1. Basic Information
  { key: "title", value: "Kinglet Bangladesh Ltd", group: "basic" },
  { key: "home_page_title", value: "Leading Furniture Store in Bangladesh", group: "basic" },
  { key: "site_tagline", value: "10-Year Timber Guarantee • 100% Kiln-Seasoned Chittagong Mahogany & Oak Veneer", group: "basic" },
  { key: "primary_color", value: "#EC2226", group: "basic" },
  { key: "currency_symbol", value: "৳", group: "basic" },
  { key: "currency_direction", value: "0", group: "basic" },
  { key: "decimal_separator", value: ".", group: "basic" },
  { key: "thousand_separator", value: ",", group: "basic" },
  { key: "copy_right", value: "Designed and Developed by Ridgeben IT Solutions Ltd. Copyright©2026, All Rights Reserved.", group: "basic" },

  // 2. Media
  { key: "logo", value: "https://www.kingletbd.com/storage/images/OM_1760884761NzeZb9h8.png", group: "media" },
  { key: "favicon", value: "https://www.kingletbd.com/storage/images/OM_17608847525DnZPuIu.png", group: "media" },
  { key: "loader", value: "https://www.kingletbd.com/storage/images/OM_1761223679xWum3x0L.jpeg", group: "media" },
  { key: "is_loader", value: "0", group: "media" },
  { key: "feature_image", value: "1600622296topic.jpg", group: "media" },

  // 3. Seo
  { key: "meta_keywords", value: "Kinglet,Kinglet Bangladesh,Kinglet Furniture,Best Furniture Showroom in BD,Home Furniture,Office furniture", group: "seo" },
  { key: "meta_description", value: "Kinglet Bangladesh ltd is no. 1 home furniture showroom in Bangladesh", group: "seo" },
  { key: "meta_image", value: "OM_1753368121t7dN8oFl.jpg", group: "seo" },
  { key: "google_search_console_tag", value: "", group: "seo" },

  // 4. Custom CSS
  { key: "custom_css", value: "", group: "css" },

  // 5. Scripts
  { key: "google_analytics_id", value: "UA-106757798-1", group: "scripts" },
  { key: "facebook_pixel", value: "", group: "scripts" },
  { key: "google_adsense", value: "", group: "scripts" },
  { key: "custom_header_script", value: "", group: "scripts" },
  { key: "custom_footer_script", value: "", group: "scripts" },

  // 6. Shop & Checkout Page
  { key: "min_price", value: "0", group: "shop" },
  { key: "max_price", value: "200000", group: "shop" },
  { key: "is_guest_checkout", value: "1", group: "shop" },
  { key: "is_single_checkout", value: "1", group: "shop" },

  // 7. Footer & Contact Page - Basic
  { key: "footer_address", value: "752/2, West Shewrapara, Begum Rokeya Sarani, Mirpur, Dhaka 1216", group: "footer" },
  { key: "footer_phone", value: "+880 1898-878815, +880 1898-878816, 01676900442", group: "footer" },
  { key: "footer_email", value: "info.kingletbd@gmail.com", group: "footer" },
  { key: "footer_gateway_img", value: "https://www.kingletbd.com/storage/images/OM_1760886037KTtGSCGp.png", group: "footer" },

  // Footer & Contact Page - Social Links
  { key: "facebook_url", value: "https://www.facebook.com/kingletbd", group: "social" },
  { key: "youtube_url", value: "https://www.youtube.com/@kingletbd", group: "social" },
  { key: "instagram_url", value: "https://www.instagram.com/kingletbd", group: "social" },
  { key: "whatsapp_number", value: "+880 1898-878815", group: "social" },
  { key: "twitter_url", value: "https://twitter.com/kingletbd", group: "social" },
  { key: "linkedin_url", value: "https://www.linkedin.com/company/kingletbd", group: "social" },
  { key: "tiktok_url", value: "https://www.tiktok.com/@kingletbd", group: "social" },

  // Footer & Contact Page - Working Days
  { key: "working_days_from_to", value: "Everyday except Sunday", group: "working_days" },
  { key: "friday_start", value: "9:00 AM", group: "working_days" },
  { key: "friday_end", value: "10:00 PM", group: "working_days" },
  { key: "satureday_start", value: "10:00 AM", group: "working_days" },
  { key: "satureday_end", value: "08:00 PM", group: "working_days" },
];

async function seed() {
  console.log("Seeding authentic settings into WebsiteSetting table...");
  for (const s of settingsToSeed) {
    await prisma.websiteSetting.upsert({
      where: { key: s.key },
      update: {}, // do not overwrite if user has already modified it
      create: {
        key: s.key,
        value: s.value,
        group: s.group,
      },
    });
  }
  console.log("Successfully seeded settings!");
  await prisma.$disconnect();
}

seed().catch(console.error);

