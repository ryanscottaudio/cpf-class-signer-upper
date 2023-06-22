import { Page } from "playwright-core";
import { logMessage } from "./log-message";

export const logIn = async (
  page: Page,
  emailAddress: string,
  password: string
) => {
  await page.goto("https://mymembership.chelseapiers.com/login");
  await page.type("#email", emailAddress);
  await page.type("#password", password);
  await page.click("button[type='submit']");

  try {
    await page.waitForURL("https://mymembership.chelseapiers.com/", {
      timeout: 2000,
    });
  } catch (error) {
    logMessage(
      `CPF account for ${emailAddress} could not be accessed; please check login credentials.`
    );
    throw error;
  }
};
