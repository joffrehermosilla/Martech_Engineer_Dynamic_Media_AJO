import fs from "fs";

const html = fs.readFileSync("damajo/Martech_Engineer_Dynamic_Media_AJO/agent-hub/public/index.html", "utf8");
const lines = html.split("\n");

console.log("--- Header CSS lines 340-370 ---");
console.log(lines.slice(340, 370).join("\n"));

console.log("--- Nav lines around places ---");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('data-tab="places"')) {
    console.log(lines.slice(i - 4, i + 6).join("\n"));
    break;
  }
}

