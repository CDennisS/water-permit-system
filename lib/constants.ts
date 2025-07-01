/**
 * Application Constants
 *
 * Centralized constants for the UMSCC Permit Management System.
 * This file contains all static values used throughout the application.
 */

// User Types and Roles
export const USER_TYPES = {
  APPLICANT: "applicant",
  PERMITTING_OFFICER: "permitting_officer",
  PERMIT_SUPERVISOR: "permit_supervisor",
  CHAIRPERSON: "chairperson",
  CATCHMENT_MANAGER: "catchment_manager",
  CATCHMENT_CHAIRPERSON: "catchment_chairperson",
  ICT_ADMIN: "ict_admin",
  SYSTEM_ADMIN: "system_admin",
} as const

export const USER_ROLES = {
  [USER_TYPES.APPLICANT]: {
    label: "Applicant",
    description: "Water permit applicant",
    permissions: ["view_own_applications", "submit_applications", "upload_documents"],
  },
  [USER_TYPES.PERMITTING_OFFICER]: {
    label: "Permitting Officer",
    description: "Reviews and processes permit applications",
    permissions: ["view_applications", "review_applications", "request_documents", "send_messages"],
  },
  [USER_TYPES.PERMIT_SUPERVISOR]: {
    label: "Permit Supervisor",
    description: "Supervises permit approval process",
    permissions: ["approve_permits", "reject_permits", "view_all_applications", "generate_reports"],
  },
  [USER_TYPES.CHAIRPERSON]: {
    label: "Chairperson",
    description: "Final approval authority for permits",
    permissions: ["final_approval", "view_all_data", "system_configuration", "user_management"],
  },
  [USER_TYPES.CATCHMENT_MANAGER]: {
    label: "Catchment Manager",
    description: "Manages catchment area operations",
    permissions: ["manage_catchment", "view_catchment_data", "generate_catchment_reports"],
  },
  [USER_TYPES.CATCHMENT_CHAIRPERSON]: {
    label: "Catchment Chairperson",
    description: "Leads catchment area governance",
    permissions: ["catchment_oversight", "approve_catchment_permits", "manage_catchment_users"],
  },
  [USER_TYPES.ICT_ADMIN]: {
    label: "ICT Administrator",
    description: "Manages system technical aspects",
    permissions: ["system_maintenance", "user_support", "data_backup", "system_monitoring"],
  },
  [USER_TYPES.SYSTEM_ADMIN]: {
    label: "System Administrator",
    description: "Full system administration rights",
    permissions: ["full_access", "system_configuration", "user_management", "data_management"],
  },
} as const

// Application Status Types
export const APPLICATION_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  PENDING_DOCUMENTS: "pending_documents",
  TECHNICAL_REVIEW: "technical_review",
  SUPERVISOR_REVIEW: "supervisor_review",
  CHAIRPERSON_REVIEW: "chairperson_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const

export const STATUS_COLORS = {
  [APPLICATION_STATUS.DRAFT]: "bg-gray-100 text-gray-800",
  [APPLICATION_STATUS.SUBMITTED]: "bg-blue-100 text-blue-800",
  [APPLICATION_STATUS.UNDER_REVIEW]: "bg-yellow-100 text-yellow-800",
  [APPLICATION_STATUS.PENDING_DOCUMENTS]: "bg-orange-100 text-orange-800",
  [APPLICATION_STATUS.TECHNICAL_REVIEW]: "bg-purple-100 text-purple-800",
  [APPLICATION_STATUS.SUPERVISOR_REVIEW]: "bg-indigo-100 text-indigo-800",
  [APPLICATION_STATUS.CHAIRPERSON_REVIEW]: "bg-pink-100 text-pink-800",
  [APPLICATION_STATUS.APPROVED]: "bg-green-100 text-green-800",
  [APPLICATION_STATUS.REJECTED]: "bg-red-100 text-red-800",
  [APPLICATION_STATUS.CANCELLED]: "bg-gray-100 text-gray-800",
  [APPLICATION_STATUS.EXPIRED]: "bg-red-100 text-red-800",
} as const

export const STATUS_LABELS = {
  [APPLICATION_STATUS.DRAFT]: "Draft",
  [APPLICATION_STATUS.SUBMITTED]: "Submitted",
  [APPLICATION_STATUS.UNDER_REVIEW]: "Under Review",
  [APPLICATION_STATUS.PENDING_DOCUMENTS]: "Pending Documents",
  [APPLICATION_STATUS.TECHNICAL_REVIEW]: "Technical Review",
  [APPLICATION_STATUS.SUPERVISOR_REVIEW]: "Supervisor Review",
  [APPLICATION_STATUS.CHAIRPERSON_REVIEW]: "Chairperson Review",
  [APPLICATION_STATUS.APPROVED]: "Approved",
  [APPLICATION_STATUS.REJECTED]: "Rejected",
  [APPLICATION_STATUS.CANCELLED]: "Cancelled",
  [APPLICATION_STATUS.EXPIRED]: "Expired",
} as const

