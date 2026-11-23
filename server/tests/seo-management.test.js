import assert from "assert";

const API_BASE = "http://localhost:5000";

async function runSeoTests() {
  console.log("🧪 Starting Comprehensive SEO Management & Technical SEO Test Suite...\n");

  // -------------------------------------------------------------
  // 1. Admin Authentication
  // -------------------------------------------------------------
  const loginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+8801676900442", password: "KingletAdmin@2026" }),
  });
  const loginJson = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, "Admin login must succeed");
  const token = loginJson.data.token;
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  console.log("✅ 1. Admin Authentication verified");

  // -------------------------------------------------------------
  // 2. Dynamic XML Sitemap Validation
  // -------------------------------------------------------------
  const sitemapRes = await fetch(`${API_BASE}/sitemap.xml`);
  assert.strictEqual(sitemapRes.status, 200, "Sitemap must return 200 OK");
  const contentType = sitemapRes.headers.get("content-type") || "";
  assert(contentType.includes("xml"), "Sitemap must have XML content-type");

  const sitemapXml = await sitemapRes.text();
  assert(sitemapXml.includes("<urlset"), "Sitemap must have <urlset> root element");
  assert(sitemapXml.includes("xmlns:image="), "Sitemap must include Google Image XML namespace");
  assert(sitemapXml.includes("https://www.kingletbd.com/"), "Must contain root canonical URL");
  assert(sitemapXml.includes("<image:image>"), "Must contain Google Image tags for products");

  // Verify private disallowed paths are strictly absent
  assert(!sitemapXml.includes("<loc>https://www.kingletbd.com/cart</loc>"), "Private /cart must NEVER be in sitemap");
  assert(!sitemapXml.includes("<loc>https://www.kingletbd.com/checkout</loc>"), "Private /checkout must NEVER be in sitemap");
  assert(!sitemapXml.includes("<loc>https://www.kingletbd.com/admin"), "Private /admin must NEVER be in sitemap");
  console.log(`✅ 2. Valid XML Sitemap verified (${sitemapXml.length} bytes, image schema active, private paths excluded)`);

  // -------------------------------------------------------------
  // 3. Google Merchant Center Product Feed (RSS 2.0 / XML)
  // -------------------------------------------------------------
  const feedRes = await fetch(`${API_BASE}/api/v1/seo/google-merchant-feed.xml`);
  assert.strictEqual(feedRes.status, 200, "Merchant feed must return 200 OK");
  const feedXml = await feedRes.text();
  assert(feedXml.includes("<rss version=\"2.0\""), "Must have RSS 2.0 root");
  assert(feedXml.includes("xmlns:g=\"http://base.google.com/ns/1.0\""), "Must declare Google Base namespace");
  assert(feedXml.includes("<g:id>"), "Must contain <g:id> SKU tags");
  assert(feedXml.includes("<g:price>"), "Must contain <g:price> tags");
  assert(feedXml.includes("BDT</g:price>"), "Must format currency as BDT");
  assert(feedXml.includes("<g:brand>Kinglet Furniture</g:brand>"), "Must declare official brand");
  console.log(`✅ 3. Google Merchant Center Feed verified (${feedXml.length} bytes, BDT pricing, Google Base valid)`);

  // -------------------------------------------------------------
  // 4. Custom SEO Metadata Upsert & Public Retrieval
  // -------------------------------------------------------------
  const prodsRes = await fetch(`${API_BASE}/api/v1/products?limit=1`);
  const prodsJson = await prodsRes.json();
  const testProduct = prodsJson.data[0];
  assert(testProduct, "Must have test product");

  const customTitle = `Handcrafted ${testProduct.name} | Kinglet Luxury Collection BD`;
  const customDesc = `Official ${testProduct.name} made with seasoned timber and Italian PU lacquer. 10-Year anti-borer warranty. Order online with free home assembly in Dhaka.`;
  const customCanonical = `https://www.kingletbd.com/product/${testProduct.slug}`;

  const saveSeoRes = await fetch(`${API_BASE}/api/v1/admin/seo/metadata`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      productId: testProduct.id,
      title: customTitle,
      metaDescription: customDesc,
      canonicalUrl: customCanonical,
      ogTitle: customTitle,
      ogDescription: customDesc,
      isNoIndex: false,
    }),
  });
  const saveSeoJson = await saveSeoRes.json();
  assert.strictEqual(saveSeoRes.status, 200, "Saving SEO metadata must succeed");
  assert.strictEqual(saveSeoJson.data.title, customTitle);

  // Retrieve via public metadata endpoint
  const getSeoRes = await fetch(`${API_BASE}/api/v1/seo/metadata?productId=${testProduct.id}`);
  const getSeoJson = await getSeoRes.json();
  assert.strictEqual(getSeoRes.status, 200);
  assert.strictEqual(getSeoJson.data.title, customTitle);
  assert.strictEqual(getSeoJson.data.metaDescription, customDesc);
  console.log(`✅ 4. Custom SEO Metadata upsert and public query verified for "${testProduct.name}"`);

  // -------------------------------------------------------------
  // 5. Safe 301 URL Redirection & HTTP Header Verification
  // -------------------------------------------------------------
  const oldTestPath = `/old-vintage-furniture-bed-${Date.now()}`;
  const targetPath = `/product/${testProduct.slug}`;

  // Create 301 rule
  const createRedirRes = await fetch(`${API_BASE}/api/v1/admin/seo/redirects`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      sourcePath: oldTestPath,
      targetPath: targetPath,
      statusCode: 301,
      notes: "Testing automated permanent 301 link preservation",
    }),
  });
  const createRedirJson = await createRedirRes.json();
  assert.strictEqual(createRedirRes.status, 200);
  const redirectRule = createRedirJson.data;
  assert.strictEqual(redirectRule.sourcePath, oldTestPath);
  assert.strictEqual(redirectRule.targetPath, targetPath);

  // Test public resolver endpoint
  const resolveRes = await fetch(`${API_BASE}/api/v1/seo/redirects/resolve?path=${encodeURIComponent(oldTestPath)}`);
  const resolveJson = await resolveRes.json();
  assert.strictEqual(resolveRes.status, 200);
  assert.strictEqual(resolveJson.data.hasRedirect, true);
  assert.strictEqual(resolveJson.data.targetPath, targetPath);
  assert.strictEqual(resolveJson.data.statusCode, 301);
  console.log(`✅ 5A. 301 Redirect resolver verified: ${oldTestPath} -> ${targetPath}`);

  // Test server-level HTTP 301 response
  const httpRedirectRes = await fetch(`${API_BASE}${oldTestPath}`, { redirect: "manual" });
  assert.strictEqual(httpRedirectRes.status, 301, `Server must issue HTTP 301, got ${httpRedirectRes.status}`);
  const locationHeader = httpRedirectRes.headers.get("location");
  assert.strictEqual(locationHeader, targetPath, `Location header must point to ${targetPath}`);
  console.log(`✅ 5B. Server-level HTTP 301 Permanent Redirect confirmed with Location header`);

  // Clean up test redirect
  const deleteRedirRes = await fetch(`${API_BASE}/api/v1/admin/seo/redirects/${redirectRule.id}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  assert.strictEqual(deleteRedirRes.status, 200);
  console.log(`✅ 5C. Test 301 redirect safely cleaned up`);

  // -------------------------------------------------------------
  // 6. Admin SEO Matrix Overview
  // -------------------------------------------------------------
  const matrixRes = await fetch(`${API_BASE}/api/v1/admin/seo/matrix`, { headers: authHeaders });
  const matrixJson = await matrixRes.json();
  assert.strictEqual(matrixRes.status, 200);
  assert(matrixJson.data.summary.totalIndexableUrls > 0, "Indexable URLs must be counted");
  assert(matrixJson.data.products.length > 0, "Products matrix must contain items");
  assert(matrixJson.data.categories.length > 0, "Categories matrix must contain items");
  console.log(`✅ 6. Admin SEO Matrix verified (${matrixJson.data.summary.totalIndexableUrls} indexable URLs across platform)`);

  console.log("\n🎉 ALL 6 SEO & TECHNICAL SEARCH ENGINE TESTS PASSED WITH 100% SUCCESS!\n");
}

runSeoTests().catch((err) => {
  console.error("\n❌ SEO Test Suite Failed:", err);
  process.exit(1);
});
