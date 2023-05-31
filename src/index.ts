import { getSheet } from "./get-sheet";
import { processSheet } from "./process-sheet";
import { getBrowser } from "./get-browser";

const SHEET_ID = "1_Bk7NYnnkpjUNa1TMPPyxxZjrmooToO9lxN4BY0h5uo";

const sheetsEmail = process.env.SHEETS_EMAIL;
const sheetsPrivateKey = process.env.SHEETS_PRIVATE_KEY;

const main = async () => {
  if (!sheetsEmail || !sheetsPrivateKey) {
    throw new Error("No Google Sheets API key present");
  }

  const sheet = await getSheet(SHEET_ID, {
    email: sheetsEmail,
    privateKey: sheetsPrivateKey.split(String.raw`\n`).join("\n"),
  });

  const browser = await getBrowser();
  const boundProcessSheet = processSheet(browser);
  await Promise.allSettled(sheet.sheetsByIndex.map(boundProcessSheet));

  for (const context of browser.contexts()) {
    await context.close();
  }
  await browser.close();
};

main().catch((error) => {
  console.log(error);
});
