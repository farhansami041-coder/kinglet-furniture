import fs from "fs";
import path from "path";

const sourcePath = "c:\\Users\\DK\\Downloads\\database_backup_on_26-11-15 (1).sql";
const targetPath = path.resolve("server/scratch/cleaned_backup.sql");

fs.mkdirSync(path.dirname(targetPath), { recursive: true });

console.log("Reading source SQL dump...");
let content = fs.readFileSync(sourcePath, "utf8");

// Remove the CHECK constraints that fail on empty string in MySQL 8
content = content.replace(/,\s*CONSTRAINT `[^`]+` CHECK \(json_valid\([^)]+\)\)/g, "");
content = content.replace(/CONSTRAINT `[^`]+` CHECK \(json_valid\([^)]+\)\),?/g, "");

// Wrap with FOREIGN_KEY_CHECKS=0
const cleaned = `
SET NAMES utf8mb4;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

${content}

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;
`;

fs.writeFileSync(targetPath, cleaned, "utf8");
console.log(`Cleaned SQL written to ${targetPath} (${(cleaned.length / 1024 / 1024).toFixed(2)} MB)`);

