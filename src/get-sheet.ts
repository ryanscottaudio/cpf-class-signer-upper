import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

export const getSheet = async (
  sheetId: string,
  { email, privateKey }: { email: string; privateKey: string }
) => {
  const serviceAccountAuth = new JWT({
    email: email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheet = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
  await sheet.loadInfo();
  return sheet;
};
