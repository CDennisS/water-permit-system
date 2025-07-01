import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { chromium, type Browser, type Page } from "playwright"

describe("Permit Printing E2E Tests", () => {
  let browser: Browser
  let page: Page

  beforeEach(async () => {
    browser = await chromium.launch()
    page = await browser.newPage()

    // Mock the print functionality
    await page.addInitScript(() => {
      window.print = () => {
        console.log("Print function called")
        // Dispatch a custom event to signal print was called
        window.dispatchEvent(new CustomEvent("print-called"))
      }
    })
  })

  afterEach(async () => {
    await browser.close()
  })

  it("should complete full print workflow in browser", async () => {
    // Navigate to the permit management system
    await page.goto("http://localhost:3000")

    // Login as permitting officer
    await page.fill('[data-testid="username"]', "officer1")
    await page.fill('[data-testid="password"]', "password123")
    await page.click('[data-testid="login-button"]')

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]')

    // Navigate to applications
    await page.click('[data-testid="applications-tab"]')

    // Find an approved application
    await page.waitForSelector('[data-testid="applications-table"]')
    const approvedRow = page.locator('[data-status="approved"]').first()

    // Click on the application to view details
    await approvedRow.click()

    // Wait for application details to load
    await page.waitForSelector('[data-testid="application-details"]')

    // Find and click the print permit button
    const printButton = page.locator('[data-testid="print-permit-button"]')
    await expect(printButton).toBeVisible()

    // Click preview first
    await page.click('[data-testid="preview-permit-button"]')

    // Wait for preview dialog
    await page.waitForSelector('[data-testid="permit-preview-dialog"]')

    // Verify permit content is displayed
    await expect(page.locator('[data-testid="permit-template"]')).toBeVisible()
    await expect(page.locator("text=UMSCC-")).toBeVisible()

    // Set up print event listener
    const printPromise = page.waitForEvent("console", (msg) => msg.text().includes("Print function called"))

    // Click print button in dialog
    await page.click('[data-testid="print-button-dialog"]')

    // Wait for print to be called
    await printPromise

    // Verify success message
    await expect(page.locator("text=Print Initiated")).toBeVisible()
  })

  it("should handle print errors gracefully", async () => {
    await page.goto("http://localhost:3000")

    // Mock window.open to return null (blocked popup)
    await page.addInitScript(() => {
      const originalOpen = window.open
      window.open = () => null
    })

    // Login and navigate to application
    await page.fill('[data-testid="username"]', "officer1")
    await page.fill('[data-testid="password"]', "password123")
    await page.click('[data-testid="login-button"]')

    await page.waitForSelector('[data-testid="dashboard"]')
    await page.click('[data-testid="applications-tab"]')

    const approvedRow = page.locator('[data-status="approved"]').first()
    await approvedRow.click()

    await page.waitForSelector('[data-testid="application-details"]')

    // Try to print
    await page.click('[data-testid="print-permit-button"]')

    // Should show error message
    await expect(page.locator("text=Print Error")).toBeVisible()
    await expect(page.locator("text=popup settings")).toBeVisible()
  })

  it("should show permission errors for unauthorized users", async () => {
    await page.goto("http://localhost:3000")

    // Login as applicant (no print permissions)
    await page.fill('[data-testid="username"]', "applicant1")
    await page.fill('[data-testid="password"]', "password123")
    await page.click('[data-testid="login-button"]')

    await page.waitForSelector('[data-testid="dashboard"]')
    await page.click('[data-testid="my-applications-tab"]')

    // Find an approved application
    const approvedRow = page.locator('[data-status="approved"]').first()
    await approvedRow.click()

    await page.waitForSelector('[data-testid="application-details"]')

    // Should show permission error instead of print button
    await expect(page.locator("text=Cannot Print Permit")).toBeVisible()
    await expect(page.locator("text=cannot print permits")).toBeVisible()

    // Print button should not be visible
    await expect(page.locator('[data-testid="print-permit-button"]')).not.toBeVisible()
  })

  it("should handle download functionality", async () => {
    await page.goto("http://localhost:3000")

    // Set up download handling
    const downloadPromise = page.waitForEvent("download")

    // Login as permitting officer
    await page.fill('[data-testid="username"]', "officer1")
    await page.fill('[data-testid="password"]', "password123")
    await page.click('[data-testid="login-button"]')

    await page.waitForSelector('[data-testid="dashboard"]')
    await page.click('[data-testid="applications-tab"]')

    const approvedRow = page.locator('[data-status="approved"]').first()
    await approvedRow.click()

    await page.waitForSelector('[data-testid="application-details"]')

    // Open preview
    await page.click('[data-testid="preview-permit-button"]')
    await page.waitForSelector('[data-testid="permit-preview-dialog"]')

    // Click download button
    await page.click('[data-testid="download-button"]')

    // Wait for download
    const download = await downloadPromise

    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/^Permit_UMSCC-\d{4}-\d{2}-\d{4}_\d{4}-\d{2}-\d{2}\.txt$/)

    // Verify success message
    await expect(page.locator("text=Download Complete")).toBeVisible()
  })

  it("should be responsive on mobile devices", async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto("http://localhost:3000")

    // Login
    await page.fill('[data-testid="username"]', "officer1")
    await page.fill('[data-testid="password"]', "password123")
    await page.click('[data-testid="login-button"]')

    await page.waitForSelector('[data-testid="dashboard"]')

    // Navigate to applications (might be in mobile menu)
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]')
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click()
    }

    await page.click('[data-testid="applications-tab"]')

    const approvedRow = page.locator('[data-status="approved"]').first()
    await approvedRow.click()

    await page.waitForSelector('[data-testid="application-details"]')

    // Print button should be visible and properly sized on mobile
    const printButton = page.locator('[data-testid="print-permit-button"]')
    await expect(printButton).toBeVisible()

    // Button should not be too small for mobile interaction
    const buttonBox = await printButton.boundingBox()
    expect(buttonBox?.height).toBeGreaterThan(40) // Minimum touch target size

    // Preview dialog should be responsive
    await page.click('[data-testid="preview-permit-button"]')
    await page.waitForSelector('[data-testid="permit-preview-dialog"]')

    // Dialog should fit within viewport
    const dialogBox = await page.locator('[data-testid="permit-preview-dialog"]').boundingBox()
    expect(dialogBox?.width).toBeLessThanOrEqual(375)
  })

  it("should handle keyboard navigation", async () => {
    await page.goto("http://localhost:3000")

    // Login
    await page.fill('[data-testid="username"]', "officer1")
    await page.fill('[data-testid="password"]', "password123")
    await page.click('[data-testid="login-button"]')

    await page.waitForSelector('[data-testid="dashboard"]')
    await page.click('[data-testid="applications-tab"]')

    const approvedRow = page.locator('[data-status="approved"]').first()
    await approvedRow.click()

    await page.waitForSelector('[data-testid="application-details"]')

    // Use Tab to navigate to print button
    await page.keyboard.press("Tab")
    await page.keyboard.press("Tab")

    // Should be able to activate print with Enter or Space
    const printButton = page.locator('[data-testid="print-permit-button"]')
    await expect(printButton).toBeFocused()

    await page.keyboard.press("Enter")

    // Should trigger print functionality
    await expect(page.locator("text=Print Initiated")).toBeVisible()
  })

  it("should maintain print quality across different browsers", async () => {
    // This test would ideally run across multiple browser engines
    // For now, we'll test Chrome-specific print features

    await page.goto("http://localhost:3000")

    // Login and navigate
    await page.fill('[data-testid="username"]', "officer1")
    await page.fill('[data-testid="password"]', "password123")
    await page.click('[data-testid="login-button"]')

    await page.waitForSelector('[data-testid="dashboard"]')
    await page.click('[data-testid="applications-tab"]')

    const approvedRow = page.locator('[data-status="approved"]').first()
    await approvedRow.click()

    await page.waitForSelector('[data-testid="application-details"]')

    // Open preview
    await page.click('[data-testid="preview-permit-button"]')
    await page.waitForSelector('[data-testid="permit-preview-dialog"]')

    // Check that print styles are properly applied
    const permitTemplate = page.locator('[data-testid="permit-template"]')

    // Verify A4 dimensions are set
    const styles = await permitTemplate.evaluate((el) => {
      return window.getComputedStyle(el)
    })

    // Should have proper print styling
    expect(styles.fontFamily).toContain("Times New Roman")

    // Test print media query
    await page.emulateMedia({ media: "print" })

    // Elements with .no-print class should be hidden
    const noPrintElements = page.locator(".no-print")
    if ((await noPrintElements.count()) > 0) {
      await expect(noPrintElements.first()).toHaveCSS("display", "none")
    }
  })
})
