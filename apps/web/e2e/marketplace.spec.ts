import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import sharp from "sharp";
import type { MarketplaceSnapshot } from "../types/marketplace/type";

const mailbox = resolve("../../.local/e2e/mail");
test("registration allows optional profile verification and accessible toasts while password icons preserve input", async ({
  page,
}, info) => {
  const email = `otp-ui-${randomUUID()}@example.com`;
  const password = "browser-test-password-123";
  await page.goto("/register");
  await page.getByLabel("Name", { exact: true }).fill("OTP UI Account");
  await page.getByLabel("Email", { exact: true }).fill(email);
  const passwordField = page.getByLabel("Password", { exact: true });
  await passwordField.fill(password);
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await expect(passwordField).toHaveAttribute("type", "text");
  await expect(passwordField).toHaveValue(password);
  await page
    .getByRole("button", { name: "Hide password", exact: true })
    .click();
  await expect(passwordField).toHaveAttribute("type", "password");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.waitForURL("**/dashboard");
  await page.goto("/dashboard/profile");
  await expect(
    page.getByText("Email not verified", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(
    page.getByText("Email verification pending", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Check your email");
  await expect(
    page.getByRole("button", { name: /^Resend code in (?:[1-5]?\d|60)s$/ }),
  ).toBeDisabled();
  await page.screenshot({ path: info.outputPath("verification.png") });
  let code = "";
  await expect
    .poll(async () => {
      const messages = await Promise.all(
        (await readdir(mailbox)).map(async (file) =>
          JSON.parse(await readFile(join(mailbox, file), "utf8")),
        ),
      );
      code =
        messages
          .find((message) => message.to === email)
          ?.text.match(/code is (\d{6})/)?.[1] || "";
      return Boolean(code);
    })
    .toBe(true);
  await page
    .getByLabel("Verification code", { exact: true })
    .fill(code === "000000" ? "111111" : "000000");
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  const errorToast = page
    .getByRole("alert")
    .filter({ hasText: "incorrect or expired" });
  await expect(errorToast).toBeVisible();
  await page
    .getByRole("button", { name: "Dismiss notification", exact: true })
    .click();
  await expect(errorToast).toHaveCount(0);
  await page.getByLabel("Verification code", { exact: true }).fill(code);
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Email verified");
  await page.getByRole("link", { name: "Back to profile" }).click();
  await expect(page.getByText("Email verified", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue(
    password,
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard");
});
test("photo suggestions preserve manual items and remain editable before publication", async ({
  page,
}) => {
  await register(page, "PhotoSeller");
  await page.goto("/dashboard/listings/new");
  await page
    .getByLabel("Event name", { exact: true })
    .fill("Photo cleanup collection");
  await page.getByLabel("Locality", { exact: true }).fill("Rohini");
  await page.getByLabel("Event or cleanup date (IST)").fill("2020-01-02");
  await page.getByRole("button", { name: "Continue to materials" }).click();
  await page
    .getByLabel("Item name", { exact: true })
    .fill("Manually entered chairs");
  await page.route("**/api/analysis", async (route) => {
    const { photoId } = route.request().postDataJSON();
    await route.fulfill({
      json: {
        items: [
          {
            name: "Suggested wooden boards",
            description: "Visible material to inspect",
            category: "Wood",
            purpose: "Reuse",
            quantity: 2,
            unit: "pieces",
            condition: "Fair",
            price: 0,
            hazards: "Check for nails",
            art: "boards",
            image: `/api/photos/${photoId}`,
            images: [],
          },
        ],
        warnings: ["Check the visible count before publishing."],
      },
    });
  });
  const image = await sharp({
    create: { width: 64, height: 64, channels: 3, background: "#c3ac7e" },
  })
    .png()
    .toBuffer();
  await page.getByLabel("Choose a cleanup photo").setInputFiles({
    name: "cleanup.png",
    mimeType: "image/png",
    buffer: image,
  });
  await page
    .getByRole("button", { name: "Identify materials", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("ready to review");
  const names = page.getByLabel("Item name", { exact: true });
  await expect(names).toHaveCount(2);
  await expect(names.nth(0)).toHaveValue("Manually entered chairs");
  await expect(names.nth(1)).toHaveValue("Suggested wooden boards");
  await names.nth(1).fill("Reviewed wooden boards");
  await expect(names.nth(1)).toHaveValue("Reviewed wooden boards");
  await expect(page.getByLabel("Things to review")).toContainText(
    "Check the visible count",
  );
  await page.unroute("**/api/analysis");
  await page.route("**/api/analysis", (route) =>
    route.fulfill({
      status: 503,
      json: {
        error: {
          code: "BEDROCK_UNAVAILABLE",
          message: "Photo suggestions are unavailable. Add materials manually.",
        },
      },
    }),
  );
  await page
    .getByRole("button", { name: "Identify materials", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Add materials manually",
  );
  await expect(names).toHaveCount(2);
  await expect(names.nth(1)).toHaveValue("Reviewed wooden boards");
});
async function register(page: Page, label: string) {
  const email = `${label.toLowerCase()}-${randomUUID()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Name", { exact: true }).fill(label);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard");
  await page.goto("/dashboard/profile");
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  let code = "";
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
        code = message?.text.match(/code is (\d{6})/)?.[1] || "";
      } catch {
        code = "";
      }
      return Boolean(code);
    })
    .toBe(true);
  await page.getByLabel("Verification code", { exact: true }).fill(code);
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Email verified");
  await page.getByRole("link", { name: "Back to profile" }).click();
  await page
    .getByLabel("Area or neighbourhood", { exact: true })
    .fill("Rohini");
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
  await page.getByLabel("Upload product photos").setInputFiles({
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
  await page.getByLabel("Upload product photos").setInputFiles({
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
  for (const participant of [page, buyer]) {
    await participant.goto("/dashboard/profile");
    const summary = participant.getByRole("region", {
      name: participant === page ? "Seller" : "Buyer",
      exact: true,
    });
    await expect(
      summary.getByText("Email verified", { exact: true }),
    ).toBeVisible();
    const offered = summary
      .locator("dl > div")
      .filter({ hasText: "Handovers offered" });
    const collected = summary
      .locator("dl > div")
      .filter({ hasText: "Batches collected" });
    await expect(offered.locator("dd")).toHaveText(
      participant === page ? "1" : "0",
    );
    await expect(collected.locator("dd")).toHaveText(
      participant === buyer ? "1" : "0",
    );
  }
  expect(errors).toEqual([]);
  await buyerContext.close();
});

test("public browsing and protected account screens show real loading and empty states", async ({
  page,
}, testInfo) => {
  const email = await register(page, "PublicSeller");
  await page.goto("/dashboard/saved");
  await expect(
    page.getByRole("heading", { name: "Nothing saved here yet." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explore materials", exact: true }),
  ).toHaveAttribute("href", "/dashboard");
  const origin = "http://localhost:3101";
  const image = await sharp({
    create: { width: 64, height: 64, channels: 3, background: "#c3ac7e" },
  })
    .png()
    .toBuffer();
  const uploaded = await page.request.post("/api/uploads", {
    headers: { origin },
    multipart: {
      photo: {
        name: "public-boards.png",
        mimeType: "image/png",
        buffer: image,
      },
    },
  });
  expect(uploaded.ok()).toBe(true);
  const photo: { url: string } = await uploaded.json();
  const published = await page.request.post("/api/events", {
    headers: { origin, "idempotency-key": randomUUID() },
    data: {
      event: {
        name: "Public browsing collection",
        area: "Rohini",
        eventDate: "2020-01-02",
        pickupNote: "Meet at the campus gate.",
        deliveryNote: "Pickup only.",
      },
      items: [
        {
          name: "Public browsing boards",
          description: "Reusable boards from an old event.",
          category: "Wood",
          purpose: "Reuse",
          quantity: 2,
          unit: "pieces",
          condition: "Good",
          price: 0,
          hazards: "Check for nails.",
          art: "boards",
          image: photo.url,
          images: [],
        },
      ],
      safe: true,
    },
  });
  expect(published.status()).toBe(201);
  const listing: { itemIds: string[] } = await published.json();
  const expectedHref = `/dashboard/items/${listing.itemIds[0]}`;
  await page.goto("/dashboard/profile");
  await page.getByLabel("Display name", { exact: true }).fill("Public account");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("saved");
  await page.reload();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue(
    "Public account",
  );
  await expect(page.getByLabel("Mobile number")).toHaveValue("9876543210");
  const signOutBelowForm = await page
    .getByRole("button", { name: "Sign out", exact: true })
    .evaluate((button) => {
      const form = document.querySelector("form");
      return Boolean(
        form &&
        button.getBoundingClientRect().top >=
          form.getBoundingClientRect().bottom,
      );
    });
  expect(signOutBelowForm).toBe(true);
  const summary = page.getByRole("region", {
    name: "Public account",
    exact: true,
  });
  await expect(summary.getByText(email, { exact: true })).toBeVisible();
  await expect(
    summary
      .locator("dl > div")
      .filter({ hasText: "Active listings" })
      .locator("dd"),
  ).toHaveText("1");
  await page.screenshot({
    path: testInfo.outputPath("profile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL("**/dashboard");
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: /Good materials/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  const card = page
    .locator(".board-item")
    .filter({ has: page.locator(`a[href="${expectedHref}"]`) });
  await expect(card).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search materials, events or localities" })
    .fill(`no-match-${randomUUID()}`);
  await expect(
    page.getByRole("heading", { name: "No batches match this search." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear search and filters", exact: true })
    .click();
  await expect(card).toBeVisible();
  const itemHref = await card.locator("a").first().getAttribute("href");
  expect(itemHref).toBeTruthy();
  await card.getByRole("button", { name: /^Save / }).click();
  const prompt = page.getByRole("dialog");
  await expect(prompt).toBeVisible();
  await prompt.getByRole("button", { name: "Keep browsing" }).click();
  await expect(prompt).not.toBeVisible();
  await page.goto(itemHref!);
  const login = page.getByRole("link", {
    name: "Sign in to request this batch",
  });
  await expect(login).toBeVisible();
  await expect(login).toHaveAttribute(
    "href",
    `/login?next=${encodeURIComponent(itemHref!)}`,
  );
  await login.click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goto("/dashboard/profile");
  await expect(
    page.getByRole("heading", { name: "Sign in to continue." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sign in", exact: true }).last(),
  ).toHaveAttribute("href", "/login?next=%2Fdashboard%2Fprofile");
  await expect(page.getByText("Reset preview data")).toHaveCount(0);
  await page.goto(`/login?next=${encodeURIComponent(itemHref!)}`);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(`**${itemHref}`);
  await expect(
    page.getByRole("link", { name: "Manage your listing" }),
  ).toBeVisible();
});

test("empty marketplace and server failure have distinct recoverable states", async ({
  page,
}, testInfo) => {
  let unavailable = false;
  await page.route("**/api/board", async (route) => {
    await route.fulfill(
      unavailable
        ? {
            status: 503,
            json: {
              error: {
                code: "UNAVAILABLE",
                message: "The backend is temporarily unavailable.",
              },
            },
          }
        : {
            json: {
              state: {
                version: 1,
                people: [],
                events: [],
                items: [],
                deals: [],
                notices: [],
                saved: [],
              },
              currentUserId: null,
              email: null,
              verified: false,
              contacts: {},
            },
          },
    );
  });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "No batches available yet." }),
  ).toBeVisible();
  await page.goto(`/dashboard/items/${randomUUID()}`);
  await expect(
    page.getByRole("heading", { name: /^This batch isn/ }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Back to the board", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No batches match this search." }),
  ).toHaveCount(0);
  await expect(
    page
      .locator(".board-empty")
      .getByRole("link", { name: "List materials", exact: true }),
  ).toHaveAttribute("href", "/dashboard/listings/new");
  await page.screenshot({
    path: testInfo.outputPath("empty-marketplace.png"),
    fullPage: true,
  });
  unavailable = true;
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Materials could not be loaded." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No batches available yet." }),
  ).toHaveCount(0);
  unavailable = false;
  await page
    .getByRole("button", { name: "Retry loading", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No batches available yet." }),
  ).toBeVisible();
  const ownerId = randomUUID();
  const eventId = randomUUID();
  const snapshot: MarketplaceSnapshot = {
    currentUserId: ownerId,
    email: "owner@example.com",
    verified: true,
    contacts: {},
    state: {
      version: 1,
      people: [
        {
          id: ownerId,
          name: "Owner",
          phone: "9876543210",
          area: "Rohini",
          buyerType: "none",
          interests: [],
        },
      ],
      events: [
        {
          id: eventId,
          ownerId,
          name: "Old event",
          area: "Rohini",
          eventAt: 1577903400000,
          pickupNote: "Meet at the gate.",
          deliveryNote: "Pickup only.",
        },
      ],
      items: [
        {
          id: randomUUID(),
          eventId,
          name: "Owned boards",
          description: "Boards for reuse.",
          category: "Wood",
          purpose: "Reuse",
          quantity: 2,
          unit: "pieces",
          condition: "Good",
          price: 0,
          hazards: "Inspect at pickup.",
          art: "boards",
          image: `/api/photos/${randomUUID()}`,
          state: "Available",
          createdAt: Date.now(),
        },
      ],
      deals: [],
      notices: [],
      saved: [],
    },
  };
  await page.unroute("**/api/board");
  await page.route("**/api/board", (route) =>
    route.fulfill({ json: snapshot }),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "No other batches available yet." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View your listings", exact: true }),
  ).toHaveAttribute("href", "/dashboard/listings");
});

test("expired access refreshes once and failed refresh clears private account data", async ({
  page,
}) => {
  await register(page, "RefreshBrowser");
  let refreshes = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/auth/refresh") refreshes++;
  });
  const oldCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "reclaim_refresh",
  );
  expect(oldCookie).toBeTruthy();
  await page.context().clearCookies({ name: "reclaim_session" });
  await page.reload();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue(
    "RefreshBrowser",
  );
  expect(refreshes).toBe(1);
  const renewed = (await page.context().cookies()).find(
    (cookie) => cookie.name === "reclaim_refresh",
  );
  expect(renewed?.value).not.toBe(oldCookie?.value);
  await page.context().clearCookies({ name: "reclaim_session" });
  await page.context().addCookies([{ ...renewed!, value: "x".repeat(43) }]);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Sign in to continue." }),
  ).toBeVisible();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(refreshes).toBe(2);
  expect(
    (await page.context().cookies()).filter((cookie) =>
      ["reclaim_session", "reclaim_refresh"].includes(cookie.name),
    ),
  ).toHaveLength(0);
});
