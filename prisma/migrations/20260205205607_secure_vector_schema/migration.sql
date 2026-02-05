-- Create the schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS "extensions";

-- Move the extension
ALTER EXTENSION "vector" SET SCHEMA "extensions";

-- Grant usage (adjust roles as needed for Supabase)
GRANT USAGE ON SCHEMA "extensions" TO "postgres";
GRANT USAGE ON SCHEMA "extensions" TO "anon";
GRANT USAGE ON SCHEMA "extensions" TO "authenticated";
GRANT USAGE ON SCHEMA "extensions" TO "service_role";

-- Ensure search path includes extensions (this changes db default)
ALTER DATABASE "postgres" SET search_path TO "$user", public, extensions;
