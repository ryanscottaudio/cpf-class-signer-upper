import { GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { BrowserContext } from "playwright-core";
import { logIn } from "./log-in";
import { processRow } from "./process-row";
import { logOut } from "./log-out";
import { logMessage } from "./log-message";

export const processSheet = async (
  browserContext: BrowserContext,
  sheet: GoogleSpreadsheetWorksheet
) => {
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

  await logIn(emailAddress, password, browserContext);

  for (let i = 0; i < rowsToSignUpFor.length; i++) {
    const row = rowsToSignUpFor[i];
    await processRow(emailAddress, browserContext, row);
  }

  await logOut(browserContext);
};
