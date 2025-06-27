"use client"

import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EnhancedPermitPrinter } from "@/components/enhanced-permit-printer"
import { PermitPreviewDialog } from "@/components/permit-preview-dialog"

// Mock crypto API for digital signatures
const mockCrypto = {
  subtle: {
    generateKey: vi.fn(),
    sign: vi.fn(),
    verify: vi.fn(),
    importKey: vi.fn(),
    exportKey: vi.fn(),
  },
  getRandomValues: vi.fn(),
}

Object.defineProperty(global, "crypto", {
  value: mockCrypto,
  writable: true,
})

// Mock canvas for signature pad
const mockCanvas = {
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    toDataURL: vi.fn(() => "data:image/png;base64,mockSignatureData"),
  })),
  toDataURL: vi.fn(() => "data:image/png;base64,mockSignatureData"),
  width: 400,
  height: 200,
}

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: mockCanvas.getContext,
})

const mockApplication = {
  id: "1",
  applicationId: "APP-2024-001",
  applicantName: "John Doe",
  physicalAddress: "123 Main Street, Harare",
  customerAccountNumber: "ACC-001",
  cellularNumber: "+263771234567",
  permitType: "urban" as const,
  waterSource: "ground_water" as const,
  waterAllocation: 100,
  landSize: 50,
  gpsLatitude: -17.8292,
  gpsLongitude: 31.0522,
  status: "approved" as const,
  currentStage: 4,
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-25"),
  submittedAt: new Date("2024-01-15"),
  approvedAt: new Date("2024-01-25"),
  documents: [],
  comments: [],
  intendedUse: "Domestic water supply",
}

