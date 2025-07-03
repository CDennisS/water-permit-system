"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Eye, FileText, LogOut, User, Calendar, MapPin, Phone, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  Clock,
  Save,
  Droplets,
  Building,
  X,
  Download,
  TrendingUp,
  Target,
  MessageSquare,
} from "lucide-react"
import type { PermitApplication, Document, WorkflowComment } from "@/types"
import { db } from "@/lib/database"
import { toast as useToastHook } from "@/components/ui/use-toast"

interface ChairpersonDashboardProps {
  user: any
}

interface Application {
  id: string
  applicantName: string
  permitType: string
  submissionDate: string
  status: "pending_review" | "approved" | "rejected"
  location: string
  phone: string
  email: string
  description: string
  documents: Array<{
    id: string
    name: string
    type: string
    url: string
  }>
  officerComments: Array<{
    id: string
    comment: string
    date: string
    officer: string
  }>
  reviewed: boolean
}

type ApplicationOld = {
  id: string
  applicantName: string
  submittedAt: string
  status: "pending" | "reviewed"
  documents: Document[]
  officerComments: string
  details: Record<string, string>
}

/* --------------------------------------------------------
 * Dummy data – replace with a real fetch in production
 * ----------------------------------------------------- */
const mockApplications: Application[] = [
  {
    id: "APP-001",
    applicantName: "John Mukamuri",
    permitType: "Water Abstraction",
    submissionDate: "2024-01-15",
    status: "pending_review",
    location: "Chitungwiza, Harare",
    phone: "+263 77 123 4567",
    email: "john.mukamuri@email.com",
    description: "Application for water abstraction permit for irrigation purposes on 5 hectare plot.",
    documents: [
      {
        id: "1",
        name: "Application Form.pdf",
        type: "application/pdf",
        url: "/placeholder.svg?height=400&width=300&text=Application+Form",
      },
      {
        id: "2",
        name: "Site Plan.jpg",
        type: "image/jpeg",
        url: "/placeholder.svg?height=400&width=600&text=Site+Plan",
      },
      {
        id: "3",
        name: "Environmental Impact.pdf",
        type: "application/pdf",
        url: "/placeholder.svg?height=400&width=300&text=Environmental+Impact",
      },
    ],
    officerComments: [
      {
        id: "1",
        comment: "Initial review completed. All required documents submitted. Site inspection scheduled for next week.",
        date: "2024-01-18",
        officer: "Sarah Chikwanha",
      },
      {
        id: "2",
        comment: "Site inspection completed. Water source adequate. Recommend approval with standard conditions.",
        date: "2024-01-22",
        officer: "Sarah Chikwanha",
      },
    ],
    reviewed: false,
  },
  {
    id: "APP-002",
    applicantName: "Mary Sibanda",
    permitType: "Borehole Drilling",
    submissionDate: "2024-01-20",
    status: "pending_review",
    location: "Epworth, Harare",
    phone: "+263 71 987 6543",
    email: "mary.sibanda@email.com",
    description: "Application for borehole drilling permit for domestic water supply.",
    documents: [
      {
        id: "4",
        name: "Drilling Application.pdf",
        type: "application/pdf",
        url: "/placeholder.svg?height=400&width=300&text=Drilling+Application",
      },
      {
        id: "5",
        name: "Hydrogeological Report.pdf",
        type: "application/pdf",
        url: "/placeholder.svg?height=400&width=300&text=Hydrogeological+Report",
      },
    ],
    officerComments: [
      {
        id: "3",
        comment: "Application received and under review. Hydrogeological report looks comprehensive.",
        date: "2024-01-21",
        officer: "David Moyo",
      },
    ],
    reviewed: false,
  },
]