// Permit Types
export const PERMIT_TYPES = {
  BOREHOLE: "borehole",
  SURFACE_WATER: "surface_water",
  GROUNDWATER: "groundwater",
  INDUSTRIAL: "industrial",
  DOMESTIC: "domestic",
  IRRIGATION: "irrigation",
  COMMERCIAL: "commercial",
  MUNICIPAL: "municipal",
} as const

export const PERMIT_TYPE_LABELS = {
  [PERMIT_TYPES.BOREHOLE]: "Borehole Permit",
  [PERMIT_TYPES.SURFACE_WATER]: "Surface Water Permit",
  [PERMIT_TYPES.GROUNDWATER]: "Groundwater Permit",
  [PERMIT_TYPES.INDUSTRIAL]: "Industrial Water Permit",
  [PERMIT_TYPES.DOMESTIC]: "Domestic Water Permit",
  [PERMIT_TYPES.IRRIGATION]: "Irrigation Permit",
  [PERMIT_TYPES.COMMERCIAL]: "Commercial Water Permit",
  [PERMIT_TYPES.MUNICIPAL]: "Municipal Water Permit",
} as const

// Water Sources
export const WATER_SOURCES = {
  BOREHOLE: "borehole",
  WELL: "well",
  RIVER: "river",
  STREAM: "stream",
  DAM: "dam",
  SPRING: "spring",
  LAKE: "lake",
  RESERVOIR: "reservoir",
} as const

export const WATER_SOURCE_LABELS = {
  [WATER_SOURCES.BOREHOLE]: "Borehole",
  [WATER_SOURCES.WELL]: "Well",
  [WATER_SOURCES.RIVER]: "River",
  [WATER_SOURCES.STREAM]: "Stream",
  [WATER_SOURCES.DAM]: "Dam",
  [WATER_SOURCES.SPRING]: "Spring",
  [WATER_SOURCES.LAKE]: "Lake",
  [WATER_SOURCES.RESERVOIR]: "Reservoir",
} as const

// Document Types
export const DOCUMENT_TYPES = {
  APPLICATION_FORM: "application_form",
  SITE_PLAN: "site_plan",
  ENVIRONMENTAL_IMPACT: "environmental_impact",
  TECHNICAL_DRAWINGS: "technical_drawings",
  PROOF_OF_OWNERSHIP: "proof_of_ownership",
  WATER_QUALITY_REPORT: "water_quality_report",
  DRILLING_LOG: "drilling_log",
  PUMP_TEST_RESULTS: "pump_test_results",
  SUPPORTING_DOCUMENTS: "supporting_documents",
  PERMIT_CERTIFICATE: "permit_certificate",
} as const

export const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPES.APPLICATION_FORM]: "Application Form",
  [DOCUMENT_TYPES.SITE_PLAN]: "Site Plan",
  [DOCUMENT_TYPES.ENVIRONMENTAL_IMPACT]: "Environmental Impact Assessment",
  [DOCUMENT_TYPES.TECHNICAL_DRAWINGS]: "Technical Drawings",
  [DOCUMENT_TYPES.PROOF_OF_OWNERSHIP]: "Proof of Ownership",
  [DOCUMENT_TYPES.WATER_QUALITY_REPORT]: "Water Quality Report",
  [DOCUMENT_TYPES.DRILLING_LOG]: "Drilling Log",
  [DOCUMENT_TYPES.PUMP_TEST_RESULTS]: "Pump Test Results",
  [DOCUMENT_TYPES.SUPPORTING_DOCUMENTS]: "Supporting Documents",
  [DOCUMENT_TYPES.PERMIT_CERTIFICATE]: "Permit Certificate",
} as const

