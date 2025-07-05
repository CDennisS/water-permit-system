"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import type { Application } from "@/types"
import { FileText, MessageSquare, User } from "lucide-react"

interface ApplicationDetailsProps {
  application: Application
  onClose: () => void
}

export function ApplicationDetails({ application, onClose }: ApplicationDetailsProps) {
  const [isReviewed, setIsReviewed] = useState(application.isReviewedByChairperson)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log(`Saving review status for application ${application.id}: ${isReviewed}`)
    toast.success("Review Status Saved", {
      description: `Application for ${application.applicantName} has been updated.`,
    })
    setIsSaving(false)
    onClose()
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">{application.applicantName}</h3>
            <p className="text-sm text-muted-foreground">{application.permitType}</p>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Application Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-muted-foreground">Company:</p>
              <p>{application.details.company}</p>
              <p className="text-muted-foreground">Address:</p>
              <p>{application.details.address}</p>
              <p className="text-muted-foreground">Contact:</p>
              <p>{application.details.contact}</p>
              <p className="text-muted-foreground">Submitted:</p>
              <p>{application.dateSubmitted}</p>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Uploaded Documents
            </h4>
            <ul className="space-y-2">
              {application.documents.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center"
                  >
                    {doc.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              Permitting Officer Comments
            </h4>
            <div className="space-y-4">
              {application.comments.map((comment) => (
                <div key={comment.id} className="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {comment.author}
                    </p>
                    <p className="text-xs text-muted-foreground">{comment.createdAt}</p>
                  </div>
                  <p className="text-muted-foreground">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="p-6 border-t bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reviewed"
              checked={isReviewed}
              onCheckedChange={(checked) => setIsReviewed(checked as boolean)}
            />
            <Label htmlFor="reviewed" className="font-semibold">
              Application Reviewed
            </Label>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save & Close"}
          </Button>
        </div>
      </div>
    </div>
  )
}
