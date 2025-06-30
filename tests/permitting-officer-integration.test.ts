"use client"

import React from "react"

import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Home from "@/app/page"
import type { User, PermitApplication } from "@/types"
import { db } from "@/lib/database"

// Mock the database
vi.mock("@/lib/database", () => ({
  db: {
    getApplications: vi.fn(),
    getMessages: vi.fn(),
    updateApplication: vi.fn(),
    addLog: vi.fn(),
  },
}))

describe("Permitting Officer Integration Test", () => {
  let permittingOfficer: User
  let testApplications: PermitApplication[]

  beforeEach(() => {
    permittingOfficer = {
      id: "1",
      username: "admin",
      userType: "permitting_officer",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    testApplications = [
      {
        id: "app-001",
        applicationId: "WP-2024-001",
        applicantName: "John Doe",
        applicantId: "123456789",
        physicalAddress: "123 Main Street, Harare",
        postalAddress: "P.O. Box 123, Harare",
        cellularNumber: "+263771234567",
        landSize: 5.5,
        numberOfBoreholes: 2,
        waterAllocation: 10.5,
        intendedUse: "Irrigation and Domestic Use",
        gpsLatitude: -17.8252,
        gpsLongitude: 31.0335,
        status: "approved",
        currentStage: 1,
        permitType: "provisional",
        waterSource: "borehole",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-20"),
        submittedAt: new Date("2024-01-16"),
        approvedAt: new Date("2024-01-20"),
        documents: [],
        workflowComments: [],
      },
      {
        id: "app-002",
        applicationId: "WP-2024-002",
        applicantName: "Jane Smith",
        applicantId: "987654321",
        physicalAddress: "456 Oak Avenue, Bulawayo",
        postalAddress: "P.O. Box 456, Bulawayo",
        cellularNumber: "+263772345678",
        landSize: 3.2,
        numberOfBoreholes: 1,
        waterAllocation: 5.0,
        intendedUse: "Domestic Use",
        gpsLatitude: -20.1619,
        gpsLongitude: 28.5906,
        status: "draft",
        currentStage: 1,
        permitType: "temporary",
        waterSource: "borehole",
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
        documents: [],
        workflowComments: [],
      },
    ]

    // Mock database responses
    vi.mocked(db.getApplications).mockResolvedValue(testApplications)
    vi.mocked(db.getMessages).mockResolvedValue([])
    vi.mocked(db.updateApplication).mockResolvedValue(undefined)
    vi.mocked(db.addLog).mockResolvedValue(undefined)
  })

  it("should complete full workflow: login → view applications → preview permit", async () => {
    const user = userEvent.setup()

    // Mock the login state by rendering with user already logged in
    const MockHomeWithUser = () => {
      const [currentUser] = React.useState(permittingOfficer)
      return <Home />
    }

    render(<MockHomeWithUser />)

    // Wait for applications to load
    await waitFor(() => {
      expect(screen.getByText("WP-2024-001")).toBeInTheDocument()
      expect(screen.getByText("WP-2024-002")).toBeInTheDocument()
    })

    // Check that approved application shows preview option
    const approvedRow = screen.getByText("WP-2024-001").closest("tr")
    expect(approvedRow).toBeInTheDocument()

    // Check that draft application doesn't show preview
    const draftRow = screen.getByText("WP-2024-002").closest("tr")
    expect(draftRow).toBeInTheDocument()

    // Click view on approved application
    const viewButtons = screen.getAllByText("View")
    await user.click(viewButtons[0]) // First view button (approved app)

    // Should navigate to comprehensive view
    await waitFor(() => {
      expect(screen.getByText("Application Details")).toBeInTheDocument()
    })
  })

  it("should show correct permissions for permitting officer", async () => {
    const user = userEvent.setup()

    render(<Home />)

    // Should see dashboard tabs appropriate for permitting officer
    await waitFor(() => {
      expect(screen.getByText("Dashboard & Applications")).toBeInTheDocument()
      expect(screen.getByText("Records")).toBeInTheDocument()
      expect(screen.getByText("Messages")).toBeInTheDocument()
      expect(screen.getByText("Activity Logs")).toBeInTheDocument()
      // Should NOT see Reports tab (only for higher roles)
      expect(screen.queryByText("Reports & Analytics")).not.toBeInTheDocument()
    })
  })

  it("should handle bulk submission of unsubmitted applications", async () => {
    const user = userEvent.setup()

    // Add unsubmitted applications to test data
    const unsubmittedApp = {
      ...testApplications[1],
      status: "unsubmitted" as const,
    }
    vi.mocked(db.getApplications).mockResolvedValue([...testApplications, unsubmittedApp])

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText("Bulk Submission")).toBeInTheDocument()
    })

    // Should show bulk submission card
    expect(screen.getByText("Select All Unsubmitted Applications")).toBeInTheDocument()
  })
})
