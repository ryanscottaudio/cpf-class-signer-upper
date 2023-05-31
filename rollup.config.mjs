import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

const EXTERNALS = ["@sparticuz/chromium"];

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "cjs",
  },
  plugins: [
    json(),
    nodeResolve({ resolveOnly: (module) => !EXTERNALS.includes(module) }),
    commonjs(),
    typescript(),
  ],
};
