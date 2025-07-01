/**
 * Application Constants
 *
 * Centralized constants for the UMSCC Permit Management System.
 * These values are used throughout the application for consistency.
 */

import { config } from "./config"

/**
 * User Types and Roles
 */
export const USER_TYPES = {
  APPLICANT: "applicant",
  PERMITTING_OFFICER: "permitting_officer",
  CHAIRPERSON: "chairperson",
  PERMIT_SUPERVISOR: "permit_supervisor",
  ICT: "ict",
  CATCHMENT_MANAGER: "catchment_manager",
  CATCHMENT_CHAIRPERSON: "catchment_chairperson",
} as const

export const USER_TYPE_LABELS = {
  [USER_TYPES.APPLICANT]: "Applicant",
  [USER_TYPES.PERMITTING_OFFICER]: "Permitting Officer",
  [USER_TYPES.CHAIRPERSON]: "Chairperson",
  [USER_TYPES.PERMIT_SUPERVISOR]: "Permit Supervisor",
  [USER_TYPES.ICT]: "ICT Administrator",
  [USER_TYPES.CATCHMENT_MANAGER]: "Catchment Manager",
  [USER_TYPES.CATCHMENT_CHAIRPERSON]: "Catchment Chairperson",
} as const

/**
 * Application Status Types
 */
export const APPLICATION_STATUS = {
  DRAFT: "draft",
  UNSUBMITTED: "unsubmitted",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  PENDING_DOCUMENTS: "pending_documents",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const

export const APPLICATION_STATUS_LABELS = {
  [APPLICATION_STATUS.DRAFT]: "Draft",
  [APPLICATION_STATUS.UNSUBMITTED]: "Unsubmitted",
  [APPLICATION_STATUS.SUBMITTED]: "Submitted",
  [APPLICATION_STATUS.UNDER_REVIEW]: "Under Review",
  [APPLICATION_STATUS.PENDING_DOCUMENTS]: "Pending Documents",
  [APPLICATION_STATUS.APPROVED]: "Approved",
  [APPLICATION_STATUS.REJECTED]: "Rejected",
  [APPLICATION_STATUS.CANCELLED]: "Cancelled",
  [APPLICATION_STATUS.EXPIRED]: "Expired",
} as const

export const APPLICATION_STATUS_COLORS = {
  [APPLICATION_STATUS.DRAFT]: "gray",
  [APPLICATION_STATUS.UNSUBMITTED]: "yellow",
  [APPLICATION_STATUS.SUBMITTED]: "blue",
  [APPLICATION_STATUS.UNDER_REVIEW]: "orange",
  [APPLICATION_STATUS.PENDING_DOCUMENTS]: "purple",
  [APPLICATION_STATUS.APPROVED]: "green",
  [APPLICATION_STATUS.REJECTED]: "red",
  [APPLICATION_STATUS.CANCELLED]: "gray",
  [APPLICATION_STATUS.EXPIRED]: "red",
} as const

/**
 * Permit Types
 */
export const PERMIT_TYPES = {
  WATER_ABSTRACTION: "water_abstraction",
  BOREHOLE_DRILLING: "borehole_drilling",
  WATER_STORAGE: "water_storage",
  IRRIGATION: "irrigation",
  INDUSTRIAL_USE: "industrial_use",
  DOMESTIC_USE: "domestic_use",
  COMMERCIAL_USE: "commercial_use",
  MINING_USE: "mining_use",
} as const

export const PERMIT_TYPE_LABELS = {
  [PERMIT_TYPES.WATER_ABSTRACTION]: "Water Abstraction",
  [PERMIT_TYPES.BOREHOLE_DRILLING]: "Borehole Drilling",
  [PERMIT_TYPES.WATER_STORAGE]: "Water Storage",
  [PERMIT_TYPES.IRRIGATION]: "Irrigation",
  [PERMIT_TYPES.INDUSTRIAL_USE]: "Industrial Use",
  [PERMIT_TYPES.DOMESTIC_USE]: "Domestic Use",
  [PERMIT_TYPES.COMMERCIAL_USE]: "Commercial Use",
  [PERMIT_TYPES.MINING_USE]: "Mining Use",
} as const

/**
 * Water Sources
 */
export const WATER_SOURCES = {
  RIVER: "river",
  STREAM: "stream",
  LAKE: "lake",
  DAM: "dam",
  BOREHOLE: "borehole",
  WELL: "well",
  SPRING: "spring",
  GROUNDWATER: "groundwater",
} as const

export const WATER_SOURCE_LABELS = {
  [WATER_SOURCES.RIVER]: "River",
  [WATER_SOURCES.STREAM]: "Stream",
  [WATER_SOURCES.LAKE]: "Lake",
  [WATER_SOURCES.DAM]: "Dam",
  [WATER_SOURCES.BOREHOLE]: "Borehole",
  [WATER_SOURCES.WELL]: "Well",
  [WATER_SOURCES.SPRING]: "Spring",
  [WATER_SOURCES.GROUNDWATER]: "Groundwater",
} as const

/**
 * Document Types
 */
export const DOCUMENT_TYPES = {
  APPLICATION_FORM: "application_form",
  IDENTITY_DOCUMENT: "identity_document",
  PROOF_OF_RESIDENCE: "proof_of_residence",
  SITE_PLAN: "site_plan",
  ENVIRONMENTAL_IMPACT: "environmental_impact",
  TECHNICAL_DRAWINGS: "technical_drawings",
  WATER_QUALITY_REPORT: "water_quality_report",
  BUSINESS_LICENSE: "business_license",
  OTHER: "other",
} as const

export const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPES.APPLICATION_FORM]: "Application Form",
  [DOCUMENT_TYPES.IDENTITY_DOCUMENT]: "Identity Document",
  [DOCUMENT_TYPES.PROOF_OF_RESIDENCE]: "Proof of Residence",
  [DOCUMENT_TYPES.SITE_PLAN]: "Site Plan",
  [DOCUMENT_TYPES.ENVIRONMENTAL_IMPACT]: "Environmental Impact Assessment",
  [DOCUMENT_TYPES.TECHNICAL_DRAWINGS]: "Technical Drawings",
  [DOCUMENT_TYPES.WATER_QUALITY_REPORT]: "Water Quality Report",
  [DOCUMENT_TYPES.BUSINESS_LICENSE]: "Business License",
  [DOCUMENT_TYPES.OTHER]: "Other",
} as const

