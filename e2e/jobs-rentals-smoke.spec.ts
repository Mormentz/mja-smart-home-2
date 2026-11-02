import { test, expect } from "@playwright/test";

test.describe("Jobs & Rentals hubs", () => {
  test("jobs hub CTAs", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("link", { name: /Register as a Job Seeker/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Register as an Employer/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Browse Job Seekers/i })).toBeVisible();
  });

  test("rentals hub CTAs", async ({ page }) => {
    await page.goto("/rentals");
    await expect(page.getByRole("link", { name: /I want to rent equipment/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /I want to list equipment/i })).toBeVisible();
  });

  test("seekers and vacancies pages load", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/jobs/seekers", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /public professional profiles/i })).toBeVisible();
    await page.goto("/jobs/vacancies", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /open vacancies/i })).toBeVisible();
    await page.goto("/rentals/browse", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /browse equipment/i })).toBeVisible();
  });
});
