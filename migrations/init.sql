-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS architecture_colleagues_team (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    bio TEXT,
    image_url TEXT,
    linkedin_url TEXT,
    email VARCHAR(255),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS architecture_colleagues_mission (
    id SERIAL PRIMARY KEY,
    mission_statement TEXT NOT NULL,
    vision_statement TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS architecture_colleagues_values (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS architecture_colleagues_contact (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data if tables are empty
INSERT INTO architecture_colleagues_mission (mission_statement, vision_statement)
SELECT 
    'To democratize architectural education by creating a platform where students and professionals can learn from each other.',
    'We envision a world where architectural development is continuous, collaborative, and integrated into daily practice.'
WHERE NOT EXISTS (SELECT 1 FROM architecture_colleagues_mission);

INSERT INTO architecture_colleagues_values (title, description, display_order)
SELECT 'Collaboration', 'We believe in the power of collective knowledge and shared experiences.', 1
WHERE NOT EXISTS (SELECT 1 FROM architecture_colleagues_values);

-- Add more sample values if needed