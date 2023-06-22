import { BrowserContext } from "playwright-core";

export const logOut = async (browserContext: BrowserContext) => {
  const page = await browserContext.newPage();
  await page.goto("https://mymembership.chelseapiers.com/");
  await page.click('button[data-cy="header-profile-menu-button"]');
  await page.click('a[data-cy="logout-button"]');
  await page.waitForURL("https://mymembership.chelseapiers.com/login");
};
