import { GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { BrowserContext } from "playwright-core";
import { logIn } from "./log-in";
import { processRow } from "./process-row";
import { logOut } from "./log-out";
import { logMessage } from "./log-message";
import { Row } from "./types";
import { SIGNUPS_IN_PROGRESS_IDENTIFIER } from "./constants";

type SheetInfo = {
  emailAddress: string;
  password: string;
  isUpdateInProgress: boolean;
};

const getSheetInfoFromSheetTitle = (title: string): SheetInfo => {
  const [emailAddress, password, updateInProgressIdentifier] = title.split(" ");
  return {
    emailAddress,
    password,
    isUpdateInProgress: !!updateInProgressIdentifier,
  };
};

const createSheetTitleFromSheetInfo = (
  emailAddress: string,
  password: string,
  isProcessingSheet: boolean
): string =>
  [
    emailAddress,
    password,
    isProcessingSheet ? SIGNUPS_IN_PROGRESS_IDENTIFIER : undefined,
  ]
    .filter((s) => s)
    .join(" ");

const startProcessingSheet = async (
  sheet: GoogleSpreadsheetWorksheet,
  emailAddress: string,
  password: string
) => {
  await sheet.updateProperties({
    title: createSheetTitleFromSheetInfo(emailAddress, password, true),
  });
};

const finishProcessingSheet = async (
  sheet: GoogleSpreadsheetWorksheet,
  emailAddress: string,
  password: string
): Promise<void> => {
  await sheet.updateProperties({
    title: createSheetTitleFromSheetInfo(emailAddress, password, false),
  });
};

export const processSheet = async (
  browserContext: BrowserContext,
  sheet: GoogleSpreadsheetWorksheet
) => {
  const { emailAddress, password, isUpdateInProgress } =
    getSheetInfoFromSheetTitle(sheet.title);

  if (!emailAddress || !password) {
    throw `Auth credentials are not present for ${emailAddress}`;
  }

  if (isUpdateInProgress) {
    logMessage(
      `Signups for ${emailAddress} are currently being processed by another invocation of this script`
    );
    return;
  }

  await startProcessingSheet(sheet, emailAddress, password);

  const rows = await sheet.getRows<Row>();
  const rowsToSignUpFor = rows.filter((row) => !row.get("Signed up?"));
  if (rowsToSignUpFor.length === 0) {
    logMessage(`No class sign-up requests were found for ${emailAddress}`);
    await finishProcessingSheet(sheet, emailAddress, password);
    return;
  }

  try {
    await logIn(emailAddress, password, browserContext);

    for (let i = 0; i < rowsToSignUpFor.length; i++) {
      const row = rowsToSignUpFor[i];
      await processRow(emailAddress, browserContext, row);
    }

    await logOut(browserContext);
  } finally {
    await finishProcessingSheet(sheet, emailAddress, password);
  }
};
