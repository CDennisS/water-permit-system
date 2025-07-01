import type { UserType, ApplicationStatus, WorkflowStage } from "@/types"

// User Types and Roles
export const USER_TYPES = {
  APPLICANT: "applicant" as const,
  PERMITTING_OFFICER: "permitting_officer" as const,
  PERMIT_SUPERVISOR: "permit_supervisor" as const,
  CHAIRPERSON: "chairperson" as const,
  CATCHMENT_MANAGER: "catchment_manager" as const,
  CATCHMENT_CHAIRPERSON: "catchment_chairperson" as const,
  ICT: "ict" as const,
} as const

export const USER_TYPE_LABELS: Record<UserType, string> = {
  applicant: "Applicant",
  permitting_officer: "Permitting Officer",
  permit_supervisor: "Permit Supervisor",
  chairperson: "Upper Manyame Sub Catchment Council Chairperson",
  catchment_manager: "Manyame Catchment Manager",
  catchment_chairperson: "Manyame Catchment Chairperson",
  ict: "ICT Administrator",
}

// Application Status
export const APPLICATION_STATUS = {
  DRAFT: "draft" as const,
  SUBMITTED: "submitted" as const,
  PENDING: "pending" as const,
  UNDER_REVIEW: "under_review" as const,
  TECHNICAL_REVIEW: "technical_review" as const,
  APPROVED: "approved" as const,
  REJECTED: "rejected" as const,
  PERMIT_ISSUED: "permit_issued" as const,
} as const

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  pending: "Pending Review",
  under_review: "Under Review",
  technical_review: "Technical Review",
  approved: "Approved",
  rejected: "Rejected",
  permit_issued: "Permit Issued",
}

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-orange-100 text-orange-800",
  technical_review: "bg-purple-100 text-purple-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  permit_issued: "bg-emerald-100 text-emerald-800",
}

// Workflow Stages
export const WORKFLOW_STAGES = {
  APPLICATION_SUBMITTED: "application_submitted" as const,
  TECHNICAL_REVIEW: "technical_review" as const,
  SUPERVISOR_REVIEW: "supervisor_review" as const,
  MANAGER_APPROVAL: "manager_approval" as const,
  CHAIRPERSON_APPROVAL: "chairperson_approval" as const,
  PERMIT_ISSUED: "permit_issued" as const,
  REJECTED: "rejected" as const,
} as const

export const WORKFLOW_STAGE_LABELS: Record<WorkflowStage, string> = {
  application_submitted: "Application Submitted",
  technical_review: "Technical Review",
  supervisor_review: "Supervisor Review",
  manager_approval: "Manager Approval",
  chairperson_approval: "Chairperson Approval",
  permit_issued: "Permit Issued",
  rejected: "Rejected",
}

// Permit Types
export const PERMIT_TYPES = {
  WATER_EXTRACTION: "water_extraction",
  BOREHOLE_DRILLING: "borehole_drilling",
  SURFACE_WATER: "surface_water",
  GROUNDWATER: "groundwater",
  INDUSTRIAL_USE: "industrial_use",
  COMMERCIAL_USE: "commercial_use",
  DOMESTIC_USE: "domestic_use",
  AGRICULTURAL_USE: "agricultural_use",
} as const

export const PERMIT_TYPE_LABELS = {
  water_extraction: "Water Extraction",
  borehole_drilling: "Borehole Drilling",
  surface_water: "Surface Water Use",
  groundwater: "Groundwater Extraction",
  industrial_use: "Industrial Water Use",
  commercial_use: "Commercial Water Use",
  domestic_use: "Domestic Water Use",
  agricultural_use: "Agricultural Water Use",
} as const

// Water Sources
export const WATER_SOURCES = {
  BOREHOLE: "borehole",
  SURFACE_WATER: "surface_water",
  RIVER: "river",
  STREAM: "stream",
  DAM: "dam",
  SPRING: "spring",
  WELL: "well",
  OTHER: "other",
} as const

export const WATER_SOURCE_LABELS = {
  borehole: "Borehole",
  surface_water: "Surface Water",
  river: "River",
  stream: "Stream",
  dam: "Dam",
  spring: "Spring",
  well: "Well",
  other: "Other",
} as const

// Document Types
export const DOCUMENT_TYPES = {
  APPLICATION_FORM: "application_form",
  SITE_PLAN: "site_plan",
  WATER_IMPACT_ASSESSMENT: "water_impact_assessment",
  ENVIRONMENTAL_CLEARANCE: "environmental_clearance",
  PROOF_OF_OWNERSHIP: "proof_of_ownership",
  TECHNICAL_DRAWINGS: "technical_drawings",
  WATER_QUALITY_REPORT: "water_quality_report",
  BUSINESS_LICENSE: "business_license",
  OTHER: "other",
} as const

