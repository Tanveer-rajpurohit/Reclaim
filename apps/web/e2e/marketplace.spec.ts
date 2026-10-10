import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import sharp from "sharp";

const mailbox = resolve("../../.local/e2e/mail");
async function register(page: Page, label: string) {
  const email = `${label.toLowerCase()}-${randomUUID()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Name", { exact: true }).fill(label);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  let link = "";
  await expect
    .poll(async () => {
      try {
        const messages = await Promise.all(
          (await readdir(mailbox)).map(async (file) =>
            JSON.parse(await readFile(join(mailbox, file), "utf8")),
          ),
        );
        const message = messages.find(
          (m) => m.to === email && m.subject === "Verify your Reclaim email",
        );
        link = message?.text.match(/http[^\s]+/)[0] || "";
      } catch {
        link = "";
      }
      return Boolean(link);
    })
    .toBe(true);
  await page.goto(link);
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Email verified");
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard");
  await page.goto("/dashboard/profile");
  await page.getByLabel("Locality", { exact: true }).fill("Rohini");
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText("saved");
  return email;
}

test("two verified browser sessions publish, save, request, accept and complete a handover", async ({
  browser,
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await register(page, "Seller");
  const buyerContext = await browser.newContext({
    ...testInfo.project.use,
    baseURL: "http://localhost:3101",
  });
  const buyer = await buyerContext.newPage();
  buyer.on("pageerror", (error) => errors.push(error.message));
  await register(buyer, "Buyer");
  await page.goto("/dashboard/listings/new");
  await page
    .getByLabel("Event name", { exact: true })
    .fill("Campus material collection");
  await page.getByLabel("Locality", { exact: true }).fill("Rohini");
  await page.getByLabel("Event or cleanup date (IST)").fill("2020-01-02");
  await page
    .getByLabel("Public pickup instructions")
    .fill("Meet at the campus gate.");
  await page.getByRole("button", { name: "Continue to materials" }).click();
  await page
    .getByLabel("Item name", { exact: true })
    .fill("Reusable stage boards");
  const category = page.getByRole("combobox", {
    name: "Material category",
    exact: true,
  });
  await category.press("End");
  await category.press("Enter");
  await expect(category).toContainText("Other");
  await category.press("Home");
  await category.press("Enter");
  await expect(category).toContainText("Wood");
  const image = await sharp({
    create: { width: 64, height: 64, channels: 3, background: "#c3ac7e" },
  })
    .png()
    .toBuffer();
  await page
    .getByLabel("Upload product photos")
    .setInputFiles({
      name: "boards.png",
      mimeType: "image/png",
      buffer: image,
    });
  await expect(page.getByRole("button", { name: "Add photos" })).toBeVisible();
  await page.getByRole("button", { name: "Review listing" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Publish 1 item" }).click();
  await page.waitForURL("**/dashboard/listings?published=1");
  await page
    .getByRole("heading", { name: "Reusable stage boards", exact: true })
    .getByRole("link")
    .click();
  await page.waitForURL("**/dashboard/items/*");
  const itemPath = new URL(page.url()).pathname;
  await page
    .getByLabel("Upload product photos")
    .setInputFiles({
      name: "detail.png",
      mimeType: "image/png",
      buffer: image,
    });
  await expect(
    page.getByRole("button", { name: "View photo 2", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View photo 2", exact: true }).click();
  await page.getByRole("button", { name: "Make cover", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "View photo 1, cover", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "View photo 2", exact: true }).click();
  await page.getByRole("button", { name: "Remove photo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "View photo 2", exact: true }),
  ).toHaveCount(0);
  await buyer.goto("/dashboard");
  await buyer
    .getByRole("button", { name: "Save Reusable stage boards", exact: true })
    .click();
  await expect(
    buyer.getByRole("button", {
      name: "Unsave Reusable stage boards",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await buyer.goto("/dashboard/saved");
  await expect(
    buyer.getByRole("link", { name: "View Reusable stage boards" }),
  ).toBeVisible();
  await buyer.goto(itemPath);
  await buyer.getByRole("link", { name: "Seller", exact: true }).click();
  await expect(
    buyer.getByRole("heading", { name: "Seller", exact: true }),
  ).toBeVisible();
  await buyer.goto(itemPath);
  await buyer.getByLabel(/Preferred pickup/).fill("2027-04-01T12:00");
  await buyer.getByRole("button", { name: "Get this" }).click();
  await buyer.waitForURL("**/dashboard/deals?side=buying");
  await buyer
    .getByRole("link")
    .filter({ hasText: "Reusable stage boards" })
    .click();
  await buyer.waitForURL(/\/dashboard\/deals\/[0-9a-f-]+$/);
  const dealPath = new URL(buyer.url()).pathname;
  await expect(
    buyer.getByText("Contact after acceptance", { exact: true }),
  ).toBeVisible();
  await page.goto(dealPath);
  await page.getByRole("link", { name: /Review Buyer/ }).click();
  await expect(
    page.getByRole("heading", { name: "Buyer", exact: true }),
  ).toBeVisible();
  await page.goto(dealPath);
  await page.getByRole("button", { name: "Accept pickup request" }).click();
  await expect(
    page.getByRole("button", { name: "Mark handover complete" }),
  ).toBeVisible();
  await buyer.reload();
  await expect(
    buyer.getByText("+91 9876543210", { exact: true }),
  ).toBeVisible();
  await buyer
    .getByRole("button", { name: "Confirm I collected this batch" })
    .click();
  await expect(
    buyer.getByText("Collection confirmed; waiting for the seller", {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Mark handover complete" }).click();
  await expect(
    page.getByRole("link", { name: "View handover record" }),
  ).toBeVisible();
  await buyer.reload();
  await expect(
    buyer.getByRole("link", { name: "View handover record" }),
  ).toBeVisible();
  for (const participant of [page, buyer]) {
    await participant.goto("/dashboard/impact");
    await expect(
      participant
        .getByRole("link")
        .filter({ hasText: "Reusable stage boards" }),
    ).toBeVisible();
    await participant.screenshot({
      path: testInfo.outputPath(
        participant === page ? "seller-impact.png" : "buyer-impact.png",
      ),
      fullPage: true,
    });
    await participant.goto("/dashboard/notifications");
    await expect(
      participant.getByRole("link", { name: "Handover complete", exact: true }),
    ).toBeVisible();
    await participant.getByRole("button", { name: "Mark all as read" }).click();
    await expect(
      participant.getByRole("button", { name: "Mark read", exact: true }),
    ).toHaveCount(0);
    expect(
      await participant.evaluate(() =>
        localStorage.getItem("reclaim-board-v1"),
      ),
    ).toBeNull();
    expect(await participant.getByText("DEMO WALKTHROUGH").count()).toBe(0);
    expect(
      await participant.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
  await buyerContext.close();
});

test("public browsing and protected account screens show real loading and empty states", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: /Good materials/ }),
  ).toBeVisible();
  await page.goto("/dashboard/profile");
  await expect(
    page.getByRole("heading", { name: "Sign in to continue." }),
  ).toBeVisible();
  await expect(page.getByText("Reset preview data")).toHaveCount(0);
});