/**
 * Message Types
 */
export const MESSAGE_TYPES = {
  PUBLIC: "public",
  PRIVATE: "private",
  SYSTEM: "system",
  NOTIFICATION: "notification",
} as const

export const MESSAGE_TYPE_LABELS = {
  [MESSAGE_TYPES.PUBLIC]: "Public Message",
  [MESSAGE_TYPES.PRIVATE]: "Private Message",
  [MESSAGE_TYPES.SYSTEM]: "System Message",
  [MESSAGE_TYPES.NOTIFICATION]: "Notification",
} as const

/**
 * Priority Levels
 */
export const PRIORITY_LEVELS = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
} as const

export const PRIORITY_LABELS = {
  [PRIORITY_LEVELS.LOW]: "Low",
  [PRIORITY_LEVELS.NORMAL]: "Normal",
  [PRIORITY_LEVELS.HIGH]: "High",
  [PRIORITY_LEVELS.URGENT]: "Urgent",
} as const

export const PRIORITY_COLORS = {
  [PRIORITY_LEVELS.LOW]: "gray",
  [PRIORITY_LEVELS.NORMAL]: "blue",
  [PRIORITY_LEVELS.HIGH]: "orange",
  [PRIORITY_LEVELS.URGENT]: "red",
} as const

/**
 * File Upload Constants
 */
export const FILE_UPLOAD = {
  MAX_SIZE: config.security.maxFileSize,
  ALLOWED_TYPES: config.security.allowedFileTypes,
  MIME_TYPES: {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
  },
} as const

/**
 * Date and Time Constants
 */
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  DISPLAY_WITH_TIME: "MMM dd, yyyy HH:mm",
  ISO: "yyyy-MM-dd",
  ISO_WITH_TIME: "yyyy-MM-dd HH:mm:ss",
  RELATIVE: "relative",
} as const

export const TIME_ZONES = {
  HARARE: "Africa/Harare",
  UTC: "UTC",
} as const

/**
 * Pagination Constants
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const

/**
 * Search and Filter Constants
 */
export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
  DEBOUNCE_DELAY: 300,
} as const

/**
 * Validation Constants
 */
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_COMMENT_LENGTH: 500,
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const

/**
 * UI Constants
 */
export const UI = {
  TOAST_DURATION: 5000,
  LOADING_DELAY: 200,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
} as const

/**
 * API Constants
 */
export const API = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  RATE_LIMIT: 100,
  RATE_LIMIT_WINDOW: 60000,
} as const

/**
 * Cache Keys
 */
export const CACHE_KEYS = {
  USER_PROFILE: "user_profile",
  APPLICATIONS: "applications",
  MESSAGES: "messages",
  NOTIFICATIONS: "notifications",
  SYSTEM_CONFIG: "system_config",
} as const

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  THEME: "umscc-theme",
  USER_PREFERENCES: "umscc-user-preferences",
  DRAFT_APPLICATION: "umscc-draft-application",
  LAST_ACTIVITY: "umscc-last-activity",
} as const

/**
 * Error Codes
 */
export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
} as const

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  APPLICATION_SAVED: "Application saved successfully",
  APPLICATION_SUBMITTED: "Application submitted successfully",
  APPLICATION_APPROVED: "Application approved successfully",
  APPLICATION_REJECTED: "Application rejected",
  MESSAGE_SENT: "Message sent successfully",
  DOCUMENT_UPLOADED: "Document uploaded successfully",
  PROFILE_UPDATED: "Profile updated successfully",
} as const

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  GENERIC: "An unexpected error occurred. Please try again.",
  NETWORK: "Network error. Please check your connection.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "Access denied. Please contact your administrator.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION: "Please check your input and try again.",
  FILE_TOO_LARGE: `File size must be less than ${FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB`,
  INVALID_FILE_TYPE: `Only ${FILE_UPLOAD.ALLOWED_TYPES.join(", ")} files are allowed`,
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
} as const

/**
 * Application Workflow States
 */
export const WORKFLOW_STATES = {
  INITIAL: "initial",
  REVIEW: "review",
  APPROVAL: "approval",
  FINAL: "final",
} as const

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
} as const

/**
 * Export all constants as a single object for convenience
 */
export const CONSTANTS = {
  USER_TYPES,
  USER_TYPE_LABELS,
  APPLICATION_STATUS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  PERMIT_TYPES,
  PERMIT_TYPE_LABELS,
  WATER_SOURCES,
  WATER_SOURCE_LABELS,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  MESSAGE_TYPES,
  MESSAGE_TYPE_LABELS,
  PRIORITY_LEVELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  FILE_UPLOAD,
  DATE_FORMATS,
  TIME_ZONES,
  PAGINATION,
  SEARCH,
  VALIDATION,
  UI,
  API,
  CACHE_KEYS,
  STORAGE_KEYS,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  WORKFLOW_STATES,
  NOTIFICATION_TYPES,
} as const
