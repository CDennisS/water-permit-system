import { appConfig } from "./config"

// Environment detection utilities
export const environment = {
  // Runtime environment
  isClient: typeof window !== "undefined",
  isServer: typeof window === "undefined",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",

  // Deployment environment
  isVercel: Boolean(process.env.VERCEL),
  isNetlify: Boolean(process.env.NETLIFY),

  // Build information
  buildTime: process.env.BUILD_TIME || new Date().toISOString(),
  gitCommit: process.env.GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
  gitBranch: process.env.GIT_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "unknown",
  deployUrl: process.env.DEPLOY_URL || process.env.VERCEL_URL || appConfig.url,
}

// Browser capabilities detection (client-side only)
export const browserCapabilities = {
  // Service Worker support
  get hasServiceWorker() {
    return environment.isClient && "serviceWorker" in navigator
  },

  // Push notifications support
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

  // Local storage support
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

  // Session storage support
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
    return environment.isClient && "RTCPeerConnection" in window
  },

  // Camera/Media support
  get hasMediaDevices() {
    return environment.isClient && "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices
  },
}

// Device information (client-side only)
export const deviceInfo = {
  // User agent detection
  get userAgent() {
    return environment.isClient ? navigator.userAgent : ""
  },

  // Mobile detection
  get isMobile() {
    if (!environment.isClient) return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  },

  // Tablet detection
  get isTablet() {
    if (!environment.isClient) return false
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent)
  },

  // Desktop detection
  get isDesktop() {
    return !this.isMobile && !this.isTablet
  },

  // iOS detection
  get isIOS() {
    if (!environment.isClient) return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
  },

  // Android detection
  get isAndroid() {
    if (!environment.isClient) return false
    return /Android/.test(navigator.userAgent)
  },

  // Safari detection
  get isSafari() {
    if (!environment.isClient) return false
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  },

  // Chrome detection
  get isChrome() {
    if (!environment.isClient) return false
    return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
  },

  // Firefox detection
  get isFirefox() {
    if (!environment.isClient) return false
    return /Firefox/.test(navigator.userAgent)
  },

  // Edge detection
  get isEdge() {
    if (!environment.isClient) return false
    return /Edg/.test(navigator.userAgent)
  },

  // Screen information
  get screenSize() {
    if (!environment.isClient) return { width: 0, height: 0 }
    return {
      width: window.screen.width,
      height: window.screen.height,
    }
  },

  // Viewport information
  get viewportSize() {
    if (!environment.isClient) return { width: 0, height: 0 }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  },

  // Device pixel ratio
  get pixelRatio() {
    return environment.isClient ? window.devicePixelRatio || 1 : 1
  },

  // Touch support
  get hasTouch() {
    return environment.isClient && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  },
}

// Performance monitoring utilities
export const performance = {
  // Navigation timing
  get navigationTiming() {
    if (!environment.isClient || !window.performance?.timing) return null

    const timing = window.performance.timing
    return {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
      domInteractive: timing.domInteractive - timing.navigationStart,
      firstPaint: timing.responseEnd - timing.fetchStart,
    }
  },

  // Memory information (Chrome only)
  get memoryInfo() {
    if (!environment.isClient || !(window.performance as any)?.memory) return null

    const memory = (window.performance as any).memory
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    }
  },

  // Connection information
  get connectionInfo() {
    if (!environment.isClient || !(navigator as any)?.connection) return null

    const connection = (navigator as any).connection
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    }
  },

  // Mark performance events
  mark(name: string) {
    if (environment.isClient && window.performance?.mark) {
      window.performance.mark(name)
    }
  },

  // Measure performance between marks
  measure(name: string, startMark: string, endMark: string) {
    if (environment.isClient && window.performance?.measure) {
      window.performance.measure(name, startMark, endMark)
    }
  },
}

