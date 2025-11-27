import React, { useState, useEffect } from 'react';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
const { FiEye, FiTrash2, FiFilter, FiSearch, FiCheckCircle, FiAlertCircle } = FiIcons;

const QuizQuestionManager = ({ courseId, courseName, refreshKey }) => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    level: 'All',
    search: ''
  });
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showQuestionDetail, setShowQuestionDetail] = useState(false);

  // Fetch questions for the course
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch questions for all levels of this course
      const levels = ['Easy', 'Medium', 'Hard'];
      const allQuestions = [];
      
      for (const level of levels) {
        try {
          const response = await fetch(`/api/questions?course_id=${encodeURIComponent(courseId)}&level=${encodeURIComponent(level)}`);
          if (response.ok) {
            const levelQuestions = await response.json();
            allQuestions.push(...levelQuestions.map(q => ({ ...q, level })));
          }
        } catch (err) {
          console.warn(`Failed to fetch ${level} questions:`, err);
        }
      }
      
      setQuestions(allQuestions);
      setFilteredQuestions(allQuestions);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchQuestions();
    }
  }, [courseId]);

  // Refetch when external refreshKey increments (e.g., after uploads)
  useEffect(() => {
    if (courseId && typeof refreshKey !== 'undefined') {
      fetchQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Filter questions based on current filters
  useEffect(() => {
    let filtered = questions;
    
    // Filter by level
    if (filters.level !== 'All') {
      filtered = filtered.filter(q => q.level === filters.level);
    }
    
    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(searchLower) ||
        q.explanation?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredQuestions(filtered);
  }, [questions, filters]);

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      // Note: This would require a DELETE endpoint in the server
      console.log('Delete question:', questionId);
      // For now, just refresh the questions
      await fetchQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('Failed to delete question');
    }
  };

  const handleViewQuestion = (question) => {
    setSelectedQuestion(question);
    setShowQuestionDetail(true);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCorrectAnswerLabel = (correctAnswer, options) => {
    const letters = ['A', 'B', 'C', 'D'];
    return letters[correctAnswer] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Loading Quiz Questions</h2>
          <p className="text-gray-600">Fetching questions from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <SafeIcon icon={FiAlertCircle} className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Error Loading Questions</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchQuestions}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">📚 Quiz Questions Manager</h3>
            <p className="text-gray-600 mt-1">Manage parsed questions for {courseName}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Total: {questions.length} questions
            </div>
            <button
              onClick={fetchQuestions}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiFilter} className="h-5 w-5 text-gray-500" />
            <select
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Levels</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 flex-1 min-w-64">
            <SafeIcon icon={FiSearch} className="h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search questions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <SafeIcon icon={FiAlertCircle} className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Questions Found</h3>
            <p className="text-gray-600">
              {questions.length === 0 
                ? 'No questions have been parsed from uploaded documents yet.'
                : 'No questions match your current filters.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(question.level)}`}>
                        {question.level}
                      </span>
                      <span className="text-sm text-gray-500">
                        Q{question.question_number || index + 1}
                      </span>
                      <span className="text-sm text-gray-500">
                        Answer: {getCorrectAnswerLabel(question.correct_answer, question.options)}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {question.question_text}
                    </h4>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {question.options && question.options.map((option, optIndex) => (
                        <span
                          key={optIndex}
                          className={`px-2 py-1 rounded text-xs ${
                            optIndex === question.correct_answer
                              ? 'bg-green-100 text-green-800 font-medium'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </span>
                      ))}
                    </div>
                    
                    {question.explanation && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewQuestion(question)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <SafeIcon icon={FiEye} className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Question"
                    >
                      <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Question Detail Modal */}
      {showQuestionDetail && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Question Details</h3>
                <button
                  onClick={() => setShowQuestionDetail(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiTrash2} className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(selectedQuestion.level)}`}>
                    {selectedQuestion.level}
                  </span>
                  <span className="text-sm text-gray-500">
                    Question {selectedQuestion.question_number || 'N/A'}
                  </span>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Question Text:</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {selectedQuestion.question_text}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Options:</h4>
                  <div className="space-y-2">
                    {selectedQuestion.options && selectedQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          index === selectedQuestion.correct_answer
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                            index === selectedQuestion.correct_answer
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-300 text-gray-700'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-gray-700">{option}</span>
                          {index === selectedQuestion.correct_answer && (
                            <SafeIcon icon={FiCheckCircle} className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedQuestion.explanation && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Explanation:</h4>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {selectedQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizQuestionManager;
