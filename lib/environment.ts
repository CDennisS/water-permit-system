/**
 * Environment Detection and Utilities
 *
 * Utilities for detecting runtime environment and capabilities.
 * This file provides functions to check browser features, device types, and environment settings.
 */

/**
 * Environment Detection
 */
export const environment = {
  // Runtime Environment
  isClient: typeof window !== "undefined",
  isServer: typeof window === "undefined",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",

  // Deployment Environment
  isVercel: Boolean(process.env.VERCEL),
  isNetlify: Boolean(process.env.NETLIFY),
  isLocal: !process.env.VERCEL && !process.env.NETLIFY,

  // Build Information
  buildTime: process.env.BUILD_TIME || new Date().toISOString(),
  gitCommit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || "unknown",
  gitBranch: process.env.VERCEL_GIT_COMMIT_REF || process.env.GIT_BRANCH || "unknown",
  deploymentUrl: process.env.VERCEL_URL || process.env.DEPLOY_URL || "localhost:3000",
} as const

/**
 * Browser Capabilities Detection
 */
export const browserCapabilities = {
  // Check if running in browser
  get isBrowser() {
    return environment.isClient
  },

  // Service Worker support
  get hasServiceWorker() {
    return environment.isClient && "serviceWorker" in navigator
  },

  // Push Notifications support
  get hasPushNotifications() {
    return environment.isClient && "PushManager" in window && "Notification" in window
  },

  // File API support
  get hasFileAPI() {
    return environment.isClient && "File" in window && "FileReader" in window
  },

  // Geolocation support
  get hasGeolocation() {
    return environment.isClient && "geolocation" in navigator
  },

  // Local Storage support
  get hasLocalStorage() {
    if (!environment.isClient) return false
    try {
      const test = "__localStorage_test__"
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  },

  // Session Storage support
  get hasSessionStorage() {
    if (!environment.isClient) return false
    try {
      const test = "__sessionStorage_test__"
      sessionStorage.setItem(test, test)
      sessionStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  },

  // IndexedDB support
  get hasIndexedDB() {
    return environment.isClient && "indexedDB" in window
  },

  // Web Workers support
  get hasWebWorkers() {
    return environment.isClient && "Worker" in window
  },

  // WebRTC support
  get hasWebRTC() {
    return environment.isClient && ("RTCPeerConnection" in window || "webkitRTCPeerConnection" in window)
  },

  // Canvas support
  get hasCanvas() {
    if (!environment.isClient) return false
    const canvas = document.createElement("canvas")
    return !!(canvas.getContext && canvas.getContext("2d"))
  },

  // WebGL support
  get hasWebGL() {
    if (!environment.isClient) return false
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    return !!(gl && gl instanceof WebGLRenderingContext)
  },

  // Touch support
  get hasTouch() {
    return environment.isClient && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  },

  // Clipboard API support
  get hasClipboard() {
    return environment.isClient && "clipboard" in navigator
  },

  // Share API support
  get hasShare() {
    return environment.isClient && "share" in navigator
  },

  // Payment Request API support
  get hasPaymentRequest() {
    return environment.isClient && "PaymentRequest" in window
  },

  // Intersection Observer support
  get hasIntersectionObserver() {
    return environment.isClient && "IntersectionObserver" in window
  },

  // Resize Observer support
  get hasResizeObserver() {
    return environment.isClient && "ResizeObserver" in window
  },

  // Mutation Observer support
  get hasMutationObserver() {
    return environment.isClient && "MutationObserver" in window
  },
} as const

/**
 * Device Detection
 */
export const deviceInfo = {
  // Get user agent
  get userAgent() {
    return environment.isClient ? navigator.userAgent : ""
  },

  // Check if mobile device
  get isMobile() {
    if (!environment.isClient) return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  },

  // Check if tablet
  get isTablet() {
    if (!environment.isClient) return false
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent)
  },

  // Check if desktop
  get isDesktop() {
    return !this.isMobile && !this.isTablet
  },

  // Check if iOS
  get isIOS() {
    if (!environment.isClient) return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
  },

  // Check if Android
  get isAndroid() {
    if (!environment.isClient) return false
    return /Android/.test(navigator.userAgent)
  },

  // Check if Safari
  get isSafari() {
    if (!environment.isClient) return false
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  },

  // Check if Chrome
  get isChrome() {
    if (!environment.isClient) return false
    return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
  },

  // Check if Firefox
  get isFirefox() {
    if (!environment.isClient) return false
    return /Firefox/.test(navigator.userAgent)
  },

  // Check if Edge
  get isEdge() {
    if (!environment.isClient) return false
    return /Edge/.test(navigator.userAgent)
  },

  // Get screen dimensions
  get screenSize() {
    if (!environment.isClient) return { width: 0, height: 0 }
    return {
      width: window.screen.width,
      height: window.screen.height,
    }
  },

  // Get viewport dimensions
  get viewportSize() {
    if (!environment.isClient) return { width: 0, height: 0 }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  },

  // Check if device is in landscape mode
  get isLandscape() {
    if (!environment.isClient) return false
    return window.innerWidth > window.innerHeight
  },

  // Check if device is in portrait mode
  get isPortrait() {
    return !this.isLandscape
  },

  // Get device pixel ratio
  get pixelRatio() {
    return environment.isClient ? window.devicePixelRatio || 1 : 1
  },

  // Check if device supports hover
  get canHover() {
    if (!environment.isClient) return false
    return window.matchMedia("(hover: hover)").matches
  },

  // Get preferred color scheme
  get prefersDarkMode() {
    if (!environment.isClient) return false
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  },

  // Get preferred reduced motion
  get prefersReducedMotion() {
    if (!environment.isClient) return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  },

  // Check if device is online
  get isOnline() {
    return environment.isClient ? navigator.onLine : true
  },

  // Get connection information
  get connection() {
    if (!environment.isClient) return null
    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    return connection
      ? {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        }
      : null
  },
} as const

/**
 * Performance Utilities
 */
export const performance = {
  // Check if Performance API is available
  get hasPerformanceAPI() {
    return environment.isClient && "performance" in window
  },

  // Get navigation timing
  get navigationTiming() {
    if (!this.hasPerformanceAPI) return null
    const timing = window.performance.timing
    return {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
      domInteractive: timing.domInteractive - timing.navigationStart,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint(),
    }
  },

  // Get First Paint timing
  getFirstPaint() {
    if (!this.hasPerformanceAPI) return null
    const paintEntries = window.performance.getEntriesByType("paint")
    const firstPaint = paintEntries.find((entry) => entry.name === "first-paint")
    return firstPaint ? firstPaint.startTime : null
  },

  // Get First Contentful Paint timing
  getFirstContentfulPaint() {
    if (!this.hasPerformanceAPI) return null
    const paintEntries = window.performance.getEntriesByType("paint")
    const firstContentfulPaint = paintEntries.find((entry) => entry.name === "first-contentful-paint")
    return firstContentfulPaint ? firstContentfulPaint.startTime : null
  },

  // Get memory usage (Chrome only)
  get memoryUsage() {
    if (!environment.isClient) return null
    const memory = (window.performance as any).memory
    return memory
      ? {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        }
      : null
  },

  // Mark performance point
  mark(name: string) {
    if (this.hasPerformanceAPI) {
      window.performance.mark(name)
    }
  },

  // Measure performance between marks
  measure(name: string, startMark: string, endMark?: string) {
    if (this.hasPerformanceAPI) {
      window.performance.measure(name, startMark, endMark)
    }
  },

  // Get performance entries
  getEntries(type?: string) {
    if (!this.hasPerformanceAPI) return []
    return type ? window.performance.getEntriesByType(type) : window.performance.getEntries()
  },
} as const

/**
 * Network Utilities
 */
export const network = {
  // Check network status
  get isOnline() {
    return deviceInfo.isOnline
  },

  // Get connection type
  get connectionType() {
    const connection = deviceInfo.connection
    return connection ? connection.effectiveType : "unknown"
  },

  // Check if connection is slow
  get isSlowConnection() {
    const connection = deviceInfo.connection
    return connection ? connection.effectiveType === "slow-2g" || connection.effectiveType === "2g" : false
  },

  // Check if data saver is enabled
  get isDataSaverEnabled() {
    const connection = deviceInfo.connection
    return connection ? connection.saveData : false
  },

  // Monitor online/offline status
  onStatusChange(callback: (isOnline: boolean) => void) {
    if (!environment.isClient) return () => {}

    const handleOnline = () => callback(true)
    const handleOffline = () => callback(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  },
} as const

/**
 * Feature Detection Utilities
 */
export const features = {
  // Check if PWA is installable
  get isPWAInstallable() {
    return environment.isClient && "BeforeInstallPromptEvent" in window
  },

  // Check if running as PWA
  get isPWA() {
    return (
      environment.isClient &&
      (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true)
    )
  },

  // Check if dark mode is supported
  get supportsDarkMode() {
    return environment.isClient && window.matchMedia("(prefers-color-scheme: dark)").matches
  },

  // Check if reduced motion is preferred
  get prefersReducedMotion() {
    return deviceInfo.prefersReducedMotion
  },

  // Check if high contrast is preferred
  get prefersHighContrast() {
    if (!environment.isClient) return false
    return window.matchMedia("(prefers-contrast: high)").matches
  },

  // Check CSS feature support
  supportsCSS(property: string, value: string) {
    if (!environment.isClient) return false
    return CSS.supports(property, value)
  },

  // Check if feature is supported
  supports(feature: string) {
    switch (feature) {
      case "serviceWorker":
        return browserCapabilities.hasServiceWorker
      case "pushNotifications":
        return browserCapabilities.hasPushNotifications
      case "geolocation":
        return browserCapabilities.hasGeolocation
      case "localStorage":
        return browserCapabilities.hasLocalStorage
      case "sessionStorage":
        return browserCapabilities.hasSessionStorage
      case "indexedDB":
        return browserCapabilities.hasIndexedDB
      case "webWorkers":
        return browserCapabilities.hasWebWorkers
      case "webRTC":
        return browserCapabilities.hasWebRTC
      case "canvas":
        return browserCapabilities.hasCanvas
      case "webGL":
        return browserCapabilities.hasWebGL
      case "touch":
        return browserCapabilities.hasTouch
      case "clipboard":
        return browserCapabilities.hasClipboard
      case "share":
        return browserCapabilities.hasShare
      case "paymentRequest":
        return browserCapabilities.hasPaymentRequest
      default:
        return false
    }
  },
} as const

/**
 * Debug Utilities
 */
export const debug = {
  // Log environment information
  logEnvironment() {
    if (!environment.isDevelopment) return

    console.group("🌍 Environment Information")
    console.log("Runtime:", environment.isClient ? "Client" : "Server")
    console.log("Environment:", process.env.NODE_ENV)
    console.log("Platform:", environment.isVercel ? "Vercel" : environment.isNetlify ? "Netlify" : "Local")
    console.log("Build Time:", environment.buildTime)
    console.log("Git Commit:", environment.gitCommit)
    console.log("Git Branch:", environment.gitBranch)
    console.groupEnd()
  },

  // Log device information
  logDevice() {
    if (!environment.isDevelopment || !environment.isClient) return

    console.group("📱 Device Information")
    console.log("User Agent:", deviceInfo.userAgent)
    console.log("Device Type:", deviceInfo.isMobile ? "Mobile" : deviceInfo.isTablet ? "Tablet" : "Desktop")
    console.log("Platform:", deviceInfo.isIOS ? "iOS" : deviceInfo.isAndroid ? "Android" : "Other")
    console.log(
      "Browser:",
      deviceInfo.isChrome ? "Chrome" : deviceInfo.isFirefox ? "Firefox" : deviceInfo.isSafari ? "Safari" : "Other",
    )
    console.log("Screen Size:", `${deviceInfo.screenSize.width}x${deviceInfo.screenSize.height}`)
    console.log("Viewport Size:", `${deviceInfo.viewportSize.width}x${deviceInfo.viewportSize.height}`)
    console.log("Pixel Ratio:", deviceInfo.pixelRatio)
    console.log("Online:", deviceInfo.isOnline)
    console.groupEnd()
  },

  // Log browser capabilities
  logCapabilities() {
    if (!environment.isDevelopment || !environment.isClient) return

    console.group("🔧 Browser Capabilities")
    Object.entries(browserCapabilities).forEach(([key, value]) => {
      if (typeof value === "boolean") {
        console.log(`${key}:`, value)
      }
    })
    console.groupEnd()
  },

  // Log performance metrics
  logPerformance() {
    if (!environment.isDevelopment || !environment.isClient) return

    const timing = performance.navigationTiming
    if (timing) {
      console.group("⚡ Performance Metrics")
      console.log("DOM Content Loaded:", `${timing.domContentLoaded}ms`)
      console.log("Load Complete:", `${timing.loadComplete}ms`)
      console.log("DOM Interactive:", `${timing.domInteractive}ms`)
      if (timing.firstPaint) console.log("First Paint:", `${timing.firstPaint}ms`)
      if (timing.firstContentfulPaint) console.log("First Contentful Paint:", `${timing.firstContentfulPaint}ms`)
      console.groupEnd()
    }
  },

  // Log all debug information
  logAll() {
    this.logEnvironment()
    this.logDevice()
    this.logCapabilities()
    this.logPerformance()
  },
} as const

// Auto-log in development
if (environment.isDevelopment && environment.isClient) {
  // Delay to ensure DOM is ready
  setTimeout(() => {
    debug.logAll()
  }, 1000)
}

/**
 * Export all utilities
 */
export default {
  environment,
  browserCapabilities,
  deviceInfo,
  performance,
  network,
  features,
  debug,
}
