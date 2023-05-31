import { GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { logIn } from "./log-in";
import { Browser } from "playwright-core";
import { processRow } from "./process-row";
import { logOut } from "./log-out";
import { logMessage } from "./log-message";

export const processSheet =
  (browser: Browser) => async (sheet: GoogleSpreadsheetWorksheet) => {
    const [emailAddress, password] = sheet.title.split(" ");

    if (!emailAddress || !password) {
      throw `Auth credentials are not present for ${emailAddress}`;
    }

    const rows = await sheet.getRows();
    const rowsToSignUpFor = rows.filter((row) => !row["Signed up?"]);
    if (rowsToSignUpFor.length === 0) {
      logMessage(`No class sign-up requests were found for ${emailAddress}`);
      return;
    }

    const browserContext = await browser.newContext();
    const loginPage = await browserContext.newPage();
    await logIn(loginPage, emailAddress, password);

    const boundProcessRow = processRow(emailAddress, browserContext);

    await Promise.allSettled(rowsToSignUpFor.map(boundProcessRow));

    await logOut(loginPage);
  };
