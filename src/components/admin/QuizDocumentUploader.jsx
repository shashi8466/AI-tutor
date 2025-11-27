import { useState, useEffect } from 'react';
import SafeIcon from '../../common/SafeIcon';
import QuizQuestionEditor from './QuizQuestionEditor';
import * as FiIcons from 'react-icons/fi';
const { FiUpload, FiFile, FiCheckCircle, FiTrash2, FiLoader, FiAlertCircle, FiEdit2, FiRefreshCw } = FiIcons;

    // SQL backend uploader (replaces Supabase/Firebase)

    const QuizDocumentUploader = ({ courseId, onUploadComplete }) => {
      const [uploads, setUploads] = useState({
        Easy: [],
        Medium: [],
        Hard: []
      });
      const [uploading, setUploading] = useState(false);
      const [processingStatus, setProcessingStatus] = useState({});
      const [error, setError] = useState(null);
      const [bucketInitialized, setBucketInitialized] = useState(false);
      const [showEditor, setShowEditor] = useState(false);
      const [editorLevel, setEditorLevel] = useState(null);

      // Storage availability flag (server handles disk storage)

      // Initialize bucket on component mount
      useEffect(() => {
        initializeStorage();
      }, []);

      const initializeStorage = async () => {
        setBucketInitialized(true);
      };

      const handleFileUpload = async (level, files) => {
        if (!files || files.length === 0) return;
        
        setUploading(true);
        setError(null);
        
        const newUploads = [...uploads[level]];
        
        for (const file of files) {
          try {
            let uploadRecord = null;
            const form = new FormData();
            form.append('course_id', courseId);
            form.append('level', level);
            form.append('file', file);

            // Fixed the endpoint from /api/uploads to /api/upload
            const resp = await fetch('/api/upload', { method: 'POST', body: form });
            if (!resp.ok) {
              const errorData = await resp.json().catch(() => ({}));
              throw new Error(errorData.error || `Upload failed with status ${resp.status}`);
            }
            uploadRecord = await resp.json();
            
            newUploads.push({ ...uploadRecord, file: file });
            
            // Trigger processing
            setProcessingStatus(prev => ({
              ...prev,
              [uploadRecord.id]: 'processing'
            }));
            
            // Server parses immediately; mark processed after brief delay
            setTimeout(async () => {
              setProcessingStatus(prev => ({
                ...prev,
                [uploadRecord.id]: 'processed'
              }));
            }, 800);
            
            // Refresh uploads list
            await fetchUploads();
          } catch (error) {
            console.error('Upload failed:', error);
            setError(error.message);
          }
        }
        
        setUploading(false);
        onUploadComplete?.();
      };

      const fetchUploads = async () => {
        try {
          // Fixed the endpoint from /api/uploads to /api/upload
          const resp = await fetch(`/api/upload?course_id=${encodeURIComponent(courseId)}`);
          if (!resp.ok) throw new Error('Failed to load uploads');
          const data = await resp.json();
          const groupedUploads = { Easy: [], Medium: [], Hard: [] };
          data.forEach(upload => {
            if (groupedUploads[upload.level]) {
              groupedUploads[upload.level].push(upload);
            }
          });
          setUploads(groupedUploads);
        } catch (err) {
          console.error('Error fetching uploads:', err);
        }
      };

      useEffect(() => {
        if (courseId) {
          fetchUploads();
        }
      }, [courseId]);

      const processQuizDocument = async (_uploadId, _file, _level) => {};

      const handleDeleteUpload = async (level, uploadId, index) => {
        try {
          // Delete via API
          await fetch(`/api/upload/${encodeURIComponent(uploadId)}`, { method: 'DELETE' });
          
          // Remove from local state
          setUploads(prev => ({
            ...prev,
            [level]: prev[level].filter((_, i) => i !== index)
          }));
        } catch (error) {
          console.error('Delete error:', error);
        }
      };

      // New function to handle reparse
      const handleReparseUpload = async (uploadId) => {
        try {
          setProcessingStatus(prev => ({
            ...prev,
            [uploadId]: 'processing'
          }));
          
          const resp = await fetch(`/api/upload/${encodeURIComponent(uploadId)}/reparse`, { 
            method: 'POST' 
          });
          
          if (!resp.ok) {
            throw new Error('Reparse failed');
          }
          
          // Refresh uploads list
          await fetchUploads();
        } catch (error) {
          console.error('Reparse error:', error);
          setProcessingStatus(prev => ({
            ...prev,
            [uploadId]: 'error'
          }));
        }
      };

      const levels = ['Easy', 'Medium', 'Hard'];

      return (
        <div className="space-y-6">
          {showEditor && (
            <QuizQuestionEditor 
              courseId={courseId}
              level={editorLevel}
              onClose={() => {
                setShowEditor(false);
                setEditorLevel(null);
              }}
            />
          )}
          
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Upload Quiz Documents</h3>
          <p className="text-sm text-gray-600 mb-6">
            Upload quiz documents (DOCX, PDF, TXT, or ZIP) for each difficulty level. These will be used to generate quiz questions for students.
            {!bucketInitialized && (
              <span className="block mt-2 text-yellow-600">
                ⚠️ Storage not available - files will be saved locally only
              </span>
            )}
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiAlertCircle} className="h-5 w-5 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}
          
          {levels.map(level => (
            <div key={level} className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">{level} Level</h4>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Edit Questions clicked for level:', level);
                      setEditorLevel(level);
                      setShowEditor(true);
                    }}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center space-x-1"
                  >
                    <SafeIcon icon={FiEdit2} className="h-4 w-4" />
                    <span>Edit Questions</span>
                  </button>
                  <span className="text-sm text-gray-500">
                    {uploads[level].length} file{uploads[level].length !== 1 ? 's' : ''} uploaded
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  accept=".docx,.pdf,.txt,.zip"
                  onChange={(e) => handleFileUpload(level, e.target.files)}
                  className="hidden"
                  id={`quiz-upload-${level}`}
                />
                <label
                  htmlFor={`quiz-upload-${level}`}
                  className="cursor-pointer flex items-center justify-center w-full p-4 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <SafeIcon icon={FiUpload} className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-600">Click to upload {level} level quiz documents</span>
                </label>
              </div>
              
              {uploads[level].length > 0 && (
                <div className="space-y-2">
                  {uploads[level].map((upload, index) => (
                    <div key={upload.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <SafeIcon icon={FiFile} className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{upload.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {upload.file_size && `${(upload.file_size / 1024).toFixed(1)} KB`}
                            {upload.status === 'processed' && ' • ✅ Processed'}
                            {upload.status === 'processing' && ' • ⏳ Processing'}
                            {upload.status === 'error' && ' • ❌ Error'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {processingStatus[upload.id] === 'processing' && (
                          <SafeIcon icon={FiLoader} className="h-4 w-4 text-blue-500 animate-spin" />
                        )}
                        {processingStatus[upload.id] === 'processed' && (
                          <SafeIcon icon={FiCheckCircle} className="h-4 w-4 text-green-500" />
                        )}
                        <button
                          onClick={() => handleReparseUpload(upload.id)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Re-parse document"
                        >
                          <SafeIcon icon={FiRefreshCw} className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUpload(level, upload.id, index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {uploading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Uploading documents… parsing questions will appear automatically for students</span>
              </div>
            </div>
          )}
        </div>
      );
    };

    export default QuizDocumentUploader;