export const DOCUMENT_TYPE_LABELS = {
  application_form: "Application Form",
  site_plan: "Site Plan",
  water_impact_assessment: "Water Impact Assessment",
  environmental_clearance: "Environmental Clearance Certificate",
  proof_of_ownership: "Proof of Land Ownership",
  technical_drawings: "Technical Drawings",
  water_quality_report: "Water Quality Report",
  business_license: "Business License",
  other: "Other Documents",
} as const

// Required documents by permit type
export const REQUIRED_DOCUMENTS = {
  water_extraction: ["application_form", "site_plan", "water_impact_assessment", "proof_of_ownership"],
  borehole_drilling: [
    "application_form",
    "site_plan",
    "technical_drawings",
    "environmental_clearance",
    "proof_of_ownership",
  ],
  industrial_use: [
    "application_form",
    "site_plan",
    "water_impact_assessment",
    "environmental_clearance",
    "business_license",
    "water_quality_report",
  ],
} as const

// File Upload Configuration
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/gif",
  ],
  ALLOWED_EXTENSIONS: ["pdf", "doc", "docx", "jpg", "jpeg", "png", "gif"],
} as const

// System Messages
export const MESSAGES = {
  SUCCESS: {
    APPLICATION_SUBMITTED: "Application submitted successfully",
    APPLICATION_UPDATED: "Application updated successfully",
    APPLICATION_APPROVED: "Application approved successfully",
    APPLICATION_REJECTED: "Application rejected",
    DOCUMENT_UPLOADED: "Document uploaded successfully",
    COMMENT_ADDED: "Comment added successfully",
    USER_CREATED: "User created successfully",
    USER_UPDATED: "User updated successfully",
    PERMIT_PRINTED: "Permit printed successfully",
  },
  ERROR: {
    APPLICATION_NOT_FOUND: "Application not found",
    UNAUTHORIZED: "You are not authorized to perform this action",
    INVALID_FILE_TYPE: "Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files",
    FILE_TOO_LARGE: "File size exceeds maximum limit of 10MB",
    REQUIRED_FIELD: "This field is required",
    INVALID_EMAIL: "Please enter a valid email address",
    INVALID_PHONE: "Please enter a valid phone number",
    NETWORK_ERROR: "Network error. Please try again",
    SERVER_ERROR: "Server error. Please contact support",
  },
  INFO: {
    LOADING: "Loading...",
    SAVING: "Saving...",
    UPLOADING: "Uploading...",
    PROCESSING: "Processing...",
    NO_DATA: "No data available",
    EMPTY_STATE: "No items found",
  },
} as const

// API Endpoints
export const API_ENDPOINTS = {
  APPLICATIONS: "/api/applications",
  DOCUMENTS: "/api/documents",
  COMMENTS: "/api/comments",
  USERS: "/api/users",
  AUTH: "/api/auth",
  REPORTS: "/api/reports",
  NOTIFICATIONS: "/api/notifications",
  UPLOAD: "/api/upload",
} as const

// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+263|0)[0-9]{9}$/,
  PERMIT_NUMBER: /^MC\d{4}-\d{4}$/,
  APPLICATION_ID: /^(MC|DRAFT-)\d{4}-\d{4}$/,
  GPS_COORDINATE: /^-?\d{1,3}\.\d{1,6}$/,
} as const

// Chart Colors for Analytics
export const CHART_COLORS = {
  PRIMARY: "#2563eb",
  SECONDARY: "#7c3aed",
  SUCCESS: "#059669",
  WARNING: "#d97706",
  ERROR: "#dc2626",
  INFO: "#0891b2",
  GRAY: "#6b7280",
} as const

// Dashboard Configuration
export const DASHBOARD_CONFIG = {
  REFRESH_INTERVAL: 30000, // 30 seconds
  ITEMS_PER_PAGE: 10,
  MAX_RECENT_ACTIVITIES: 5,
  CHART_ANIMATION_DURATION: 300,
} as const

// Notification Types
export const NOTIFICATION_TYPES = {
  APPLICATION_SUBMITTED: "application_submitted",
  APPLICATION_APPROVED: "application_approved",
  APPLICATION_REJECTED: "application_rejected",
  COMMENT_ADDED: "comment_added",
  DOCUMENT_UPLOADED: "document_uploaded",
  PERMIT_READY: "permit_ready",
  SYSTEM_MAINTENANCE: "system_maintenance",
} as const

// Export all constants
export const CONSTANTS = {
  USER_TYPES,
  USER_TYPE_LABELS,
  APPLICATION_STATUS,
  STATUS_LABELS,
  STATUS_COLORS,
  WORKFLOW_STAGES,
  WORKFLOW_STAGE_LABELS,
  PERMIT_TYPES,
  PERMIT_TYPE_LABELS,
  WATER_SOURCES,
  WATER_SOURCE_LABELS,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  REQUIRED_DOCUMENTS,
  FILE_UPLOAD,
  MESSAGES,
  API_ENDPOINTS,
  VALIDATION_PATTERNS,
  CHART_COLORS,
  DASHBOARD_CONFIG,
  NOTIFICATION_TYPES,
} as const
