const fs = require("node:fs");
const path = require("node:path");

const artifacts = {
  tabletop: "Paths_of_Glory_1914_Tabletop_Pilot.html",
  digital: "Paths_of_Glory_1914_Solo_v1_7_Playtest.html"
};

function buildHtml(mode) {
  if (!Object.hasOwn(artifacts, mode)) throw new Error("Use tabletop or digital.");
  const folder = path.join(__dirname, "source", mode);
  const read = name => fs.readFileSync(path.join(folder, name), "utf8");
  const scripts = mode === "tabletop" ? ["resources.js", "planner.js", "ui.js"] : ["app.js"];
  return read("shell.html")
    .replace("/* @STYLE@ */", () => read("style.css"))
    .replace("/* @SCRIPTS@ */", () => scripts.map(read).join(""));
}

if (require.main === module) {
  const mode = process.argv[2] ?? "tabletop";
  const html = buildHtml(mode);
  const output = path.resolve(process.argv[3] ?? path.join(__dirname, "apps", artifacts[mode]));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, html);
  console.log(output);
}

module.exports = { artifacts, buildHtml };