export function ChairpersonDashboard() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [applications, setApplications] = useState<Application[]>(mockApplications)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)

  const handleMarkReviewed = (applicationId: string, reviewed: boolean) => {
    setApplications((prev) => prev.map((app) => (app.id === applicationId ? { ...app, reviewed } : app)))

    if (selectedApplication?.id === applicationId) {
      setSelectedApplication((prev) => (prev ? { ...prev, reviewed } : null))
    }
  }

  const handleSaveReview = () => {
    if (!selectedApplication) return

    // In a real app, this would make an API call to save the review status
    toast({
      title: "Review Saved",
      description: `Application ${selectedApplication.id} review status updated.`,
    })
  }

  const openDocument = (doc: Application["documents"][0]) => {
    // In a real app, this would open the actual document
    window.open(doc.url, "_blank")
  }

  const pendingApplications = applications.filter((app) => app.status === "pending_review")

  const [applicationsOld, setApplicationsOld] = useState<PermitApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<PermitApplication[]>([])
  const [selectedApplicationOld, setSelectedApplicationOld] = useState<PermitApplication | null>(null)
  const [activeView, setActiveView] = useState("overview")
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [reviewedApplications, setReviewedApplications] = useState<Set<string>>(new Set())
  const [selectAllUnsubmitted, setSelectAllUnsubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applicationDocuments, setApplicationDocuments] = useState<{ [key: string]: Document[] }>({})
  const [applicationComments, setApplicationComments] = useState<{ [key: string]: WorkflowComment[] }>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    reviewedThisMonth: 0,
    approvalRate: 0,
  })

  const [chairpersonApplications, setChairpersonApplications] = useState<ApplicationOld[]>([] as any)
  const [selected, setSelected] = useState<ApplicationOld | null>(null)
  const [saving, setSaving] = useState(false)

  const markReviewed = async (appId: string) => {
    setSaving(true)
    // 🔒 Hook up to real backend here
    await new Promise((r) => setTimeout(r, 750))
    setChairpersonApplications((apps) => apps.map((a) => (a.id === appId ? { ...a, status: "reviewed" } : a)))
    setSaving(false)
    useToastHook({
      title: "Application reviewed",
      description: `${appId} has been marked as reviewed.`,
    })
  }

  // useEffect(() => {
  //   loadDashboardData()
  //   loadUnreadMessages()

  //   const messageInterval = setInterval(loadUnreadMessages, 30000)
  //   return () => clearInterval(messageInterval)
  // }, [user.id])

  // useEffect(() => {
  //   filterApplications()
  // }, [applicationsOld, searchTerm, statusFilter])

  const filterApplicationsOld = () => {
    let filtered = applicationsOld

    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.customerAccountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }

  const loadDashboardData = async () => {
    try {
      const allApplications = await db.getApplications()
      const relevantApplications = allApplications.filter(
        (app) => app.currentStage === 2 || (app.currentStage > 2 && app.status !== "unsubmitted"),
      )

      setApplicationsOld(relevantApplications)

      // Load documents and comments for each application
      const documentsMap: { [key: string]: Document[] } = {}
      const commentsMap: { [key: string]: WorkflowComment[] } = {}

      for (const app of relevantApplications) {
        try {
          const [docs, comments] = await Promise.all([
            db.getDocumentsByApplication(app.id),
            db.getCommentsByApplication(app.id),
          ])
          documentsMap[app.id] = docs
          commentsMap[app.id] = comments
        } catch (error) {
          console.error(`Failed to load data for application ${app.id}:`, error)
          documentsMap[app.id] = []
          commentsMap[app.id] = []
        }
      }

      setApplicationDocuments(documentsMap)
      setApplicationComments(commentsMap)

      const pendingReview = relevantApplications.filter(
        (app) => app.currentStage === 2 && app.status === "submitted",
      ).length

      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const reviewedThisMonth = relevantApplications.filter(
        (app) => app.updatedAt >= thisMonth && app.currentStage > 2,
      ).length

      const totalReviewed = relevantApplications.filter((app) => app.currentStage > 2).length
      const approvedApps = relevantApplications.filter((app) => app.status === "approved").length

      setStats({
        totalApplications: relevantApplications.length,
        pendingReview,
        reviewedThisMonth,
        approvalRate: totalReviewed > 0 ? Math.round((approvedApps / totalReviewed) * 100) : 0,
      })
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    }
  }

  const loadUnreadMessages = async () => {
    try {
      // const publicMsgs = await db.getMessages(user.id, true)
      // const privateMsgs = await db.getMessages(user.id, false)
      // const unreadPublic = publicMsgs.filter((m) => m.senderId !== user.id && !m.readAt).length
      // const unreadPrivate = privateMsgs.filter((m) => m.senderId !== user.id && !m.readAt).length
      // setUnreadMessageCount(unreadPublic + unreadPrivate)
    } catch (error) {
      console.error("Failed to load unread messages:", error)
    }
  }

  const handleViewMessages = () => {
    setActiveView("messages")
    setUnreadMessageCount(0)
  }

  const handleApplicationReviewed = async (applicationId: string, isReviewed: boolean) => {
    const newReviewed = new Set(reviewedApplications)
    if (isReviewed) {
      newReviewed.add(applicationId)
    } else {
      newReviewed.delete(applicationId)
    }
    setReviewedApplications(newReviewed)

    if (isReviewed) {
      // await db.addLog({
      //   userId: user.id,
      //   userType: user.userType,
      //   action: "Application Reviewed",
      //   details: `Application ${applicationsOld.find((app) => app.id === applicationId)?.applicationId} marked as reviewed by chairperson`,
      //   applicationId: applicationId,
      // })
    }
  }

  const handleSelectAllUnsubmitted = (checked: boolean) => {
    setSelectAllUnsubmitted(checked)
    if (checked) {
      const pendingApps = applicationsOld.filter((app) => app.currentStage === 2 && app.status === "submitted")
      const newReviewed = new Set(reviewedApplications)
      pendingApps.forEach((app) => newReviewed.add(app.id))
      setReviewedApplications(newReviewed)
    }
  }

  const handleSubmitPermits = async () => {
    if (!selectAllUnsubmitted) return

    setIsSubmitting(true)
    try {
      const pendingApps = applicationsOld.filter(
        (app) => app.currentStage === 2 && app.status === "submitted" && reviewedApplications.has(app.id),
      )

      for (const app of pendingApps) {
        // await db.updateApplication(app.id, {
        //   currentStage: 3,
        //   status: "under_review",
        //   updatedAt: new Date(),
        // })
        // await db.addComment({
        //   applicationId: app.id,
        //   userId: user.id,
        //   userType: user.userType,
        //   comment:
        //     "Application reviewed and approved by Upper Manyame Sub Catchment Council Chairman. Forwarding to Catchment Manager for technical assessment.",
        //   stage: 2,
        //   isRejectionReason: false,
        // })
        // await db.addLog({
        //   userId: user.id,
        //   userType: user.userType,
        //   action: "Application Submitted to Next Stage",
        //   details: `Application ${app.applicationId} submitted to Catchment Manager for technical review`,
        //   applicationId: app.id,
        // })
      }

      setReviewedApplications(new Set())
      setSelectAllUnsubmitted(false)
      await loadDashboardData()

      alert(`Successfully submitted ${pendingApps.length} application(s) to Catchment Manager for technical review.`)
    } catch (error) {
      console.error("Error submitting applications:", error)
      alert("Error submitting applications. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewDocument = (document: Document) => {
    // Create a mock document URL for demonstration
    const documentUrl = `/placeholder-document.pdf?name=${encodeURIComponent(document.fileName)}`
    window.open(documentUrl, "_blank")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = "blue",
    progress,
  }: {
    title: string
    value: number | string
    icon: any
    trend?: "up" | "down" | "neutral"
    trendValue?: string
    color?: "blue" | "green" | "yellow" | "purple" | "orange" | "red"
    progress?: number
  }) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      yellow: "from-amber-500 to-orange-500",
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-red-500",
      red: "from-red-500 to-red-600",
    }

    const trendColors = {
      up: "text-green-600 bg-green-50",
      down: "text-red-600 bg-red-50",
      neutral: "text-gray-600 bg-gray-50",
    }

    return (
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-90`} />
        <CardContent className="relative p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
              <p className="text-3xl font-bold mb-2">{value}</p>
              {progress !== undefined && (
                <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              {trend && trendValue && (
                <div
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${trendColors[trend]}`}
                >
                  <TrendingUp className={`h-3 w-3 mr-1 ${trend === "down" ? "rotate-180" : ""}`} />
                  {trendValue}
                </div>
              )}
            </div>
            <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors">
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const CompactApplicationCard = ({ application }: { application: PermitApplication }) => {
    const isReviewed = reviewedApplications.has(application.id)
    const isUnsubmitted = application.currentStage === 2 && application.status === "submitted"
    const documents = applicationDocuments[application.id] || []

    return (
      <Card className="group hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm truncate">{application.applicantName}</h4>
                <p className="text-xs text-gray-500">{application.applicationId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isReviewed ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Reviewed
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              <span className="truncate">{application.customerAccountNumber}</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="h-3 w-3" />
              <span className="truncate">{application.permitType.replace("_", " ")}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{application.physicalAddress}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{documents.length} docs</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Stage {application.currentStage} • {application.submittedAt?.toLocaleDateString()}
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </DialogTrigger>
              <ApplicationDetailDialog application={application} onClose={() => loadDashboardData()} />
            </Dialog>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ApplicationDetailDialog = ({
    application,
    onClose,
  }: { application: PermitApplication; onClose: () => void }) => {
    const [isReviewed, setIsReviewed] = useState(reviewedApplications.has(application.id))
    const [isSaving, setIsSaving] = useState(false)
    const documents = applicationDocuments[application.id] || []
    const comments = applicationComments[application.id] || []
    const permittingOfficerComments = comments.filter((comment) => comment.userType === "permitting_officer")

    const handleSave = async () => {
      setIsSaving(true)
      try {
        await handleApplicationReviewed(application.id, isReviewed)
        alert("Application review status saved successfully!")
        onClose()
      } catch (error) {
        console.error("Error saving review status:", error)
        alert("Error saving review status. Please try again.")
      } finally {
        setIsSaving(false)
      }
    }

    return (
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Application Review</DialogTitle>
                <p className="text-sm text-gray-500">{application.applicationId}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Application Details</TabsTrigger>
                <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
                <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
                <TabsTrigger value="review">Review & Actions</TabsTrigger>
              </TabsList>

              {/* Application Details Tab */}
              <TabsContent value="details" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Info Bar */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{application.currentStage}</div>
                        <div className="text-xs text-gray-500">Current Stage</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{documents.length}</div>
                        <div className="text-xs text-gray-500">Documents</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {application.waterAllocation.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">m³/annum</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{application.landSize}</div>
                        <div className="text-xs text-gray-500">Hectares</div>
                      </Card>
                    </div>
                  </div>

                  {/* Applicant Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <User className="h-5 w-5 mr-2 text-blue-600" />
                        Applicant Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Account Number
                        </label>
                        <p className="font-semibold">{application.customerAccountNumber}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                        <p className="font-semibold">{application.applicantName}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Physical Address
                        </label>
                        <p className="text-sm">{application.physicalAddress}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Contact Number
                        </label>
                        <p className="text-sm">{application.cellularNumber}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Permit Details */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Droplets className="h-5 w-5 mr-2 text-blue-600" />
                        Permit Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Permit Type</label>
                        <p className="font-semibold capitalize">{application.permitType.replace("_", " ")}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Water Source
                        </label>
                        <p className="capitalize">{application.waterSource}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Intended Use
                        </label>
                        <p>{application.intendedUse}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Water Allocation
                        </label>
                        <p className="font-semibold">{application.waterAllocation.toLocaleString()} m³/annum</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* GPS Coordinates */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-green-600" />
                        Property & Location Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Land Size</label>
                          <p className="font-semibold">{application.landSize} hectares</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Boreholes</label>
                          <p className="font-semibold">{application.numberOfBoreholes}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Latitude</label>
                          <p className="font-mono text-sm bg-gray-50 p-2 rounded">{application.gpsLatitude}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Longitude</label>
                          <p className="font-mono text-sm bg-gray-50 p-2 rounded">{application.gpsLongitude}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6 mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-purple-600" />
                        Uploaded Documents ({documents.length})
                      </div>
                      {documents.length > 0 && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download All
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {documents.length > 0 ? (
                      <div className="space-y-3">
                        {documents.map((document) => (
                          <div
                            key={document.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{document.fileName}</p>
                                <p className="text-sm text-gray-500">
                                  {document.fileType} • {formatFileSize(document.fileSize)} • Uploaded{" "}
                                  {document.uploadedAt.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" onClick={() => handleViewDocument(document)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button size="sm" variant="secondary">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No documents uploaded</p>
                        <p className="text-sm">This application has no supporting documents</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent value="comments" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Permitting Officer Comments */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center text-blue-600">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Permitting Officer Comments ({permittingOfficerComments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {permittingOfficerComments.length > 0 ? (
                        <div className="space-y-4">
                          {permittingOfficerComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                  Stage {comment.stage}
                                </Badge>
                                <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.comment}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No permitting officer comments yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* All Comments */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        All Workflow Comments ({comments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {comments.length > 0 ? (
                        <ScrollArea className="h-80">
                          <div className="space-y-4">
                            {comments.map((comment) => (
                              <div key={comment.id} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline">{comment.userType.replace("_", " ")}</Badge>
                                    <Badge variant="secondary">Stage {comment.stage}</Badge>
                                  </div>
                                  <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.comment}</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No workflow comments yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Review & Actions Tab */}
              <TabsContent value="review" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Application Status */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Application Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Current Status
                        </label>
                        <Badge className="mt-1 bg-blue-100 text-blue-800 capitalize">
                          {application.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Progress</label>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Stage {application.currentStage} of 5</span>
                            <span>{Math.round((application.currentStage / 5) * 100)}%</span>
                          </div>
                          <Progress value={(application.currentStage / 5) * 100} className="h-2" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Submitted Date
                        </label>
                        <p className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {application.submittedAt?.toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Review Section */}
                  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-blue-800 flex items-center">
                        <Target className="h-5 w-5 mr-2" />
                        Chairperson Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border">
                        <Checkbox
                          id="application-reviewed"
                          checked={isReviewed}
                          onCheckedChange={(checked) => setIsReviewed(checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor="application-reviewed"
                            className="text-sm font-medium text-blue-800 cursor-pointer"
                          >
                            I have reviewed this application and all supporting documents
                          </label>
                          <p className="text-xs text-gray-600 mt-1">
                            By checking this box, you confirm that you have thoroughly reviewed the application details,
                            uploaded documents, and any comments from the permitting officer.
                          </p>
                        </div>
                      </div>
                      <Button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Review Status"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    )
  }

  const pendingApplicationsOld = applicationsOld.filter((app) => app.currentStage === 2 && app.status === "submitted")
  const allPendingReviewed =
    pendingApplicationsOld.length > 0 && pendingApplicationsOld.every((app) => reviewedApplications.has(app.id))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chairperson Dashboard</h1>
              <p className="text-sm text-gray-600">Upper Manyame Sub Catchment Council</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                <p className="text-xs text-gray-500">Chairperson</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApplications.length}</div>
              <p className="text-xs text-muted-foreground">Applications requiring review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviewed Today</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.filter((app) => app.reviewed).length}</div>
              <p className="text-xs text-muted-foreground">Applications reviewed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications Requiring Review</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application ID</TableHead>
                  <TableHead>Applicant Name</TableHead>
                  <TableHead>Permit Type</TableHead>
                  <TableHead>Submission Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{application.id}</TableCell>
                    <TableCell>{application.applicantName}</TableCell>
                    <TableCell>{application.permitType}</TableCell>
                    <TableCell>{new Date(application.submissionDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending Review</Badge>
                    </TableCell>
                    <TableCell>
                      {application.reviewed ? (
                        <Badge variant="default">Reviewed</Badge>
                      ) : (
                        <Badge variant="outline">Not Reviewed</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedApplication(application)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[800px] sm:w-[800px]">
                          <SheetHeader>
                            <SheetTitle>Application Details - {selectedApplication?.id}</SheetTitle>
                          </SheetHeader>

                          {selectedApplication && (
                            <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                              <div className="space-y-6">
                                {/* Applicant Information */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3">Applicant Information</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                      <User className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm">{selectedApplication.applicantName}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Phone className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm">{selectedApplication.phone}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Mail className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm">{selectedApplication.email}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <MapPin className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm">{selectedApplication.location}</span>
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {/* Application Details */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3">Application Details</h3>
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <FileText className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm font-medium">Permit Type:</span>
                                      <span className="text-sm">{selectedApplication.permitType}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm font-medium">Submission Date:</span>
                                      <span className="text-sm">
                                        {new Date(selectedApplication.submissionDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <span className="text-sm font-medium">Description:</span>
                                    <p className="text-sm text-gray-600 mt-1">{selectedApplication.description}</p>
                                  </div>
                                </div>

                                <Separator />

                                {/* Documents */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3">Uploaded Documents</h3>
                                  <div className="space-y-2">
                                    {selectedApplication.documents.map((doc) => (
                                      <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                      >
                                        <div className="flex items-center space-x-3">
                                          <FileText className="h-5 w-5 text-blue-500" />
                                          <div>
                                            <p className="text-sm font-medium">{doc.name}</p>
                                            <p className="text-xs text-gray-500">{doc.type}</p>
                                          </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => openDocument(doc)}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          Open
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <Separator />

                                {/* Officer Comments */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3">Permitting Officer Comments</h3>
                                  <div className="space-y-3">
                                    {selectedApplication.officerComments.map((comment) => (
                                      <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="text-sm font-medium">{comment.officer}</span>
                                          <span className="text-xs text-gray-500">
                                            {new Date(comment.date).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-700">{comment.comment}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <Separator />

                                {/* Review Section */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3">Review Status</h3>
                                  <div className="flex items-center space-x-2 mb-4">
                                    <Checkbox
                                      id="reviewed"
                                      checked={selectedApplication.reviewed}
                                      onCheckedChange={(checked) =>
                                        handleMarkReviewed(selectedApplication.id, checked as boolean)
                                      }
                                    />
                                    <label htmlFor="reviewed" className="text-sm font-medium">
                                      Application Reviewed
                                    </label>
                                  </div>
                                  <Button onClick={handleSaveReview} className="w-full">
                                    Save Review Status
                                  </Button>
                                </div>
                              </div>
                            </ScrollArea>
                          )}
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
