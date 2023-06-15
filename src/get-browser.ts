import { Browser, chromium as playwright } from "playwright-core";
import chromium from "@sparticuz/chromium";

export const getBrowser = async (isLocal: boolean): Promise<Browser> =>
  playwright.launch({
    args: isLocal ? undefined : chromium.args,
    executablePath: isLocal ? undefined : await chromium.executablePath(),
    headless: true,
  });
