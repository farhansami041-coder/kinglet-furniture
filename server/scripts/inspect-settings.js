import fs from "fs";
import readline from "readline";

async function inspectSettings() {
  const fileStream = fs.createReadStream("c:\\Users\\DK\\Downloads\\database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.startsWith("INSERT INTO settings ") || line.startsWith("INSERT INTO extra_settings ")) {
      console.log("SETTINGS ROW:\n", line.slice(0, 1000));
    }
  }
}

inspectSettings().catch(console.error);

