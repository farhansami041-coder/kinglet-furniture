import fs from "fs";
import readline from "readline";

async function testAccumulator() {
  const fileStream = fs.createReadStream("c:\\Users\\DK\\Downloads\\database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let inItems = false;
  let currentStatement = "";
  const allItemStatements = [];

  for await (const line of rl) {
    if (line.startsWith("INSERT INTO items ") || line.startsWith("INSERT INTO `items` ")) {
      inItems = true;
      currentStatement = line;
    } else if (inItems) {
      currentStatement += "\n" + line;
    }

    if (inItems && line.trim().endsWith(";")) {
      allItemStatements.push(currentStatement);
      inItems = false;
      currentStatement = "";
    }
  }

  console.log(`Accumulated complete multi-line Item statements: ${allItemStatements.length}/98`);
}

testAccumulator().catch(console.error);

