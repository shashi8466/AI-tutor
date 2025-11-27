import React, { useState, useEffect } from 'react';

function SimpleQuizViewer() {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, []);

  // Trigger MathJax rendering when quiz data changes
  useEffect(() => {
    if (window.MathJax && quiz && quiz.questions && quiz.questions.length > 0) {
      console.log('Triggering MathJax rendering for', quiz.questions.length, 'questions');
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        window.MathJax.typesetPromise?.()
          .then(() => console.log('MathJax rendering completed'))
          .catch((err) => console.error('MathJax error:', err));
      });
    }
  }, [quiz]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching quiz questions for demo_course, Easy level');
      // Fetch questions for the demo course
      const response = await fetch('/api/questions?course_id=demo_course&level=Easy');
      console.log('API Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Received quiz data:', data.length, 'questions');
        console.log('First question sample:', data[0]);
        
        // Validate the data structure
        if (Array.isArray(data) && data.length > 0) {
          // Sort questions by question_number to ensure correct order
          const sortedQuestions = data.sort((a, b) => {
            const numA = a.question_number || 0;
            const numB = b.question_number || 0;
            return numA - numB;
          });
          
          // Process each question to ensure proper structure
          const processedQuestions = sortedQuestions.map(q => {
            // Ensure options is an array
            if (!Array.isArray(q.options)) {
              q.options = [];
            }
            
            // Ensure question_type is set
            if (!q.question_type) {
              q.question_type = q.options.length > 0 ? 'mcq' : 'short_answer';
            }
            
            // Validate correct_answer index for MCQ questions
            if (q.question_type === 'mcq' && q.options.length > 0) {
              if (q.correct_answer < 0 || q.correct_answer >= q.options.length) {
                console.warn('Invalid correct_answer index for question, setting to 0:', q);
                q.correct_answer = 0; // Default to first option
              }
            }
            
            return q;
          });
          
          setQuiz({
            title: 'Demo Quiz',
            questions: processedQuestions
          });
          setAnswers(Array(processedQuestions.length).fill(null));
        } else {
          setError('No questions found in the response');
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch quiz:', response.status, errorText);
        setError(`Failed to fetch quiz: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError(`Error fetching quiz: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qIndex, optIndex) => {
    const updated = [...answers];
    updated[qIndex] = optIndex;
    setAnswers(updated);
  };

  const handleSubmit = () => {
    if (!quiz || !quiz.questions) return;
    
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={fetchQuiz}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">No Quiz Available</h2>
        <p className="text-gray-600 mb-4">No quiz questions found. Please upload a document first.</p>
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-blue-800 font-medium">Note:</p>
          <p className="text-blue-700 text-sm">This viewer now shows only questions from the most recent upload. If you've uploaded multiple documents, only the latest one will be displayed.</p>
        </div>
        <button 
          onClick={fetchQuiz}
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">{quiz.title}</h2>
      <p className="text-sm text-gray-500 mb-4">Loaded {quiz.questions.length} questions</p>
      
      {quiz.questions.map((q, i) => (
        <div key={q.id || i} className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">
            Q{q.question_number || i + 1}: <span dangerouslySetInnerHTML={{ __html: q.question_text || 'No question text' }} />
          </h3>
          
          {/* Render tables if available */}
          {q.tables && q.tables.length > 0 && (
            <div className="mb-4 overflow-x-auto">
              {q.tables.map((table, tableIdx) => (
                <table key={tableIdx} className="min-w-full border-collapse border border-gray-300 mb-2">
                  <tbody>
                    {/* Check if table is an object with rows property or a direct array */}
                    {(Array.isArray(table) ? table : table.rows || []).map((row, rowIdx) => (
                      <tr key={rowIdx} className={row.isHeader ? 'bg-gray-100' : 'bg-white'}>
                        {/* Check if row is an object with cells property or a direct array */}
                        {(Array.isArray(row) ? row : row.cells || []).map((cell, cellIdx) => (
                          <td 
                            key={cellIdx} 
                            className="border border-gray-300 px-3 py-2"
                            dangerouslySetInnerHTML={{ __html: typeof cell === 'object' && cell !== null ? (cell.content || '') : (cell || '') }}
                          />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          )}
          
          {/* Render image if available */}
          {q.image_url && (
            <div className="mb-4">
              {q.image_url.startsWith('data:') ? (
                // Handle base64 encoded images
                <img 
                  src={q.image_url}
                  alt="Question diagram" 
                  className="max-w-full h-auto rounded border"
                  onError={(e) => {
                    console.log('Base64 image failed to load:', q.image_url);
                    e.target.style.display = 'none';
                  }}
                />
              ) : q.image_url.startsWith('http') ? (
                // Handle absolute URLs
                <img 
                  src={q.image_url}
                  alt="Question diagram" 
                  className="max-w-full h-auto rounded border"
                  onError={(e) => {
                    console.log('Image failed to load:', q.image_url);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                // Handle relative paths
                <img 
                  src={q.image_url.startsWith('/') ? q.image_url : `/${q.image_url}`}
                  alt="Question diagram" 
                  className="max-w-full h-auto rounded border"
                  onError={(e) => {
                    console.log('Relative image failed to load:', q.image_url);
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>
          )}
          
          {/* Options */}
          {(q.options && q.options.length > 0) ? (
            <ul className="space-y-2">
              {q.options.map((opt, idx) => (
                <li key={idx}>
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      name={`q-${i}`}
                      checked={answers[i] === idx}
                      onChange={() => handleSelect(i, idx)}
                      disabled={submitted}
                      className="mt-1 mr-3"
                    />
                    <span dangerouslySetInnerHTML={{ __html: opt || `Option ${idx + 1}` }} />
                  </label>
                </li>
              ))}
            </ul>
          ) : q.question_type === 'short_answer' ? (
            <div className="space-y-4 mt-4">
              <input
                type="text"
                value={answers[i] !== null ? (typeof answers[i] === 'string' ? answers[i] : '') : ''}
                onChange={(e) => {
                  const updated = [...answers];
                  updated[i] = e.target.value;
                  setAnswers(updated);
                }}
                disabled={submitted}
                placeholder="Type your answer here..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>
          ) : (
            <div className="text-gray-500 italic">
              No options available for this question
            </div>
          )}
          
          {/* Debug info */}
          <div className="mt-2 text-xs text-gray-400">
            ID: {q.id || 'Unknown'} | Correct Answer: {q.correct_answer !== undefined ? q.correct_answer : 'N/A'} | Source: {q.documentName || 'Unknown'} | Type: {q.question_type || 'mcq'}
          </div>
        </div>
      ))}
      
      {!submitted ? (
        <div className="text-center">
          <button 
            onClick={handleSubmit}
            disabled={answers.every(a => a === null)}
            className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Submit Quiz
          </button>
        </div>
      ) : (
        <div className="text-center p-6 bg-green-50 rounded-lg">
          <h3 className="text-xl font-bold text-green-800 mb-2">Quiz Completed!</h3>
          <p className="text-lg">
            Your Score: <span className="font-bold">{score}</span> / {quiz.questions.length}
          </p>
          <p className="text-gray-600 mt-2">
            Percentage: {Math.round((score / quiz.questions.length) * 100)}%
          </p>
          <button 
            onClick={() => {
              setSubmitted(false);
              setAnswers(Array(quiz.questions.length).fill(null));
              setScore(0);
            }}
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
}

export default SimpleQuizViewer;