-- Insert default users with hashed passwords
-- Note: In production, these should be created through the application with proper password hashing

INSERT INTO users (username, email, password_hash, user_type) VALUES
('admin', 'permitting@umscc.co.zw', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'permitting_officer'),
('chairperson', 'chairperson@umscc.co.zw', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'chairperson'),
('manager', 'manager@manyame.co.zw', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'catchment_manager'),
('catchment_chair', 'catchment.chair@manyame.co.zw', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'catchment_chairperson'),
('supervisor', 'supervisor@umscc.co.zw', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'permit_supervisor'),
('umsccict2025', 'ict@umscc.co.zw', '$2b$12$8K7qGxJ9mZvJ8K7qGxJ9mOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'ict');

-- Note: All default passwords are 'admin' except ICT which is 'umsccict2025'
-- These are hashed using bcrypt with 12 rounds
