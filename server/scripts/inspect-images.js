import fs from "fs";
import readline from "readline";

async function inspectImages() {
  const fileStream = fs.createReadStream("c:\\Users\\DK\\Downloads\\database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  for await (const line of rl) {
    if (line.startsWith("INSERT INTO items ")) {
      console.log("ITEM ROW SAMPLE:\n", line.slice(0, 500));
      count++;
      if (count > 3) break;
    }
  }
}

inspectImages().catch(console.error);

