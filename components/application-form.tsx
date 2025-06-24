"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface User {
  id: string
  userType: string
}

interface Application {
  id: string
  applicationId: string
  // ... other properties
}

interface FormData {
  name: string
  email: string
  // ... other form fields
}

interface Db {
  updateApplication: (
    id: string,
    data: {
      name: string
      email: string
      documents: string[]
    },
  ) => Promise<Application | null>
  createApplication: (data: any) => Promise<Application>
  addLog: (log: any) => Promise<void>
}

interface ApplicationFormProps {
  application?: Application
  user: User
  db: Db
  onSave: () => void
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ application, user, db, onSave }) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    // ... other initial form values
  })
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (application) {
      setFormData({
        name: application.name,
        email: application.email,
        // ... populate other form fields from application
      })
      // Assuming application.documents exists
      setUploadedDocuments(application.documents || [])
    }
  }, [application])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleDocumentUpload = (files: FileList | null) => {
    if (files) {
      const newDocuments = Array.from(files).map((file) => file.name) // Just store names for simplicity
      setUploadedDocuments([...uploadedDocuments, ...newDocuments])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("Submitting application with data:", formData) // Add debugging

      if (application) {
        // Update existing application
        const updated = await db.updateApplication(application.id, {
          ...formData,
          documents: uploadedDocuments,
        })
        console.log("Updated application:", updated) // Add debugging

        if (updated) {
          await db.addLog({
            userId: user.id,
            userType: user.userType,
            action: "update_application",
            details: `Updated application ${updated.applicationId}`,
            applicationId: updated.id,
          })
          onSave()
        } else {
          throw new Error("Failed to update application")
        }
      } else {
        // Create new application
        const newApp = await db.createApplication({
          ...formData,
          documents: uploadedDocuments,
          workflowComments: [],
          createdBy: user.id, // Make sure this is set
        })
        console.log("Created new application:", newApp) // Add debugging

        await db.addLog({
          userId: user.id,
          userType: user.userType,
          action: "create_application",
          details: `Created new application ${newApp.applicationId}`,
          applicationId: newApp.id,
        })

        // Force a small delay to ensure database operations complete
        await new Promise((resolve) => setTimeout(resolve, 100))
        onSave()
      }
    } catch (err) {
      console.error("Error saving application:", err) // Add debugging
      setError(err instanceof Error ? err.message : "Failed to save application")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div>
        <label htmlFor="name">Name:</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="email">Email:</label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="documents">Documents:</label>
        <input type="file" id="documents" multiple onChange={(e) => handleDocumentUpload(e.target.files)} />
        <ul>
          {uploadedDocuments.map((doc, index) => (
            <li key={index}>{doc}</li>
          ))}
        </ul>
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save"}
      </button>
    </form>
  )
}

export default ApplicationForm
