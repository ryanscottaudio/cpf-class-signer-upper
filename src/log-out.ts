import { BrowserContext } from "playwright-core";
import { LOGIN_URL, MAIN_URL } from "./constants";

export const logOut = async (browserContext: BrowserContext) => {
  const page = await browserContext.newPage();
  await page.goto(MAIN_URL);
  await page.click('button[data-cy="header-profile-menu-button"]');
  await page.click('a[data-cy="logout-button"]');
  await page.waitForURL(LOGIN_URL);
};
