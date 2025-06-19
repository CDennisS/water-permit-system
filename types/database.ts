export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          password_hash: string
          user_type:
            | "permitting_officer"
            | "chairperson"
            | "catchment_manager"
            | "catchment_chairperson"
            | "permit_supervisor"
            | "ict"
          is_active: boolean
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          username: string
          email: string
          password_hash: string
          user_type:
            | "permitting_officer"
            | "chairperson"
            | "catchment_manager"
            | "catchment_chairperson"
            | "permit_supervisor"
            | "ict"
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          username?: string
          email?: string
          password_hash?: string
          user_type?:
            | "permitting_officer"
            | "chairperson"
            | "catchment_manager"
            | "catchment_chairperson"
            | "permit_supervisor"
            | "ict"
          is_active?: boolean
          updated_at?: string
          last_login?: string | null
        }
      }
      applications: {
        Row: {
          id: string
          application_id: string
          applicant_name: string
          physical_address: string
          postal_address: string | null
          customer_account_number: string
          cellular_number: string
          number_of_boreholes: number
          land_size: number
          gps_latitude: number
          gps_longitude: number
          water_source: string
          water_source_details: string | null
          permit_type: string
          intended_use: string
          water_allocation: number
          validity_period: number
          comments: string | null
          status: "unsubmitted" | "submitted" | "under_review" | "approved" | "rejected"
          current_stage: number
          created_at: string
          updated_at: string
          submitted_at: string | null
          approved_at: string | null
          rejected_at: string | null
        }
        Insert: {
          id?: string
          application_id?: string
          applicant_name: string
          physical_address: string
          postal_address?: string | null
          customer_account_number: string
          cellular_number: string
          number_of_boreholes?: number
          land_size: number
          gps_latitude: number
          gps_longitude: number
          water_source: string
          water_source_details?: string | null
          permit_type: string
          intended_use: string
          water_allocation?: number
          validity_period?: number
          comments?: string | null
          status?: "unsubmitted" | "submitted" | "under_review" | "approved" | "rejected"
          current_stage?: number
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          approved_at?: string | null
          rejected_at?: string | null
        }
        Update: {
          id?: string
          application_id?: string
          applicant_name?: string
          physical_address?: string
          postal_address?: string | null
          customer_account_number?: string
          cellular_number?: string
          number_of_boreholes?: number
          land_size?: number
          gps_latitude?: number
          gps_longitude?: number
          water_source?: string
          water_source_details?: string | null
          permit_type?: string
          intended_use?: string
          water_allocation?: number
          validity_period?: number
          comments?: string | null
          status?: "unsubmitted" | "submitted" | "under_review" | "approved" | "rejected"
          current_stage?: number
          updated_at?: string
          submitted_at?: string | null
          approved_at?: string | null
          rejected_at?: string | null
        }
      }
      workflow_comments: {
        Row: {
          id: string
          application_id: string
          user_id: string
          user_type: string
          comment: string
          stage: number
          is_rejection_reason: boolean
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          user_id: string
          user_type: string
          comment: string
          stage: number
          is_rejection_reason?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          user_id?: string
          user_type?: string
          comment?: string
          stage?: number
          is_rejection_reason?: boolean
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          user_type: string
          action: string
          details: string
          application_id: string | null
          ip_address: string | null
          user_agent: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          user_type: string
          action: string
          details: string
          application_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_type?: string
          action?: string
          details?: string
          application_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          application_id: string
          file_name: string
          file_type: string
          file_size: number
          document_type: string
          file_url: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          application_id: string
          file_name: string
          file_type: string
          file_size: number
          document_type: string
          file_url: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          file_name?: string
          file_type?: string
          file_size?: number
          document_type?: string
          file_url?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string | null
          subject: string
          message: string
          is_public: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id?: string | null
          subject: string
          message: string
          is_public?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string | null
          subject?: string
          message?: string
          is_public?: boolean
          read_at?: string | null
        }
      }
    }
  }
}
