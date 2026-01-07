import {
  type ElectronApplication,
  _electron as electron,
  expect,
  type Page,
  test,
} from "@playwright/test";
import { findLatestBuild, parseElectronApp } from "electron-playwright-helpers";

let electronApp: ElectronApplication;

test.beforeAll(async () => {
  const latestBuild = findLatestBuild();
  const appInfo = parseElectronApp(latestBuild);
  process.env.CI = "e2e";

  electronApp = await electron.launch({
    args: [appInfo.main],
  });
  electronApp.on("window", (page) => {
    const filename = page.url()?.split("/").pop();
    console.log(`Window opened: ${filename}`);

    page.on("pageerror", (error) => {
      console.error(error);
    });
    page.on("console", (msg) => {
      console.log(msg.text());
    });
  });
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe("Add Rule Button", () => {
  test("should show input field when Add Rule button is clicked with project selected", async () => {
    const page: Page = await electronApp.firstWindow();

    // Wait for the app to load
    await page.waitForTimeout(1000);

    // Log initial state
    console.log("=== TEST: Checking initial state ===");

    // Check if projects are visible
    const projects = await page
      .locator('[class*="group flex items-center gap-2"]')
      .count();
    console.log("Number of projects found:", projects);

    // Click on the first project (if available)
    if (projects > 0) {
      const firstProject = page
        .locator('[class*="group flex items-center gap-2"]')
        .first();
      const projectPath = await firstProject.textContent();
      console.log("Clicking on project:", projectPath);
      await firstProject.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Rules tab
    console.log("=== TEST: Navigating to Rules tab ===");
    const rulesTabButton = page.getByText("Rules");
    await rulesTabButton.click();
    await page.waitForTimeout(500);

    // Find and click the Add Rule button
    console.log("=== TEST: Looking for Add Rule button ===");
    const addButton = page.getByRole("button", { name: /Add Rule/i });

    // Check if button is visible
    const isVisible = await addButton.isVisible();
    console.log("Add Rule button visible:", isVisible);

    if (!isVisible) {
      // Try alternative selector
      const altButton = page.locator("button").filter({ hasText: "Add Rule" });
      console.log("Trying alternative selector for Add Rule button");
      const altVisible = await altButton.isVisible();
      console.log("Alternative button visible:", altVisible);
    }

    // Click the button
    console.log("=== TEST: Clicking Add Rule button ===");
    await addButton.click();

    // Wait for potential UI updates
    await page.waitForTimeout(1000);

    // Check if input field appeared (the expected behavior)
    console.log("=== TEST: Checking for input field ===");
    const inputField = page
      .locator('input[placeholder*="my-rule"], input[placeholder*="rule"]')
      .first();
    const inputVisible = await inputField
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    console.log("Input field visible after click:", inputVisible);

    // This test should fail until we fix the issue
    if (!inputVisible) {
      console.log("=== TEST FAILED: Input field did not appear ===");

      // Debug: Get current activePath from console logs
      const consoleLogs: string[] = [];
      page.on("console", (msg) => {
        consoleLogs.push(msg.text());
      });

      // Check if activePath is logged
      const activePathLogs = consoleLogs.filter((log) =>
        log.includes("activePath")
      );
      console.log("Active path logs found:", activePathLogs);
    }

    expect(inputVisible).toBe(true);
  });

  test("should log activePath value when RulesTab renders", async () => {
    const page: Page = await electronApp.firstWindow();

    await page.waitForTimeout(1000);

    // Collect console logs
    const logs: string[] = [];
    page.on("console", (msg) => {
      logs.push(msg.text());
    });

    // Click on first project if available
    const projects = await page
      .locator('[class*="group flex items-center gap-2"]')
      .count();
    if (projects > 0) {
      await page
        .locator('[class*="group flex items-center gap-2"]')
        .first()
        .click();
      await page.waitForTimeout(500);
    }

    // Navigate to Rules tab
    await page.getByText("Rules").click();
    await page.waitForTimeout(1000);

    // Check for activePath logs
    const activePathLogs = logs.filter((log) => log.includes("activePath"));
    console.log("=== Console logs containing 'activePath': ===");
    for (const log of activePathLogs) {
      console.log(log);
    }

    expect(activePathLogs.length).toBeGreaterThan(0);
  });
});
