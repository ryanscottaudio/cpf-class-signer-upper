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

  const isLoginSuccessful = await Promise.race([
    (async () => {
      await page.waitForURL(MAIN_URL);
      return true;
    })(),
    (async () => {
      await page
        .locator("[data-cy=error-section]")
        .waitFor({ state: "visible" });
      return false;
    })(),
  ]);

  if (!isLoginSuccessful) {
    throw new Error(
      `CPF account for ${emailAddress} could not be accessed; please check login credentials.`
    );
  }
};
