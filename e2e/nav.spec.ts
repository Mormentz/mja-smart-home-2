import { test, expect } from "@playwright/test";

test.describe("HomeConnect nav triad", () => {
  test("header shows Services, Jobs, Rentals", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("header nav").first();
    await expect(nav.getByRole("link", { name: "Services" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Jobs" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Rentals" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Artisans" })).toHaveCount(0);
  });

  test("hubs respond", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/services", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Services").first()).toBeVisible();
    await page.goto("/jobs", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /verified confidence/i })).toBeVisible();
    await page.goto("/rentals", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /equipment & gadget/i })).toBeVisible();
  });

  test("/artisans redirects to /services", async ({ page }) => {
    await page.goto("/artisans");
    await expect(page).toHaveURL(/\/services/);
  });
});
