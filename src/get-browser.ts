import { chromium as playwright } from "playwright-core";
import chromium from "@sparticuz/chromium";

const isLocal = !!process.env.IS_LOCAL;

export const getBrowser = async () =>
  await playwright.launch({
    args: isLocal ? undefined : chromium.args,
    executablePath: isLocal ? undefined : await chromium.executablePath(),
    headless: true,
  });
