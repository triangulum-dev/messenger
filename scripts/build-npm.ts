import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: [
    { name: ".", path: "./src/index.ts" },
  ],
  outDir: "./npm",
  shims: {},
  typeCheck: "both",
  test: false,
  compilerOptions: {
    lib: ["DOM", "ESNext"],

  },
  package: {
    name: "@triangulum/messenger",
    version: "1.0.0-alpha.1",
    public: true,
    description: "Communicate asynchronously between execution contexts.",
    scripts: {
      "publish": "npm publish --access public --tag next",
    },
    "peerDependencies": {
      "rxjs": "^7.8.0",
    },
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/triangulum-dev/messenger.git",
    },
    bugs: {
      url: "https://github.com/triangulum-dev/messenger/issues",
    },
  },
});
