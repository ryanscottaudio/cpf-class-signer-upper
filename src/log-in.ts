import { BrowserContext } from "playwright-core";
import { logMessage } from "./log-message";
import { LOGIN_URL, MAIN_URL } from "./constants";

export const logIn = async (
  browserContext: BrowserContext,
  emailAddress: string,
  password: string
) => {
  const page = await browserContext.newPage();
  await page.goto(LOGIN_URL);
  await page.type("#email", emailAddress);
  await page.type("#password", password);
  await page.click("button[type='submit']");

  try {
    await page.waitForURL(MAIN_URL, {
      timeout: 2000,
    });
  } catch (error) {
    logMessage(
      `CPF account for ${emailAddress} could not be accessed; please check login credentials.`
    );
    throw error;
  }
};
