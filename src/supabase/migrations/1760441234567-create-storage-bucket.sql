/* # Create Storage Bucket for Quiz Documents
    1. Storage Setup
    - Create quiz-docs bucket for storing uploaded quiz documents
    - Set up appropriate storage policies for public access
    
    2. Security
    - Enable RLS for storage policies
    - Add policies for file upload and access control
    */

    -- Create storage bucket for quiz documents
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'quiz-docs',
      'quiz-docs',
      false,
      52428800,  -- 50MB limit
      ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
    )
    ON CONFLICT (id) DO NOTHING;

    -- Enable RLS for storage objects if not already enabled
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'objects' AND n.nspname = 'storage'
      ) THEN
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      END IF;
    END $$;

    -- Drop existing policies if they exist to avoid conflicts
    DROP POLICY IF EXISTS "Users can upload quiz documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can read quiz documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update quiz documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete quiz documents" ON storage.objects;

    -- Policy to allow authenticated users to upload files
    CREATE POLICY "Users can upload quiz documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'quiz-docs' 
      AND auth.role() = 'authenticated'
    );

    -- Policy to allow authenticated users to read files
    CREATE POLICY "Users can read quiz documents"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'quiz-docs' 
      AND auth.role() = 'authenticated'
    );

    -- Policy to allow authenticated users to update files
    CREATE POLICY "Users can update quiz documents"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'quiz-docs' 
      AND auth.role() = 'authenticated'
    );

    -- Policy to allow authenticated users to delete files
    CREATE POLICY "Users can delete quiz documents"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'quiz-docs' 
      AND auth.role() = 'authenticated'
    );