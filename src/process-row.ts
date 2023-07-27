import { format, isBefore, parse } from "date-fns";
import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { BrowserContext } from "playwright-core";
import { logMessage } from "./log-message";
import { BOOKING_URL } from "./constants";
import { sendSignupEmail } from "./send-email";
import { Location, Row } from "./types";

const LOCATION_TO_QUERY_STRING = {
  Chelsea: "13",
  "Downtown Brooklyn": "14",
  "Prospect Heights": "15",
} as const satisfies { [key in Location]: string };

const markRowAsSignedUp = async (
  row: GoogleSpreadsheetRow<Row>,
  isSignedUp: boolean
) => {
  const characterToMark = isSignedUp ? "✅" : "❌";
  row.set("Signed up?", characterToMark);
  await row.save();
};

export const processRow = async (
  emailAddress: string,
  browserContext: BrowserContext,
  row: GoogleSpreadsheetRow<Row>
) => {
  const classDate: Row["Date"] = row.get("Date");
  const classTime: Row["Time"] = row.get("Time");
  const className: Row["Class name"] = row.get("Class name");
  const classLocation: Row["Location"] = row.get("Location");

  const classLogString = `class ${className} at ${classTime} on ${classDate} at ${classLocation}`;

  const finish = async (message: string, isSignedUp?: boolean) => {
    logMessage(`${emailAddress}: ${classLogString} ${message}`);

    if (isSignedUp !== undefined) {
      await markRowAsSignedUp(row, isSignedUp);

      if (isSignedUp) {
        try {
          await sendSignupEmail(
            emailAddress,
            className,
            classTime,
            classDate,
            classLocation
          );
        } catch (error) {
          logMessage(
            `Could not send successful class signup email to ${emailAddress} for ${classLogString}: ${error}`
          );
        }
      }
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
  const queryStringLocation = LOCATION_TO_QUERY_STRING[classLocation];
  const searchParams = new URLSearchParams({
    centers: queryStringLocation,
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
    await bookButton.waitFor({ state: "visible", timeout: 1000 });
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
    await modal.waitFor({ state: "visible", timeout: 1000 });
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
    `was not signed up for (${notSignedUpReason}); will try to sign up again in 1 minute`
  );
};
