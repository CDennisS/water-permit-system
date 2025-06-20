/**
 * Test utilities and setup for dashboard testing
 */

import type React from "react"
import { render, type RenderOptions } from "@testing-library/react"
import { vi } from "vitest"
import { waitFor, expect } from "@testing-library/react"

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

// Mock window.alert
Object.defineProperty(window, "alert", {
  writable: true,
  value: vi.fn(),
})

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>
}

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from "@testing-library/react"
export { customRender as render }

// Test data generators
export const createMockApplication = (overrides = {}) => ({
  id: "test-app-1",
  applicationId: "APP-TEST-001",
  applicantName: "Test Applicant",
  permitType: "water_extraction",
  waterAllocation: 1000,
  numberOfBoreholes: 2,
  currentStage: 3,
  status: "under_review",
  workflowComments: [],
  createdAt: new Date(),
  submittedAt: new Date(),
  ...overrides,
})

export const createMockUser = (userType = "catchment_manager", overrides = {}) => ({
  id: "test-user-1",
  name: "Test User",
  email: "test@example.com",
  userType,
  createdAt: new Date(),
  ...overrides,
})

// Test helpers
export const waitForLoadingToFinish = async () => {
  const loadingElement = document.querySelector('[data-testid="loading"]')
  if (loadingElement) {
    await waitFor(() => {
      expect(loadingElement).not.toBeInTheDocument()
    })
  }
}

export const fillAndSaveComment = async (user: any, commentText: string, index = 0) => {
  const textareas = document.querySelectorAll("textarea")
  const textarea = textareas[index]
  await user.type(textarea, commentText)

  const saveButtons = document.querySelectorAll("button")
  const saveButton = Array.from(saveButtons).find((btn) => btn.textContent?.includes("Save Comment"))
  if (saveButton) {
    await user.click(saveButton)
  }
}
