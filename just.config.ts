import { BundleTaskParameters, bundleTask, cleanTask, coreLint, setupEnvironment, watchTask } from "@minecraft/core-build-tasks";
import fs from "fs";
import { argv, parallel, series, task, tscTask } from "just-scripts";
import path from "path";
import { buildMcpack } from "./tools/mcpack";

setupEnvironment(path.resolve(__dirname, ".env"));

const isProduction = argv()["production"];
const packName = "GenesisBP";
const sourcePack = path.resolve(__dirname, "behavior_packs", packName);
const bundleOut = path.resolve(__dirname, "dist", "scripts", "main.js");
const mcPack = path.resolve(__dirname, "mc", packName);

const bundleOptions: BundleTaskParameters = {
  entryPoint: path.resolve(__dirname, "scripts", "main.ts"),
  external: ["@minecraft/server", "@minecraft/server-ui"],
  outfile: bundleOut,
  minifyWhitespace: isProduction,
  sourcemap: !isProduction,
  outputSourcemapPath: path.resolve(__dirname, "dist", "debug"),
};

task("lint", coreLint(["scripts/**/*.ts"], argv().fix));
task("typescript", tscTask());
task("bundle", bundleTask(bundleOptions));
task("build", series("typescript", "bundle"));

task("clean", cleanTask([path.resolve(__dirname, "lib"), path.resolve(__dirname, "dist"), mcPack]));

task("assemble", () => {
  fs.rmSync(mcPack, { recursive: true, force: true });
  fs.mkdirSync(mcPack, { recursive: true });
  fs.cpSync(sourcePack, mcPack, { recursive: true });
  fs.mkdirSync(path.join(mcPack, "scripts"), { recursive: true });
  fs.copyFileSync(bundleOut, path.join(mcPack, "scripts", "main.js"));
  console.log("Assembled " + mcPack);
});

task("zip", () => buildMcpack(mcPack, path.resolve(__dirname, "dist", "packages", "GenesisAC.mcpack")));

task("deploy", () => {
  const targets = (process.env.DEPLOY_PATHS ?? "").split(";").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  if (targets.length === 0) throw new Error("Set DEPLOY_PATHS in .env to one or more com.mojang folders");

  for (const target of targets) {
    if (!fs.existsSync(target)) {
      console.log("Skipped missing target " + target);
      continue;
    }
    const destination = path.join(target, "development_behavior_packs", packName);
    fs.rmSync(destination, { recursive: true, force: true });
    fs.cpSync(mcPack, destination, { recursive: true });
    console.log("Deployed to " + destination);
  }
});

task("package", series("build", "assemble"));
task("mcpack", series("package", "zip"));
task("local-deploy", series("package", "deploy"));

task("watch", watchTask(["scripts/**/*.ts", "behavior_packs/**/*.{json,lang,png}"], series("build", "assemble", "deploy")));

task("all", parallel("lint", series("build", "assemble")));
