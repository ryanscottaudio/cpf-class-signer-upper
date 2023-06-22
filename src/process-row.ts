import { format, isBefore, parse } from "date-fns";
import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { BrowserContext } from "playwright-core";
import { logMessage } from "./log-message";
import { BOOKING_URL } from "./constants";

const markRowAsSignedUp = async (
  row: GoogleSpreadsheetRow,
  isSignedUp: boolean
) => {
  const characterToMark = isSignedUp ? "✅" : "❌";
  row["Signed up?"] = characterToMark;
  await row.save();
};

export const processRow = async (
  emailAddress: string,
  browserContext: BrowserContext,
  row: GoogleSpreadsheetRow
) => {
  const {
    Date: classDate,
    Time: classTime,
    "Class name": className,
  } = row as unknown as { Date: string; Time: string; "Class name": string };

  const finish = async (message: string, markRow?: boolean) => {
    logMessage(
      `${emailAddress}: class ${className} at ${classTime} on ${classDate} ${message}`
    );

    if (markRow !== undefined) {
      await markRowAsSignedUp(row, markRow);
    }
  };

  const date = parse(
    `${classDate} ${classTime}`,
    "MM/dd/yyyy h:mm a",
    new Date()
  );

  if (isBefore(date, Date.now())) {
    await finish("is in the past and cannot be signed up for", false);
    return;
  }

  const queryStringDate = [
    format(date, "yyyy"),
    format(date, "MM"),
    format(date, "dd"),
  ].join("-");
  const searchParams = new URLSearchParams({
    centers: "14", // Downtown Brooklyn location
    date: queryStringDate,
  });

  const url = new URL(BOOKING_URL);
  url.search = searchParams.toString();

  const page = await browserContext.newPage();
  await page.goto(url.toString());

  // Wait for class list to populate
  await page
    .locator("[data-cy=booking-list-results]")
    .waitFor({ state: "visible" });

  const classElement = (
    await page
      .locator(
        `//div[contains(*, "${classTime}") and contains(*, "${className}")]`
      )
      .all()
  ).pop();

  if (!classElement) {
    await finish("was not found and cannot be signed up for", false);
    return;
  }

  await classElement.locator("[data-cy='expand-button']").click();

  const bookButton = classElement.locator("[data-cy='book-button']");
  try {
    await bookButton.waitFor({ state: "visible", timeout: 500 });
  } catch (error) {
    await finish("was full and cannot be signed up for", false);
    return;
  }
  await bookButton.click();

  const confirmButton = page.locator(
    "button[data-cy='book-class-confirm-button']"
  );
  await confirmButton.waitFor({ state: "visible", timeout: 2000 });
  await confirmButton.click();
  await confirmButton.waitFor({ state: "hidden", timeout: 2000 });

  const modal = page.locator(".modal");
  try {
    await modal.waitFor({ state: "visible", timeout: 500 });
  } catch (error) {
    // No modal means that the bot successfully signed up for the class.
    await finish("was successfully joined", true);
    return;
  }

  const notSignedUpReason = ((await modal.textContent()) || "")
    .replace("Oops!", "")
    .replace("Cancel", "")
    .toLowerCase();
  await finish(
    `was not signed up for (${notSignedUpReason}); will try to sign up again in 15 minutes`
  );
};
