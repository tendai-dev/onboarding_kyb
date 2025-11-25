-- Create wizard_configurations table
CREATE TABLE IF NOT EXISTS entity_configuration.wizard_configurations (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type_id UUID NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_wizard_configuration_entity_type 
        FOREIGN KEY (entity_type_id) 
        REFERENCES entity_configuration.entity_types("Id") 
        ON DELETE CASCADE
);

-- Create wizard_steps table
CREATE TABLE IF NOT EXISTS entity_configuration.wizard_steps (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wizard_configuration_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(500) NOT NULL,
    requirement_types TEXT NOT NULL DEFAULT '[]',
    checklist_category VARCHAR(100) NOT NULL DEFAULT '',
    step_number INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_wizard_step_configuration 
        FOREIGN KEY (wizard_configuration_id) 
        REFERENCES entity_configuration.wizard_configurations("Id") 
        ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wizard_configurations_entity_type_id 
    ON entity_configuration.wizard_configurations(entity_type_id);
CREATE INDEX IF NOT EXISTS idx_wizard_steps_configuration_id 
    ON entity_configuration.wizard_steps(wizard_configuration_id);
CREATE INDEX IF NOT EXISTS idx_wizard_steps_step_number 
    ON entity_configuration.wizard_steps(wizard_configuration_id, step_number);

