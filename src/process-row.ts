import { format, isBefore, parse } from "date-fns";
import { GoogleSpreadsheetRow } from "google-spreadsheet";
import { BrowserContext, Page } from "playwright-core";
import { logMessage } from "./log-message";

const markRowAsSignedUp = async (
  row: GoogleSpreadsheetRow,
  isSignedUp: boolean
) => {
  const characterToMark = isSignedUp ? "✅" : "❌";
  row["Signed up?"] = characterToMark;
  await row.save();
};

const logResultMessage =
  (
    emailAddress: string,
    className: string,
    classTime: string,
    classDate: string
  ) =>
  (message: string) => {
    logMessage(
      `${emailAddress}: class ${className} at ${classTime} on ${classDate} ${message}`
    );
  };

export const processRow =
  (emailAddress: string, browser: BrowserContext) =>
  async (row: GoogleSpreadsheetRow) => {
    const {
      Date: classDate,
      Time: classTime,
      "Class name": className,
    } = row as unknown as { Date: string; Time: string; "Class name": string };
    const date = parse(
      `${classDate} ${classTime}`,
      "MM/dd/yyyy h:mm a",
      new Date()
    );

    const finish = async (message: string, markRow?: boolean) => {
      boundLogResultMessage(message);

      if (markRow !== undefined) {
        await markRowAsSignedUp(row, markRow);
      }
    };

    const boundLogResultMessage = logResultMessage(
      emailAddress,
      className,
      classTime,
      classDate
    );

    if (isBefore(date, Date.now())) {
      await finish("is in the past and cannot be signed up for", false);
      return;
    }

    const page = await browser.newPage();
    const queryStringDate = [
      format(date, "yyyy"),
      format(date, "MM"),
      format(date, "dd"),
    ].join("-");
    const url = `https://mymembership.chelseapiers.com/booking?centers=14&date=${queryStringDate}`;
    await page.goto(url);

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
      `was not signed up for (${notSignedUpReason}); will try to sign up again in 1 hour`
    );
  };
