"use server"

import nodemailer from "nodemailer"
import type { PermitApplication } from "@/types"

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  // Send email
  static async sendEmail(to: string | string[], subject: string, html: string, text?: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@umscc.co.zw",
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html,
        text: text || this.htmlToText(html),
      })
      return true
    } catch (error) {
      console.error("Email send error:", error)
      return false
    }
  }

  // Application submitted notification
  static async notifyApplicationSubmitted(application: PermitApplication): Promise<boolean> {
    const template = this.getApplicationSubmittedTemplate(application)

    // Send to chairperson (next in workflow)
    const chairpersonEmail = "chairperson@umscc.co.zw"

    return this.sendEmail(chairpersonEmail, template.subject, template.html, template.text)
  }

  // Application approved notification
  static async notifyApplicationApproved(application: PermitApplication): Promise<boolean> {
    const template = this.getApplicationApprovedTemplate(application)

    // Send to applicant (if email available) and permitting officer
    const recipients = ["permitting@umscc.co.zw"]

    return this.sendEmail(recipients, template.subject, template.html, template.text)
  }

  // Application rejected notification
  static async notifyApplicationRejected(application: PermitApplication, reason: string): Promise<boolean> {
    const template = this.getApplicationRejectedTemplate(application, reason)

    // Send to applicant (if email available) and permitting officer
    const recipients = ["permitting@umscc.co.zw"]

    return this.sendEmail(recipients, template.subject, template.html, template.text)
  }

  // Workflow stage notification
  static async notifyWorkflowStage(application: PermitApplication, nextStage: number): Promise<boolean> {
    const template = this.getWorkflowStageTemplate(application, nextStage)

    const stageEmails = {
      2: "chairperson@umscc.co.zw",
      3: "manager@manyame.co.zw",
      4: "catchment.chair@manyame.co.zw",
    }

    const recipient = stageEmails[nextStage as keyof typeof stageEmails]
    if (!recipient) return false

    return this.sendEmail(recipient, template.subject, template.html, template.text)
  }

  // System alert notification
  static async sendSystemAlert(
    subject: string,
    message: string,
    severity: "info" | "warning" | "error" = "info",
  ): Promise<boolean> {
    const template = this.getSystemAlertTemplate(subject, message, severity)

    // Send to ICT admin
    const ictEmail = "ict@umscc.co.zw"

    return this.sendEmail(ictEmail, template.subject, template.html, template.text)
  }

  // Email templates
  private static getApplicationSubmittedTemplate(application: PermitApplication): EmailTemplate {
    return {
      subject: `New Permit Application Submitted - ${application.applicationId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>Upper Manyame Sub Catchment Council</h1>
            <h2>New Permit Application</h2>
          </div>
          
          <div style="padding: 20px; background-color: #f8fafc;">
            <h3>Application Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Application ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${application.applicationId}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Applicant:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${application.applicantName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Permit Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${application.permitType}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Water Source:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${application.waterSource}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Submitted:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date().toLocaleDateString()}</td></tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #dbeafe; border-left: 4px solid #3b82f6;">
              <p><strong>Action Required:</strong> This application is now pending your review. Please log into the system to review and process this application.</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Access System</a>
            </div>
          </div>
          
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>Upper Manyame Sub Catchment Council - Permit Management System</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      `,
      text: `New Permit Application Submitted - ${application.applicationId}\n\nApplicant: ${application.applicantName}\nPermit Type: ${application.permitType}\nWater Source: ${application.waterSource}\n\nPlease log into the system to review this application.`,
    }
  }

  private static getApplicationApprovedTemplate(application: PermitApplication): EmailTemplate {
    return {
      subject: `Permit Application Approved - ${application.applicationId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
            <h1>Upper Manyame Sub Catchment Council</h1>
            <h2>✅ Application Approved</h2>
          </div>
          
          <div style="padding: 20px; background-color: #f8fafc;">
            <div style="margin-bottom: 20px; padding: 15px; background-color: #d1fae5; border-left: 4px solid #10b981;">
              <p><strong>Good News!</strong> The permit application ${application.applicationId} has been approved.</p>
            </div>
            
            <h3>Application Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Application ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${application.applicationId}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Applicant:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${application.applicantName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Water Allocation:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${application.waterAllocation} ML</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Approved:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date().toLocaleDateString()}</td></tr>
            </table>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Print Permit</a>
            </div>
          </div>
          
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>Upper Manyame Sub Catchment Council - Permit Management System</p>
          </div>
        </div>
      `,
      text: `Permit Application Approved - ${application.applicationId}\n\nApplicant: ${application.applicantName}\nWater Allocation: ${application.waterAllocation} ML\n\nThe permit is now ready for printing.`,
    }
  }

  private static getApplicationRejectedTemplate(application: PermitApplication, reason: string): EmailTemplate {
    return {
      subject: `Permit Application Rejected - ${application.applicationId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1>Upper Manyame Sub Catchment Council</h1>
            <h2>❌ Application Rejected</h2>
          </div>
          
          <div style="padding: 20px; background-color: #f8fafc;">
            <div style="margin-bottom: 20px; padding: 15px; background-color: #fee2e2; border-left: 4px solid #ef4444;">
              <p><strong>Application Status:</strong> The permit application ${application.applicationId} has been rejected.</p>
            </div>
            
            <h3>Rejection Reason</h3>
            <div style="padding: 15px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
              <p>${reason}</p>
            </div>
            
            <h3>Application Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Application ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${application.applicationId}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Applicant:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${application.applicantName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Rejected:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date().toLocaleDateString()}</td></tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #fffbeb; border-left: 4px solid #f59e0b;">
              <p><strong>Next Steps:</strong> You may submit a new application addressing the concerns mentioned above.</p>
            </div>
          </div>
          
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>Upper Manyame Sub Catchment Council - Permit Management System</p>
          </div>
        </div>
      `,
      text: `Permit Application Rejected - ${application.applicationId}\n\nApplicant: ${application.applicantName}\nReason: ${reason}\n\nYou may submit a new application addressing these concerns.`,
    }
  }

  private static getWorkflowStageTemplate(application: PermitApplication, stage: number): EmailTemplate {
    const stageNames = {
      2: "Upper Manyame Sub Catchment Council Chairperson",
      3: "Manyame Catchment Manager",
      4: "Manyame Catchment Chairperson",
    }

    const stageName = stageNames[stage as keyof typeof stageNames] || `Stage ${stage}`

    return {
      subject: `Application Pending Review - ${application.applicationId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>Upper Manyame Sub Catchment Council</h1>
            <h2>Application Pending Review</h2>
          </div>
          
          <div style="padding: 20px; background-color: #f8fafc;">
            <div style="margin-bottom: 20px; padding: 15px; background-color: #dbeafe; border-left: 4px solid #3b82f6;">
              <p><strong>Action Required:</strong> Application ${application.applicationId} is now pending your review as ${stageName}.</p>
            </div>
            
            <h3>Application Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Application ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${application.applicationId}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Applicant:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${application.applicantName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Current Stage:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${stageName}</td></tr>
            </table>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review Application</a>
            </div>
          </div>
          
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>Upper Manyame Sub Catchment Council - Permit Management System</p>
          </div>
        </div>
      `,
      text: `Application Pending Review - ${application.applicationId}\n\nApplicant: ${application.applicantName}\nCurrent Stage: ${stageName}\n\nPlease log into the system to review this application.`,
    }
  }

  private static getSystemAlertTemplate(
    subject: string,
    message: string,
    severity: "info" | "warning" | "error",
  ): EmailTemplate {
    const colors = {
      info: { bg: "#dbeafe", border: "#3b82f6", icon: "ℹ️" },
      warning: { bg: "#fef3c7", border: "#f59e0b", icon: "⚠️" },
      error: { bg: "#fee2e2", border: "#ef4444", icon: "🚨" },
    }

    const color = colors[severity]

    return {
      subject: `[UMSCC System] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #374151; color: white; padding: 20px; text-align: center;">
            <h1>UMSCC System Alert</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f8fafc;">
            <div style="margin-bottom: 20px; padding: 15px; background-color: ${color.bg}; border-left: 4px solid ${color.border};">
              <p><strong>${color.icon} ${subject}</strong></p>
            </div>
            
            <div style="padding: 15px; background-color: white; border: 1px solid #e2e8f0; border-radius: 6px;">
              <p>${message}</p>
            </div>
            
            <div style="margin-top: 20px; font-size: 12px; color: #6b7280;">
              <p>Timestamp: ${new Date().toLocaleString()}</p>
              <p>Severity: ${severity.toUpperCase()}</p>
            </div>
          </div>
          
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>Upper Manyame Sub Catchment Council - System Monitoring</p>
          </div>
        </div>
      `,
      text: `[UMSCC System] ${subject}\n\n${message}\n\nTimestamp: ${new Date().toLocaleString()}\nSeverity: ${severity.toUpperCase()}`,
    }
  }

  // Convert HTML to plain text
  private static htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim()
  }
}
