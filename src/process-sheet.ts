import { GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { logIn } from "./log-in";
import { BrowserContext } from "playwright-core";
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

  await logIn(browserContext, emailAddress, password);

  await Promise.allSettled(
    rowsToSignUpFor.map(
      async (row) => await processRow(emailAddress, browserContext, row)
    )
  );

  await logOut(browserContext);
};
