-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('permitting_officer', 'chairperson', 'catchment_manager', 'catchment_chairperson', 'permit_supervisor', 'ict')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id VARCHAR(50) UNIQUE NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    physical_address TEXT NOT NULL,
    postal_address VARCHAR(255),
    customer_account_number VARCHAR(100) NOT NULL,
    cellular_number VARCHAR(20) NOT NULL,
    number_of_boreholes INTEGER DEFAULT 1,
    land_size DECIMAL(10,2) NOT NULL,
    gps_latitude DECIMAL(10,6) NOT NULL,
    gps_longitude DECIMAL(10,6) NOT NULL,
    water_source VARCHAR(50) NOT NULL,
    water_source_details TEXT,
    permit_type VARCHAR(50) NOT NULL,
    intended_use VARCHAR(255) NOT NULL,
    water_allocation DECIMAL(10,2) DEFAULT 2500,
    validity_period INTEGER DEFAULT 5,
    comments TEXT,
    status VARCHAR(20) DEFAULT 'unsubmitted' CHECK (status IN ('unsubmitted', 'submitted', 'under_review', 'approved', 'rejected')),
    current_stage INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE
);

-- Create workflow_comments table
CREATE TABLE workflow_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    user_type VARCHAR(50) NOT NULL,
    comment TEXT NOT NULL,
    stage INTEGER NOT NULL,
    is_rejection_reason BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    user_type VARCHAR(50) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    application_id UUID REFERENCES applications(id),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_current_stage ON applications(current_stage);
CREATE INDEX idx_applications_created_at ON applications(created_at);
CREATE INDEX idx_workflow_comments_application_id ON workflow_comments(application_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_documents_application_id ON documents(application_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
