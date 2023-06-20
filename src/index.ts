import { getSheet } from "./get-sheet";
import { processSheet } from "./process-sheet";
import { getBrowser } from "./get-browser";
import { logMessage } from "./log-message";

const SHEET_ID = "1_Bk7NYnnkpjUNa1TMPPyxxZjrmooToO9lxN4BY0h5uo";

const isLocal = !!process.env.IS_LOCAL;
const sheetsEmail = process.env.SHEETS_EMAIL;
const sheetsPrivateKey = process.env.SHEETS_PRIVATE_KEY;

export const handler = async () => {
  if (!sheetsEmail || !sheetsPrivateKey) {
    throw new Error("No Google Sheets auth info present");
  }

  const sheet = await getSheet(SHEET_ID, {
    email: sheetsEmail,
    privateKey: sheetsPrivateKey.split(String.raw`\n`).join("\n"),
  });

  const browser = await getBrowser(isLocal);
  await Promise.all(
    sheet.sheetsByIndex.map(async (sheet, i) => {
      const browserContext = await browser.newContext();

      try {
        await processSheet(browserContext, sheet);
      } catch (error) {
        logMessage(
          `Received unexpected error while attempting to process sheet with index ${i}: ${error}`
        );
      }

      await browserContext.close();
    })
  );

  await browser.close();
};

if (isLocal) {
  handler();
}
