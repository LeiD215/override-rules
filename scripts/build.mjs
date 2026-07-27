import * as esbuild from "esbuild";
import * as fs from "node:fs";

const mainCode = fs.readFileSync("src/main.ts", "utf8");
const bannerMatch = mainCode.match(/\/\*![\s\S]*?\*\//);
const bannerText = bannerMatch ? bannerMatch[0] : "";

// 版本号 3 层 fallback：
//   1. 环境变量 OVERRIDE_RULES_VERSION（GitHub Actions release.yaml 显式注入，从 git tag 切出来）
//   2. package.json 的 version 字段（本地 dev / 手动 build）
//   3. 兜底 "unknown"（任何环节异常都不会编造假数字）
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version =
    process.env.OVERRIDE_RULES_VERSION ||
    pkg.version ||
    "unknown";

// schema 版本号：未来 override-rules 配置格式有 breaking change 时递增
// 当前 = 1
const schemaVersion = "1";

const commonOptions = {
    entryPoints: ["src/main.ts"],
    bundle: true,
    platform: "neutral",
    format: "iife",
    target: "ES2025",
    legalComments: "none",
    charset: "utf8",
    banner: { js: bannerText },
    // esbuild define 会在编译期把所有引用替换为字面值
    // main.ts 里用 declare const __OVERRIDE_RULES_VERSION__: string; 占位
    define: {
        __OVERRIDE_RULES_VERSION__: JSON.stringify(version),
        __OVERRIDE_RULES_SCHEMA__: JSON.stringify(schemaVersion),
    },
};

Promise.all([
    esbuild.build({ ...commonOptions, outfile: "convert.js" }),
    esbuild.build({
        ...commonOptions,
        minify: true,
        outfile: "convert.min.js",
        drop: ["debugger"],
    }),
]).catch((err) => {
    console.error(err);
    process.exit(1);
});