// Required Documents by Permit Type
export const REQUIRED_DOCUMENTS = {
  [PERMIT_TYPES.BOREHOLE]: [
    DOCUMENT_TYPES.APPLICATION_FORM,
    DOCUMENT_TYPES.SITE_PLAN,
    DOCUMENT_TYPES.PROOF_OF_OWNERSHIP,
    DOCUMENT_TYPES.DRILLING_LOG,
    DOCUMENT_TYPES.PUMP_TEST_RESULTS,
  ],
  [PERMIT_TYPES.SURFACE_WATER]: [
    DOCUMENT_TYPES.APPLICATION_FORM,
    DOCUMENT_TYPES.SITE_PLAN,
    DOCUMENT_TYPES.ENVIRONMENTAL_IMPACT,
    DOCUMENT_TYPES.TECHNICAL_DRAWINGS,
  ],
  [PERMIT_TYPES.GROUNDWATER]: [
    DOCUMENT_TYPES.APPLICATION_FORM,
    DOCUMENT_TYPES.SITE_PLAN,
    DOCUMENT_TYPES.PROOF_OF_OWNERSHIP,
    DOCUMENT_TYPES.WATER_QUALITY_REPORT,
  ],
  [PERMIT_TYPES.INDUSTRIAL]: [
    DOCUMENT_TYPES.APPLICATION_FORM,
    DOCUMENT_TYPES.SITE_PLAN,
    DOCUMENT_TYPES.ENVIRONMENTAL_IMPACT,
    DOCUMENT_TYPES.TECHNICAL_DRAWINGS,
    DOCUMENT_TYPES.WATER_QUALITY_REPORT,
  ],
  [PERMIT_TYPES.DOMESTIC]: [
    DOCUMENT_TYPES.APPLICATION_FORM,
    DOCUMENT_TYPES.SITE_PLAN,
    DOCUMENT_TYPES.PROOF_OF_OWNERSHIP,
  ],
  [PERMIT_TYPES.IRRIGATION]: [
    DOCUMENT_TYPES.APPLICATION_FORM,
    DOCUMENT_TYPES.SITE_PLAN,
    DOCUMENT_TYPES.TECHNICAL_DRAWINGS,
    DOCUMENT_TYPES.PROOF_OF_OWNERSHIP,
  ],
  [PERMIT_TYPES.COMMERCIAL]: [
    DOCUMENT_TYPES.APPLICATION_FORM,
    DOCUMENT_TYPES.SITE_PLAN,
    DOCUMENT_TYPES.PROOF_OF_OWNERSHIP,
    DOCUMENT_TYPES.WATER_QUALITY_REPORT,
  ],
  [PERMIT_TYPES.MUNICIPAL]: [
    DOCUMENT_TYPES.APPLICATION_FORM,
    DOCUMENT_TYPES.SITE_PLAN,
    DOCUMENT_TYPES.ENVIRONMENTAL_IMPACT,
    DOCUMENT_TYPES.TECHNICAL_DRAWINGS,
    DOCUMENT_TYPES.WATER_QUALITY_REPORT,
  ],
} as const

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ALLOWED_EXTENSIONS: [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".doc", ".docx"],
} as const

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  INPUT: "yyyy-MM-dd",
  TIMESTAMP: "yyyy-MM-dd HH:mm:ss",
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const

// Message Types
export const MESSAGE_TYPES = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  SUCCESS: "success",
  DOCUMENT_REQUEST: "document_request",
  STATUS_UPDATE: "status_update",
  APPROVAL: "approval",
  REJECTION: "rejection",
} as const

export const MESSAGE_TYPE_COLORS = {
  [MESSAGE_TYPES.INFO]: "bg-blue-50 border-blue-200 text-blue-800",
  [MESSAGE_TYPES.WARNING]: "bg-yellow-50 border-yellow-200 text-yellow-800",
  [MESSAGE_TYPES.ERROR]: "bg-red-50 border-red-200 text-red-800",
  [MESSAGE_TYPES.SUCCESS]: "bg-green-50 border-green-200 text-green-800",
  [MESSAGE_TYPES.DOCUMENT_REQUEST]: "bg-orange-50 border-orange-200 text-orange-800",
  [MESSAGE_TYPES.STATUS_UPDATE]: "bg-purple-50 border-purple-200 text-purple-800",
  [MESSAGE_TYPES.APPROVAL]: "bg-green-50 border-green-200 text-green-800",
  [MESSAGE_TYPES.REJECTION]: "bg-red-50 border-red-200 text-red-800",
} as const

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
} as const

export const PRIORITY_COLORS = {
  [PRIORITY_LEVELS.LOW]: "bg-gray-100 text-gray-800",
  [PRIORITY_LEVELS.NORMAL]: "bg-blue-100 text-blue-800",
  [PRIORITY_LEVELS.HIGH]: "bg-orange-100 text-orange-800",
  [PRIORITY_LEVELS.URGENT]: "bg-red-100 text-red-800",
} as const

