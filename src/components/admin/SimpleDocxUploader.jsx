import { useState } from 'react';

function SimpleDocxUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setMessage('Uploading...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('course_id', 'demo_course');
      formData.append('level', 'Easy');

      // Fixed the endpoint from /api/uploads to /api/upload
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`Upload successful! File ID: ${result.id}`);
      } else {
        const errorText = await response.text();
        try {
          const error = JSON.parse(errorText);
          setMessage(`Upload failed: ${error.error}`);
        } catch (e) {
          setMessage(`Upload failed: ${errorText}`);
        }
      }
    } catch (error) {
      setMessage(`Upload error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Upload Quiz Document</h2>
      <div className="mb-4">
        <input
          type="file"
          accept=".docx,.pdf,.txt,.zip"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg
          hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors"
      >
        {uploading ? 'Uploading...' : 'Upload Quiz'}
      </button>
      {message && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
      )}
    </div>
  );
}

export default SimpleDocxUploader;