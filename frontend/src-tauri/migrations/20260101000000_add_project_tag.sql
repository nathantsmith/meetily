-- Add project_tag column to meetings for organizing meetings by project
ALTER TABLE meetings ADD COLUMN project_tag TEXT;

-- Index for fast grouping/filtering by tag
CREATE INDEX IF NOT EXISTS idx_meetings_project_tag ON meetings(project_tag);
