import React, { useState, useEffect } from 'react';

function TestQuizAPI() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Making API request to /api/questions');
        const response = await fetch('/api/questions?course_id=demo_course&level=Easy');
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        if (response.ok) {
          const result = await response.json();
          console.log('API Response data:', result);
          setData(result);
        } else {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          setError(`API Error: ${response.status} - ${errorText}`);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Fetch error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Testing Quiz API</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Testing Quiz API</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p><strong>Error:</strong> {error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Testing Quiz API</h2>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <p><strong>Success!</strong> Received {data.length} questions from the API</p>
      </div>
      
      {data.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-2">First Question Preview:</h3>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p><strong>ID:</strong> {data[0].id}</p>
            <p><strong>Question Number:</strong> {data[0].question_number}</p>
            <p><strong>Question:</strong> {data[0].question_text}</p>
            <p><strong>Options:</strong> {JSON.stringify(data[0].options)}</p>
            <p><strong>Correct Answer Index:</strong> {data[0].correct_answer}</p>
            <p><strong>Source Document:</strong> {data[0].documentName || 'Unknown'}</p>
          </div>
        </>
      )}
      
      <h3 className="text-lg font-semibold mt-4 mb-2">Summary:</h3>
      <div className="bg-blue-50 p-4 rounded-lg">
        <p>Total Questions: {data.length}</p>
        <p className="text-sm text-gray-600 mt-2">Showing questions from the most recent upload only.</p>
        <p>Sample of question types:</p>
        <ul className="list-disc list-inside mt-2">
          {data.slice(0, 5).map((q, i) => (
            <li key={i}>Q{q.question_number}: {q.question_text.substring(0, 50)}...</li>
          ))}
        </ul>
      </div>
      
      <h3 className="text-lg font-semibold mt-4 mb-2">Raw Data (First 3 questions):</h3>
      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm">
        {JSON.stringify(data.slice(0, 3), null, 2)}
      </pre>
    </div>
  );
}

export default TestQuizAPI;