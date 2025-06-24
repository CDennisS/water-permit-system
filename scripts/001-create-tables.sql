-- UMSCC Permit Management System Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN (
        'permitting_officer', 
        'chairperson', 
        'catchment_manager', 
        'catchment_chairperson', 
        'permit_supervisor', 
        'ict'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permit applications table
CREATE TABLE IF NOT EXISTS permit_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id VARCHAR(20) UNIQUE NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    customer_account_number VARCHAR(50),
    cellular_number VARCHAR(20),
    physical_address TEXT,
    postal_address TEXT,
    permit_type VARCHAR(50) NOT NULL CHECK (permit_type IN ('borehole', 'surface_water')),
    intended_use TEXT,
    land_size DECIMAL(10,2),
    number_of_boreholes INTEGER DEFAULT 0,
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),
    water_source TEXT,
    water_allocation DECIMAL(10,2),
    validity_period INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'unsubmitted' CHECK (status IN (
        'unsubmitted', 
        'submitted', 
        'under_review', 
        'approved', 
        'rejected'
    )),
    current_stage INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Workflow comments table
CREATE TABLE IF NOT EXISTS workflow_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES permit_applications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    stage INTEGER NOT NULL,
    comment TEXT NOT NULL,
    action VARCHAR(50) CHECK (action IN ('approve', 'reject', 'request_info')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    application_id UUID REFERENCES permit_applications(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    application_id UUID REFERENCES permit_applications(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES permit_applications(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    file_path TEXT,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_status ON permit_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_by ON permit_applications(created_by);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON permit_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_application_id ON workflow_comments(application_id);
CREATE INDEX IF NOT EXISTS idx_logs_application_id ON activity_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_application_id ON messages(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);

-- Insert default users
INSERT INTO users (username, password_hash, user_type) VALUES
    ('admin', '$2b$10$rQZ9vKzf8xGxJ5YvJ5YvJeO5YvJ5YvJ5YvJ5YvJ5YvJ5YvJ5YvJ5Y', 'permitting_officer'),
    ('chairperson', '$2b$10$rQZ9vKzf8xGxJ5YvJ5YvJeO5YvJ5YvJ5YvJ5YvJ5YvJ5YvJ5YvJ5Y', 'chairperson'),
    ('catchment_mgr', '$2b$10$rQZ9vKzf8xGxJ5YvJ5YvJeO5YvJ5YvJ5YvJ5YvJ5YvJ5YvJ5YvJ5Y', 'catchment_manager'),
    ('catchment_chair', '$2b$10$rQZ9vKzf8xGxJ5YvJ5YvJeO5YvJ5YvJ5YvJ5YvJ5YvJ5YvJ5YvJ5Y', 'catchment_chairperson'),
    ('supervisor', '$2b$10$rQZ9vKzf8xGxJ5YvJ5YvJeO5YvJ5YvJ5YvJ5YvJ5YvJ5YvJ5YvJ5Y', 'permit_supervisor'),
    ('umsccict2025', '$2b$10$rQZ9vKzf8xGxJ5YvJ5YvJeO5YvJ5YvJ5YvJ5YvJ5YvJ5YvJ5YvJ5Y', 'ict')
ON CONFLICT (username) DO NOTHING;

-- Insert sample permit applications for testing
INSERT INTO permit_applications (
    application_id, applicant_name, customer_account_number, cellular_number,
    physical_address, postal_address, permit_type, intended_use, land_size,
    number_of_boreholes, gps_latitude, gps_longitude, water_source,
    water_allocation, validity_period, status, current_stage, created_by
) VALUES
    ('MC2024-0001', 'John Smith', 'ACC001234', '0712345678',
     '123 Main Street, Harare', 'P.O. Box 1234, Harare', 'borehole',
     'Domestic water supply for residential property', 0.5, 1,
     -17.8252, 31.0335, 'Groundwater from shallow aquifer',
     2.5, 5, 'approved', 6, (SELECT id FROM users WHERE username = 'admin')),
    
    ('MC2024-0002', 'Mary Johnson', 'ACC005678', '0723456789',
     '456 Oak Avenue, Bulawayo', 'P.O. Box 5678, Bulawayo', 'surface_water',
     'Irrigation for commercial farming operations', 15.0, 0,
     -20.1504, 28.5906, 'Seasonal river with dam construction',
     45.0, 10, 'under_review', 4, (SELECT id FROM users WHERE username = 'admin')),
    
    ('MC2024-0003', 'Robert Wilson', 'ACC009876', '0734567890',
     '789 Pine Road, Mutare', 'P.O. Box 9876, Mutare', 'borehole',
     'Industrial water supply for manufacturing', 2.0, 3,
     -18.9707, 32.6731, 'Deep groundwater aquifer system',
     12.0, 7, 'submitted', 2, (SELECT id FROM users WHERE username = 'admin')),
    
    ('MC2024-0004', 'Sarah Davis', 'ACC004321', '0745678901',
     '321 Cedar Street, Gweru', 'P.O. Box 4321, Gweru', 'surface_water',
     'Municipal water supply expansion', 0.8, 0,
     -19.4543, 29.8154, 'Municipal reservoir and treatment plant',
     25.0, 15, 'rejected', 5, (SELECT id FROM users WHERE username = 'admin')),
    
    ('MC2024-0005', 'Michael Brown', 'ACC007890', '0756789012',
     '654 Birch Lane, Masvingo', 'P.O. Box 7890, Masvingo', 'borehole',
     'Agricultural irrigation for crop production', 8.5, 2,
     -20.0637, 30.8267, 'Intermediate groundwater aquifer',
     18.5, 8, 'unsubmitted', 1, (SELECT id FROM users WHERE username = 'admin'))
ON CONFLICT (application_id) DO NOTHING;

-- Update timestamps for sample data
UPDATE permit_applications SET
    submitted_at = created_at + INTERVAL '1 day',
    approved_at = CASE 
        WHEN status = 'approved' THEN created_at + INTERVAL '35 days'
        ELSE NULL
    END
WHERE application_id LIKE 'MC2024-%';

COMMIT;

-- Display success message
SELECT 'Database schema created successfully!' as message;
SELECT 'Sample data inserted!' as message;
SELECT COUNT(*) as total_applications FROM permit_applications;
SELECT COUNT(*) as total_users FROM users;
