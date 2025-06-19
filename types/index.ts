export interface User {
  id: string
  username: string
  userType: UserType
  password?: string // Optional for security, only used during creation/updates
  createdAt: Date
  updatedAt: Date
}
