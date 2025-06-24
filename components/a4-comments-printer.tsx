"use client"

import { useEffect, useState } from "react"
import type { PermitApplication, WorkflowComment } from "@/types"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { db } from "@/lib/database"

interface A4CommentsPrinterProps {
  application: PermitApplication
}

export function A4CommentsPrinter({ application }: A4CommentsPrinterProps) {
  const [comments, setComments] = useState<WorkflowComment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadComments = async () => {
      try {
        const applicationComments = await db.getCommentsByApplication(application.id)
        setComments(applicationComments)
      } catch (error) {
        console.error("Error loading comments:", error)
      } finally {
        setLoading(false)
      }
    }

    loadComments()
  }, [application.id])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return <div className="p-4">Loading comments...</div>
  }

  return (
    <div className="space-y-4">
      {/* Print Button - Hidden during print */}
      <div className="print:hidden flex justify-end">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Comments
        </Button>
      </div>

      {/* A4 Optimized Comments Page */}
      <div className="bg-white p-8 min-h-[297mm] w-[210mm] mx-auto shadow-lg print:shadow-none print:m-0">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-300 pb-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">APPLICATION REVIEW COMMENTS</h1>
          <p className="text-lg text-gray-600">Upper Manyame Sub-Catchment Council</p>
          <div className="mt-4 text-sm text-gray-500">
            Generated on:{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {/* Applicant Details Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Applicant Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Application ID:</span> {application.applicationId}
            </div>
            <div>
              <span className="font-semibold">Status:</span>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  application.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : application.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : application.status === "under_review"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {application.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <div>
              <span className="font-semibold">Applicant Name:</span> {application.applicantName}
            </div>
            <div>
              <span className="font-semibold">Contact Number:</span> {application.cellularNumber}
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Physical Address:</span> {application.physicalAddress}
            </div>
            <div>
              <span className="font-semibold">Water Allocation:</span> {application.waterAllocation} liters/day
            </div>
            <div>
              <span className="font-semibold">Permit Type:</span> {application.permitType}
            </div>
            <div>
              <span className="font-semibold">Submitted Date:</span>{" "}
              {application.submittedAt
                ? new Date(application.submittedAt).toLocaleDateString("en-GB")
                : "Not submitted"}
            </div>
            <div>
              <span className="font-semibold">Approved Date:</span>{" "}
              {application.approvedAt ? new Date(application.approvedAt).toLocaleDateString("en-GB") : "Not approved"}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Review Comments</h2>

          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No comments available for this application.</div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment, index) => (
                <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        #{index + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {comment.userType.replace("_", " ").toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Stage {comment.stage} • {comment.action.replace("_", " ").toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                    <p className="text-gray-700 leading-relaxed">{comment.comment || "No comment provided"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Upper Manyame Sub-Catchment Council</p>
          <p>Water Permit Management System</p>
          <p className="mt-2">This document contains confidential information and is intended for official use only.</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:m-0 {
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
