import fs from "fs";
import readline from "readline";

async function searchDimensions() {
  const fileStream = fs.createReadStream("c:/Users/DK/Downloads/database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNo = 0;
  const matches = [];

  for await (const line of rl) {
    lineNo++;
    const lower = line.toLowerCase();
    if (
      lower.includes("dimension") ||
      lower.includes("width") ||
      lower.includes("height") ||
      lower.includes("length") ||
      lower.includes("inch") ||
      lower.includes("ফিট") ||
      lower.includes("ইঞ্চি") ||
      lower.includes("king size") ||
      lower.includes("queen size")
    ) {
      if (line.startsWith("INSERT INTO ")) {
        const tableMatch = line.match(/INSERT INTO [`"]?(\w+)[`"]?/);
        const tbl = tableMatch ? tableMatch[1] : "unknown";
        matches.push({ lineNo, tbl, sample: line.slice(0, 200) });
      }
    }
  }

  console.log(`Found ${matches.length} matching lines across tables:`);
  const tblCount = {};
  matches.forEach(m => {
    tblCount[m.tbl] = (tblCount[m.tbl] || 0) + 1;
  });
  console.log("Matches per table:", tblCount);

  console.log("\nSample matches by table:");
  const shown = {};
  for (const m of matches) {
    if (!shown[m.tbl] || shown[m.tbl] < 3) {
      console.log(`[Table: ${m.tbl} line ${m.lineNo}]: ${m.sample}`);
      shown[m.tbl] = (shown[m.tbl] || 0) + 1;
    }
  }
}

searchDimensions();

