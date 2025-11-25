-- Create roles and users tables for Active Directory based roles and permissions
-- Run this script to create the necessary tables
-- Usage: psql -h localhost -U kyb -d kyb_case -f create-roles-and-users-tables.sql

-- Create roles table
CREATE TABLE IF NOT EXISTS entity_configuration.roles (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS entity_configuration.role_permissions (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    permission_name VARCHAR(200) NOT NULL,
    resource VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_role_permission_role 
        FOREIGN KEY (role_id) 
        REFERENCES entity_configuration.roles("Id") 
        ON DELETE CASCADE
);

-- Create users table
CREATE TABLE IF NOT EXISTS entity_configuration.users (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(200),
    first_login_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS entity_configuration.user_permissions (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    permission_name VARCHAR(200) NOT NULL,
    resource VARCHAR(200),
    description VARCHAR(1000),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    CONSTRAINT fk_user_permission_user 
        FOREIGN KEY (user_id) 
        REFERENCES entity_configuration.users("Id") 
        ON DELETE CASCADE
);

-- Create user_role_assignments table
CREATE TABLE IF NOT EXISTS entity_configuration.user_role_assignments (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    role_display_name VARCHAR(200) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_role_assignment_user 
        FOREIGN KEY (user_id) 
        REFERENCES entity_configuration.users("Id") 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_role_assignment_role 
        FOREIGN KEY (role_id) 
        REFERENCES entity_configuration.roles("Id") 
        ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON entity_configuration.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON entity_configuration.roles(is_active);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON entity_configuration.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON entity_configuration.users(email);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON entity_configuration.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON entity_configuration.user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id ON entity_configuration.user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_role ON entity_configuration.user_role_assignments(user_id, role_id);

