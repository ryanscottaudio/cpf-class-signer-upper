import { Page } from "playwright-core";

export const logOut = async (page: Page) => {
  await page.click('button[data-cy="header-profile-menu-button"]');
  await page.click('a[data-cy="logout-button"]');
  await page.waitForURL("https://mymembership.chelseapiers.com/login");
};
