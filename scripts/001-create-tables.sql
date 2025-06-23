-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('permitting_officer', 'chairperson', 'catchment_manager', 'catchment_chairperson', 'permit_supervisor', 'ict')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permit_applications table
CREATE TABLE IF NOT EXISTS permit_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id VARCHAR(50) UNIQUE NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    physical_address TEXT NOT NULL,
    postal_address TEXT NOT NULL,
    customer_account_number VARCHAR(100),
    cellular_number VARCHAR(20) NOT NULL,
    number_of_boreholes INTEGER NOT NULL DEFAULT 1,
    land_size DECIMAL(10,2) NOT NULL,
    gps_latitude DECIMAL(10,8) NOT NULL,
    gps_longitude DECIMAL(11,8) NOT NULL,
    water_source VARCHAR(100) NOT NULL,
    water_source_details TEXT,
    permit_type VARCHAR(100) NOT NULL,
    intended_use TEXT NOT NULL,
    water_allocation DECIMAL(10,2) NOT NULL,
    validity_period INTEGER NOT NULL,
    comments TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'unsubmitted' CHECK (status IN ('unsubmitted', 'submitted', 'under_review', 'approved', 'rejected')),
    current_stage INTEGER NOT NULL DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Create workflow_comments table
CREATE TABLE IF NOT EXISTS workflow_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES permit_applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    user_type VARCHAR(50) NOT NULL,
    stage INTEGER NOT NULL,
    comment TEXT NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('approve', 'reject', 'request_changes', 'comment')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    user_type VARCHAR(50) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    application_id UUID REFERENCES permit_applications(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    application_id UUID REFERENCES permit_applications(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES permit_applications(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    blob_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permit_applications_status ON permit_applications(status);
CREATE INDEX IF NOT EXISTS idx_permit_applications_created_by ON permit_applications(created_by);
CREATE INDEX IF NOT EXISTS idx_permit_applications_current_stage ON permit_applications(current_stage);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_application_id ON workflow_comments(application_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_application_id ON activity_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
