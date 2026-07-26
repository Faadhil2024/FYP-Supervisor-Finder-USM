// temporary inspection script
import fs from "node:fs/promises";

const data = JSON.parse(
  await fs.readFile("docs/data-collection/publications-projects-raw.json", "utf-8")
);
console.log(JSON.stringify(data["chew-xinying"], null, 2));
