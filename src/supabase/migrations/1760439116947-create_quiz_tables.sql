/* # Create Quiz Uploads and Questions Tables
    1. New Tables
    - `quiz_uploads` - stores metadata about uploaded quiz documents
    - `quiz_questions` - stores parsed questions from documents
    
    2. Security
    - Enable RLS on both tables
    - Add policies for CRUD operations
    */

    -- Create quiz_uploads table to track uploaded quiz documents
    CREATE TABLE IF NOT EXISTS quiz_uploads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id text NOT NULL,
      level text NOT NULL CHECK (level IN ('Easy', 'Medium', 'Hard')),
      file_name text NOT NULL,
      file_path text NOT NULL,
      file_size bigint,
      file_type text,
      uploaded_by uuid REFERENCES auth.users(id),
      uploaded_at timestamptz DEFAULT now(),
      processed_at timestamptz,
      status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'error'))
    );

    -- Create quiz_questions table to store parsed questions
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      quiz_upload_id uuid REFERENCES quiz_uploads(id) ON DELETE CASCADE,
      course_id text NOT NULL,
      level text NOT NULL,
      question_number integer NOT NULL,
      question_text text NOT NULL,
      options jsonb NOT NULL,
      correct_answer integer NOT NULL,
      explanation text,
      created_at timestamptz DEFAULT now()
    );

    -- Add indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_quiz_uploads_course_level ON quiz_uploads(course_id, level);
    CREATE INDEX IF NOT EXISTS idx_quiz_uploads_status ON quiz_uploads(status);
    CREATE INDEX IF NOT EXISTS idx_quiz_questions_course_level ON quiz_questions(course_id, level);
    CREATE INDEX IF NOT EXISTS idx_quiz_questions_upload_id ON quiz_questions(quiz_upload_id);

    -- Enable Row Level Security
    ALTER TABLE quiz_uploads ENABLE ROW LEVEL SECURITY;
    ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

    -- Policies for quiz_uploads
    CREATE POLICY "Anyone can view quiz uploads" 
    ON quiz_uploads FOR SELECT 
    USING (true);

    CREATE POLICY "Admins can insert quiz uploads" 
    ON quiz_uploads FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    );

    CREATE POLICY "Admins can update quiz uploads" 
    ON quiz_uploads FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    );

    CREATE POLICY "Admins can delete quiz uploads" 
    ON quiz_uploads FOR DELETE 
    USING (
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    );

    -- Policies for quiz_questions
    CREATE POLICY "Anyone can view quiz questions" 
    ON quiz_questions FOR SELECT 
    USING (true);

    CREATE POLICY "Admins can manage quiz questions" 
    ON quiz_questions FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    );

    -- Function to get quiz questions for a course and level
    CREATE OR REPLACE FUNCTION get_quiz_questions(p_course_id text, p_level text)
    RETURNS TABLE (
      id uuid,
      question_number integer,
      question_text text,
      options jsonb,
      correct_answer integer,
      explanation text
    ) 
    AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        q.id,
        q.question_number,
        q.question_text,
        q.options,
        q.correct_answer,
        q.explanation
      FROM quiz_questions q
      JOIN quiz_uploads u ON q.quiz_upload_id = u.id
      WHERE q.course_id = p_course_id 
        AND q.level = p_level 
        AND u.status = 'processed'
      ORDER BY q.question_number;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION get_quiz_questions TO authenticated;
    GRANT EXECUTE ON FUNCTION get_quiz_questions TO anon;