import fs from "fs";
import readline from "readline";

async function checkItemPhotos() {
  const fileStream = fs.createReadStream("c:\\Users\\DK\\Downloads\\database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const photos = [];
  for await (const line of rl) {
    if (line.startsWith("INSERT INTO items ")) {
      // Find photo column
      // photo is 17th column
      const match = line.match(/VALUES \(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(",").map(p => p.trim().replace(/^'|'$/g, ""));
        // let's print parts around index 15-20
        const photo = parts[16];
        if (photo) photos.push({ id: parts[0], name: parts[6], photo });
      }
      if (photos.length >= 5) break;
    }
  }

  console.log("Sample Item Photos:", photos);
  for (const p of photos) {
    const urls = [
      `https://kingletbd.com/assets/images/${p.photo}`,
      `https://kingletbd.com/assets/images/items/${p.photo}`,
      `https://kingletbd.com/assets/images/products/${p.photo}`,
    ];
    for (const u of urls) {
      try {
        const res = await fetch(u, { method: "HEAD" });
        console.log(`URL ${u} -> status: ${res.status}`);
        if (res.status === 200) break;
      } catch (err) {
        console.log(`URL ${u} -> error: ${err.message}`);
      }
    }
  }
}

checkItemPhotos().catch(console.error);