// Network status utilities
export const networkStatus = {
  // Online/offline status
  get isOnline() {
    return environment.isClient ? navigator.onLine : true
  },

  // Network change listeners
  onOnline(callback: () => void) {
    if (environment.isClient) {
      window.addEventListener("online", callback)
      return () => window.removeEventListener("online", callback)
    }
    return () => {}
  },

  onOffline(callback: () => void) {
    if (environment.isClient) {
      window.addEventListener("offline", callback)
      return () => window.removeEventListener("offline", callback)
    }
    return () => {}
  },
}

// Feature detection utilities
export const featureDetection = {
  // PWA support
  get supportsPWA() {
    return browserCapabilities.hasServiceWorker && browserCapabilities.hasLocalStorage
  },

  // Dark mode support
  get supportsDarkMode() {
    return environment.isClient && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  },

  // Reduced motion preference
  get prefersReducedMotion() {
    return environment.isClient && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  },

  // High contrast preference
  get prefersHighContrast() {
    return environment.isClient && window.matchMedia && window.matchMedia("(prefers-contrast: high)").matches
  },

  // Accessibility features
  get hasScreenReader() {
    if (!environment.isClient) return false
    // Basic screen reader detection
    return Boolean(
      (window as any).speechSynthesis ||
        (navigator as any).userAgent.includes("NVDA") ||
        (navigator as any).userAgent.includes("JAWS") ||
        (navigator as any).userAgent.includes("VoiceOver"),
    )
  },
}

// Debug utilities (development only)
export const debug = {
  // Log environment information
  logEnvironment() {
    if (!appConfig.features.debug) return

    console.group("🌍 Environment Information")
    console.log("Runtime:", environment.isClient ? "Client" : "Server")
    console.log("Environment:", process.env.NODE_ENV)
    console.log("Build Time:", environment.buildTime)
    console.log("Git Commit:", environment.gitCommit)
    console.log("Git Branch:", environment.gitBranch)
    console.log("Deploy URL:", environment.deployUrl)
    console.groupEnd()
  },

  // Log browser capabilities
  logBrowserCapabilities() {
    if (!appConfig.features.debug || !environment.isClient) return

    console.group("🌐 Browser Capabilities")
    Object.entries(browserCapabilities).forEach(([key, value]) => {
      if (typeof value === "boolean") {
        console.log(`${key}:`, value ? "✅" : "❌")
      }
    })
    console.groupEnd()
  },

  // Log device information
  logDeviceInfo() {
    if (!appConfig.features.debug || !environment.isClient) return

    console.group("📱 Device Information")
    console.log("User Agent:", deviceInfo.userAgent)
    console.log("Mobile:", deviceInfo.isMobile)
    console.log("Tablet:", deviceInfo.isTablet)
    console.log("Desktop:", deviceInfo.isDesktop)
    console.log("Screen Size:", deviceInfo.screenSize)
    console.log("Viewport Size:", deviceInfo.viewportSize)
    console.log("Pixel Ratio:", deviceInfo.pixelRatio)
    console.log("Touch Support:", deviceInfo.hasTouch)
    console.groupEnd()
  },

  // Log performance information
  logPerformance() {
    if (!appConfig.features.debug || !environment.isClient) return

    setTimeout(() => {
      console.group("⚡ Performance Information")
      console.log("Navigation Timing:", performance.navigationTiming)
      console.log("Memory Info:", performance.memoryInfo)
      console.log("Connection Info:", performance.connectionInfo)
      console.groupEnd()
    }, 1000)
  },

  // Log all debug information
  logAll() {
    this.logEnvironment()
    this.logBrowserCapabilities()
    this.logDeviceInfo()
    this.logPerformance()
  },
}

// Initialize debug logging in development
if (environment.isDevelopment && environment.isClient) {
  debug.logAll()
}

// Export all utilities
export {
  environment as env,
  browserCapabilities as browser,
  deviceInfo as device,
  performance as perf,
  networkStatus as network,
  featureDetection as features,
}
