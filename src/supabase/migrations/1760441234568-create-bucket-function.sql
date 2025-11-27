/* # Create Storage Bucket Function
    1. Function Creation
    - Create RPC function to initialize quiz-docs bucket
    - Handle bucket creation with proper error handling

    2. Security
    - Allow authenticated users to call the function
    - Include proper error handling for existing bucket
    */

    -- Drop function if exists to avoid conflicts
    DROP FUNCTION IF EXISTS create_quiz_docs_bucket();

    -- Create function to initialize quiz-docs bucket
    CREATE OR REPLACE FUNCTION create_quiz_docs_bucket()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      -- Insert bucket if it doesn't exist
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

      -- Create policies if they don't exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can upload quiz documents'
      ) THEN
        CREATE POLICY "Users can upload quiz documents"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'quiz-docs' 
          AND auth.role() = 'authenticated'
        );
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can read quiz documents'
      ) THEN
        CREATE POLICY "Users can read quiz documents"
        ON storage.objects FOR SELECT
        USING (
          bucket_id = 'quiz-docs' 
          AND auth.role() = 'authenticated'
        );
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can update quiz documents'
      ) THEN
        CREATE POLICY "Users can update quiz documents"
        ON storage.objects FOR UPDATE
        USING (
          bucket_id = 'quiz-docs' 
          AND auth.role() = 'authenticated'
        );
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can delete quiz documents'
      ) THEN
        CREATE POLICY "Users can delete quiz documents"
        ON storage.objects FOR DELETE
        USING (
          bucket_id = 'quiz-docs' 
          AND auth.role() = 'authenticated'
        );
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the function
        RAISE NOTICE 'Error creating bucket or policies: %', SQLERRM;
    END;
    $$;

    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION create_quiz_docs_bucket() TO authenticated;
    GRANT EXECUTE ON FUNCTION create_quiz_docs_bucket() TO anon;