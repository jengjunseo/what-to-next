import { build } from "esbuild";

const options = {
  bundle: true,
  minify: true,
  target: "es2022",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
};
const { outputFiles } = await build({
  ...options,
  entryPoints: ["sites/client.tsx"],
  loader: { ".woff2": "dataurl" },
  outdir: "dist/client",
  write: false,
  platform: "browser",
  format: "esm",
});
const js = outputFiles.find((file) => file.path.endsWith(".js"));
const css = outputFiles.find((file) => file.path.endsWith(".css"));
if (!js || !css) throw new Error("Missing Sites client bundle");

await build({
  ...options,
  entryPoints: ["sites/worker.ts"],
  outfile: "dist/server/index.js",
  platform: "browser",
  format: "esm",
  define: {
    ...options.define,
    CLIENT_JS: JSON.stringify(js.text),
    CLIENT_CSS: JSON.stringify(css.text),
  },
});
console.log("Built dist/server/index.js");
