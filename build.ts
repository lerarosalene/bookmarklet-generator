import path from "node:path";
import fs from "node:fs";
import esbuild from "esbuild";
import pug from "pug";
import * as sass from "sass";

const fsp = fs.promises;

async function main() {
  await fsp.mkdir("dist", { recursive: true });

  const template = await fsp.readFile(path.join("src", "index.pug"), "utf-8");
  const html = pug.render(template);
  await fsp.writeFile(path.join("dist", "index.html"), html);

  const cssResult = sass.compile(path.join("src", "index.sass"), {
    style: "compressed",
  });
  await fsp.writeFile(path.join("dist", "index.css"), cssResult.css);

  await esbuild.build({
    entryPoints: [path.join("src", "index.ts")],
    bundle: true,
    minify: true,
    outfile: path.join("dist", "index.js"),
  });

  await fsp.copyFile(
    require.resolve("esbuild-wasm/esbuild.wasm"),
    path.join("dist", "esbuild.wasm"),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
