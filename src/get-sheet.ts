import { GoogleSpreadsheet } from "google-spreadsheet";

export const getSheet = async (
  sheetId: string,
  { email, privateKey }: { email: string; privateKey: string }
) => {
  const sheet = new GoogleSpreadsheet(sheetId);
  await sheet.useServiceAccountAuth({
    client_email: email,
    private_key: privateKey,
  });
  await sheet.loadInfo();
  return sheet;
};