const mockUser = {
  id: "1",
  username: "admin",
  userType: "permitting_officer" as const,
  password: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("Digital Signature Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock successful crypto operations
    mockCrypto.subtle.generateKey.mockResolvedValue({
      privateKey: { type: "private" },
      publicKey: { type: "public" },
    })

    mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(64))
    mockCrypto.subtle.verify.mockResolvedValue(true)
    mockCrypto.getRandomValues.mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    })
  })

  describe("Digital Signature Creation", () => {
    it("should display signature pad for authorized users", async () => {
      render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText("Digital Signature")).toBeInTheDocument()
        expect(screen.getByText("Sign Document")).toBeInTheDocument()
      })

      // Click to open signature pad
      const signButton = screen.getByText("Sign Document")
      await userEvent.click(signButton)

      await waitFor(() => {
        expect(screen.getByText("Digital Signature Pad")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /clear signature/i })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /save signature/i })).toBeInTheDocument()
      })
    })

    it("should capture hand-drawn signatures on canvas", async () => {
      render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      const signButton = screen.getByText("Sign Document")
      await userEvent.click(signButton)

      await waitFor(() => {
        const canvas = screen.getByRole("img", { name: /signature canvas/i })
        expect(canvas).toBeInTheDocument()
      })

      // Simulate drawing on canvas
      const canvas = screen.getByRole("img", { name: /signature canvas/i })

      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 120 })
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 100 })
      fireEvent.mouseUp(canvas)

      // Verify drawing methods were called
      expect(mockCanvas.getContext().beginPath).toHaveBeenCalled()
      expect(mockCanvas.getContext().moveTo).toHaveBeenCalled()
      expect(mockCanvas.getContext().lineTo).toHaveBeenCalled()
      expect(mockCanvas.getContext().stroke).toHaveBeenCalled()
    })

    it("should generate cryptographic signature hash", async () => {
      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const signButton = screen.getByText("Add Digital Signature")
      await userEvent.click(signButton)

      await waitFor(() => {
        const canvas = screen.getByRole("img", { name: /signature canvas/i })
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
        fireEvent.mouseUp(canvas)
      })

      const saveButton = screen.getByText("Save Signature")
      await userEvent.click(saveButton)

      await waitFor(() => {
        // Verify cryptographic operations
        expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
          {
            name: "ECDSA",
            namedCurve: "P-256",
          },
          true,
          ["sign", "verify"],
        )

        expect(mockCrypto.subtle.sign).toHaveBeenCalled()
      })
    })

    it("should include timestamp and user information in signature", async () => {
      render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      const signButton = screen.getByText("Sign Document")
      await userEvent.click(signButton)

      // Draw signature
      const canvas = screen.getByRole("img", { name: /signature canvas/i })
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseUp(canvas)

      const saveButton = screen.getByText("Save Signature")
      await userEvent.click(saveButton)

      await waitFor(() => {
        // Check for signature metadata
        expect(screen.getByText(/Digitally signed by: admin/i)).toBeInTheDocument()
        expect(screen.getByText(/Signature date:/i)).toBeInTheDocument()
        expect(screen.getByText(/User type: permitting_officer/i)).toBeInTheDocument()
      })
    })

    it("should validate signature before saving", async () => {
      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const signButton = screen.getByText("Add Digital Signature")
      await userEvent.click(signButton)

      // Try to save without drawing
      const saveButton = screen.getByText("Save Signature")
      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText("Please draw your signature before saving")).toBeInTheDocument()
      })
    })
  })

  describe("Signature Verification", () => {
    it("should verify signature authenticity", async () => {
      const signedApplication = {
        ...mockApplication,
        digitalSignature: {
          signatureData: "data:image/png;base64,mockSignatureData",
          signatureHash: "mockHashValue",
          signedBy: "admin",
          signedAt: new Date().toISOString(),
          userType: "permitting_officer",
          verified: true,
        },
      }

      render(<PermitPreviewDialog application={signedApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText("✓ Signature Verified")).toBeInTheDocument()
        expect(screen.getByText(/Digitally signed by: admin/i)).toBeInTheDocument()
      })

      // Verify cryptographic verification was called
      expect(mockCrypto.subtle.verify).toHaveBeenCalled()
    })

    it("should detect tampered signatures", async () => {
      mockCrypto.subtle.verify.mockResolvedValue(false)

      const tamperedApplication = {
        ...mockApplication,
        digitalSignature: {
          signatureData: "data:image/png;base64,tamperedData",
          signatureHash: "tamperedHash",
          signedBy: "admin",
          signedAt: new Date().toISOString(),
          userType: "permitting_officer",
          verified: false,
        },
      }

      render(<PermitPreviewDialog application={tamperedApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText("⚠ Signature Invalid")).toBeInTheDocument()
        expect(screen.getByText("This signature could not be verified")).toBeInTheDocument()
      })
    })

    it("should show signature chain for multiple signers", async () => {
      const multiSignedApplication = {
        ...mockApplication,
        digitalSignatures: [
          {
            signatureData: "data:image/png;base64,signature1",
            signatureHash: "hash1",
            signedBy: "technical_reviewer",
            signedAt: new Date("2024-01-20").toISOString(),
            userType: "technical_reviewer",
            verified: true,
          },
          {
            signatureData: "data:image/png;base64,signature2",
            signatureHash: "hash2",
            signedBy: "catchment_manager",
            signedAt: new Date("2024-01-22").toISOString(),
            userType: "catchment_manager",
            verified: true,
          },
          {
            signatureData: "data:image/png;base64,signature3",
            signatureHash: "hash3",
            signedBy: "permitting_officer",
            signedAt: new Date("2024-01-25").toISOString(),
            userType: "permitting_officer",
            verified: true,
          },
        ],
      }

      render(
        <PermitPreviewDialog application={multiSignedApplication} user={mockUser} isOpen={true} onClose={() => {}} />,
      )

      await waitFor(() => {
        expect(screen.getByText("Signature Chain")).toBeInTheDocument()
        expect(screen.getByText("technical_reviewer")).toBeInTheDocument()
        expect(screen.getByText("catchment_manager")).toBeInTheDocument()
        expect(screen.getByText("permitting_officer")).toBeInTheDocument()

        // Check chronological order
        const signatures = screen.getAllByText(/✓ Verified/i)
        expect(signatures).toHaveLength(3)
      })
    })
  })

  describe("Signature Security", () => {
    it("should use secure key generation", async () => {
      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const signButton = screen.getByText("Add Digital Signature")
      await userEvent.click(signButton)

      await waitFor(() => {
        expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
          {
            name: "ECDSA",
            namedCurve: "P-256",
          },
          true,
          ["sign", "verify"],
        )
      })
    })

    it("should prevent signature replay attacks", async () => {
      const timestampSpy = vi.spyOn(Date, "now").mockReturnValue(1640995200000) // Fixed timestamp

      render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      const signButton = screen.getByText("Sign Document")
      await userEvent.click(signButton)

      // Draw signature
      const canvas = screen.getByRole("img", { name: /signature canvas/i })
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseUp(canvas)

      const saveButton = screen.getByText("Save Signature")
      await userEvent.click(saveButton)

      await waitFor(() => {
        // Verify timestamp is included in signature data
        const signCall = mockCrypto.subtle.sign.mock.calls[0]
        const signedData = new TextDecoder().decode(signCall[1])
        expect(signedData).toContain("1640995200000")
      })

      timestampSpy.mockRestore()
    })

    it("should validate user permissions before signing", async () => {
      const unauthorizedUser = {
        ...mockUser,
        userType: "applicant" as const,
      }

      render(
        <PermitPreviewDialog application={mockApplication} user={unauthorizedUser} isOpen={true} onClose={() => {}} />,
      )

      await waitFor(() => {
        expect(screen.queryByText("Sign Document")).not.toBeInTheDocument()
        expect(screen.getByText("You do not have permission to sign this document")).toBeInTheDocument()
      })
    })

    it("should encrypt signature data", async () => {
      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const signButton = screen.getByText("Add Digital Signature")
      await userEvent.click(signButton)

      // Draw signature
      const canvas = screen.getByRole("img", { name: /signature canvas/i })
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseUp(canvas)

      const saveButton = screen.getByText("Save Signature")
      await userEvent.click(saveButton)

      await waitFor(() => {
        // Verify encryption methods are called
        expect(mockCrypto.subtle.sign).toHaveBeenCalled()

        // Check that raw signature data is not stored in plain text
        const signatureElements = document.querySelectorAll("[data-signature-raw]")
        expect(signatureElements).toHaveLength(0)
      })
    })
  })

  describe("Signature UI/UX", () => {
    it("should provide clear signature instructions", async () => {
      render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      const signButton = screen.getByText("Sign Document")
      await userEvent.click(signButton)

      await waitFor(() => {
        expect(screen.getByText("Please sign in the box below")).toBeInTheDocument()
        expect(screen.getByText("Use your mouse or touch to draw your signature")).toBeInTheDocument()
        expect(screen.getByText("Click 'Clear' to start over")).toBeInTheDocument()
      })
    })

    it("should allow signature clearing and redrawing", async () => {
      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const signButton = screen.getByText("Add Digital Signature")
      await userEvent.click(signButton)

      // Draw signature
      const canvas = screen.getByRole("img", { name: /signature canvas/i })
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseUp(canvas)

      // Clear signature
      const clearButton = screen.getByText("Clear Signature")
      await userEvent.click(clearButton)

      expect(mockCanvas.getContext().clearRect).toHaveBeenCalled()

      // Draw new signature
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 })
      fireEvent.mouseUp(canvas)

      expect(mockCanvas.getContext().beginPath).toHaveBeenCalledTimes(2)
    })

    it("should show signature preview before saving", async () => {
      render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      const signButton = screen.getByText("Sign Document")
      await userEvent.click(signButton)

      // Draw signature
      const canvas = screen.getByRole("img", { name: /signature canvas/i })
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseUp(canvas)

      await waitFor(() => {
        expect(screen.getByText("Signature Preview")).toBeInTheDocument()

        // Check for preview image
        const previewImage = screen.getByAltText("Signature preview")
        expect(previewImage).toBeInTheDocument()
        expect(previewImage).toHaveAttribute("src", "data:image/png;base64,mockSignatureData")
      })
    })

    it("should support touch devices for signature input", async () => {
      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const signButton = screen.getByText("Add Digital Signature")
      await userEvent.click(signButton)

      const canvas = screen.getByRole("img", { name: /signature canvas/i })

      // Simulate touch events
      fireEvent.touchStart(canvas, {
        touches: [{ clientX: 100, clientY: 100 }],
      })

      fireEvent.touchMove(canvas, {
        touches: [{ clientX: 150, clientY: 120 }],
      })

      fireEvent.touchEnd(canvas)

      // Verify touch handling
      expect(mockCanvas.getContext().beginPath).toHaveBeenCalled()
      expect(mockCanvas.getContext().moveTo).toHaveBeenCalledWith(100, 100)
      expect(mockCanvas.getContext().lineTo).toHaveBeenCalledWith(150, 120)
    })
  })

  describe("Error Handling", () => {
    it("should handle crypto API failures gracefully", async () => {
      mockCrypto.subtle.generateKey.mockRejectedValue(new Error("Crypto not supported"))

      render(<PermitPreviewDialog application={mockApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      const signButton = screen.getByText("Sign Document")
      await userEvent.click(signButton)

      await waitFor(() => {
        expect(screen.getByText("Digital signature not supported in this browser")).toBeInTheDocument()
        expect(screen.getByText("Please use a modern browser with crypto support")).toBeInTheDocument()
      })
    })

    it("should handle canvas rendering failures", async () => {
      mockCanvas.getContext.mockReturnValue(null)

      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const signButton = screen.getByText("Add Digital Signature")
      await userEvent.click(signButton)

      await waitFor(() => {
        expect(screen.getByText("Signature pad could not be initialized")).toBeInTheDocument()
        expect(screen.getByText("Please try refreshing the page")).toBeInTheDocument()
      })
    })

    it("should handle network failures during signature verification", async () => {
      mockCrypto.subtle.verify.mockRejectedValue(new Error("Network error"))

      const signedApplication = {
        ...mockApplication,
        digitalSignature: {
          signatureData: "data:image/png;base64,mockSignatureData",
          signatureHash: "mockHashValue",
          signedBy: "admin",
          signedAt: new Date().toISOString(),
          userType: "permitting_officer",
          verified: false,
        },
      }

      render(<PermitPreviewDialog application={signedApplication} user={mockUser} isOpen={true} onClose={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText("⚠ Signature Verification Failed")).toBeInTheDocument()
        expect(screen.getByText("Unable to verify signature due to network error")).toBeInTheDocument()
      })
    })
  })

  describe("Performance", () => {
    it("should generate signatures efficiently", async () => {
      const startTime = performance.now()

      render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

      const signButton = screen.getByText("Add Digital Signature")
      await userEvent.click(signButton)

      // Draw signature
      const canvas = screen.getByRole("img", { name: /signature canvas/i })
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseUp(canvas)

      const saveButton = screen.getByText("Save Signature")
      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/Signature saved successfully/i)).toBeInTheDocument()
      })

      const endTime = performance.now()
      const signatureTime = endTime - startTime

      // Should complete signature process within reasonable time (less than 1 second)
      expect(signatureTime).toBeLessThan(1000)
    })

    it("should handle multiple signatures without memory leaks", async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      for (let i = 0; i < 5; i++) {
        render(<EnhancedPermitPrinter application={mockApplication} user={mockUser} />)

        const signButton = screen.getByText("Add Digital Signature")
        await userEvent.click(signButton)

        const canvas = screen.getByRole("img", { name: /signature canvas/i })
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
        fireEvent.mouseUp(canvas)

        const saveButton = screen.getByText("Save Signature")
        await userEvent.click(saveButton)

        await waitFor(() => {
          expect(screen.getByText(/Signature saved successfully/i)).toBeInTheDocument()
        })
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 5MB)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024)
    })
  })
})