// System Messages
export const SYSTEM_MESSAGES = {
  ERRORS: {
    GENERIC: "An unexpected error occurred. Please try again.",
    NETWORK: "Network error. Please check your connection.",
    UNAUTHORIZED: "You are not authorized to perform this action.",
    FORBIDDEN: "Access denied. Insufficient permissions.",
    NOT_FOUND: "The requested resource was not found.",
    VALIDATION: "Please check your input and try again.",
    FILE_TOO_LARGE: "File size exceeds the maximum allowed limit.",
    INVALID_FILE_TYPE: "Invalid file type. Please upload a supported file format.",
    SESSION_EXPIRED: "Your session has expired. Please log in again.",
  },
  SUCCESS: {
    APPLICATION_SUBMITTED: "Application submitted successfully.",
    APPLICATION_UPDATED: "Application updated successfully.",
    DOCUMENT_UPLOADED: "Document uploaded successfully.",
    MESSAGE_SENT: "Message sent successfully.",
    STATUS_UPDATED: "Status updated successfully.",
    PERMIT_APPROVED: "Permit approved successfully.",
    PERMIT_REJECTED: "Permit rejected successfully.",
    USER_CREATED: "User created successfully.",
    USER_UPDATED: "User updated successfully.",
    SETTINGS_SAVED: "Settings saved successfully.",
  },
  INFO: {
    LOADING: "Loading...",
    PROCESSING: "Processing your request...",
    SAVING: "Saving changes...",
    UPLOADING: "Uploading file...",
    GENERATING_REPORT: "Generating report...",
    SENDING_EMAIL: "Sending email notification...",
  },
} as const

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REGISTER: "/api/auth/register",
    REFRESH: "/api/auth/refresh",
    PROFILE: "/api/auth/profile",
  },
  APPLICATIONS: {
    LIST: "/api/applications",
    CREATE: "/api/applications",
    GET: (id: string) => `/api/applications/${id}`,
    UPDATE: (id: string) => `/api/applications/${id}`,
    DELETE: (id: string) => `/api/applications/${id}`,
    SUBMIT: (id: string) => `/api/applications/${id}/submit`,
    APPROVE: (id: string) => `/api/applications/${id}/approve`,
    REJECT: (id: string) => `/api/applications/${id}/reject`,
  },
  DOCUMENTS: {
    UPLOAD: "/api/documents/upload",
    DOWNLOAD: (id: string) => `/api/documents/${id}/download`,
    DELETE: (id: string) => `/api/documents/${id}`,
  },
  MESSAGES: {
    LIST: "/api/messages",
    SEND: "/api/messages",
    MARK_READ: (id: string) => `/api/messages/${id}/read`,
  },
  REPORTS: {
    GENERATE: "/api/reports/generate",
    DOWNLOAD: (id: string) => `/api/reports/${id}/download`,
  },
  USERS: {
    LIST: "/api/users",
    CREATE: "/api/users",
    GET: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
  },
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: "umscc_user_preferences",
  THEME: "umscc_theme",
  LANGUAGE: "umscc_language",
  DRAFT_APPLICATION: "umscc_draft_application",
  RECENT_SEARCHES: "umscc_recent_searches",
  FILTER_SETTINGS: "umscc_filter_settings",
} as const

// Theme Constants
export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const

// Notification Settings
export const NOTIFICATION_SETTINGS = {
  TYPES: {
    EMAIL: "email",
    SMS: "sms",
    PUSH: "push",
    IN_APP: "in_app",
  },
  FREQUENCIES: {
    IMMEDIATE: "immediate",
    DAILY: "daily",
    WEEKLY: "weekly",
    NEVER: "never",
  },
} as const

// Export Types
export const EXPORT_FORMATS = {
  PDF: "pdf",
  EXCEL: "excel",
  CSV: "csv",
  JSON: "json",
} as const

// Chart Colors
export const CHART_COLORS = [
  "#2563eb", // blue-600
  "#dc2626", // red-600
  "#16a34a", // green-600
  "#ca8a04", // yellow-600
  "#9333ea", // purple-600
  "#c2410c", // orange-600
  "#0891b2", // cyan-600
  "#be123c", // rose-600
  "#4338ca", // indigo-600
  "#059669", // emerald-600
] as const

// System Limits
export const SYSTEM_LIMITS = {
  MAX_APPLICATIONS_PER_USER: 50,
  MAX_DOCUMENTS_PER_APPLICATION: 20,
  MAX_MESSAGE_LENGTH: 2000,
  MAX_COMMENT_LENGTH: 1000,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  FILE_RETENTION_DAYS: 365,
  AUDIT_LOG_RETENTION_DAYS: 2555, // 7 years
} as const

// Regular Expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-$$$$]+$/,
  POSTAL_CODE: /^[A-Z0-9\s-]+$/i,
  COORDINATES: /^-?\d+\.?\d*$/,
  PERMIT_NUMBER: /^UMSCC-\d{4}-\d{6}$/,
  APPLICATION_NUMBER: /^APP-\d{4}-\d{6}$/,
} as const

// Default Values
export const DEFAULTS = {
  PAGINATION_SIZE: 10,
  SEARCH_DEBOUNCE: 300,
  NOTIFICATION_TIMEOUT: 5000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  IDLE_TIMEOUT: 15 * 60 * 1000, // 15 minutes
} as const
