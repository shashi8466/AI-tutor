import { useState, useEffect, useRef, useCallback } from 'react';
import SafeIcon from '../../common/SafeIcon';
import ErrorBoundary from './ErrorBoundary';
import * as FiIcons from 'react-icons/fi';
const { FiSave, FiTrash2, FiPlus, FiEdit2, FiX, FiCheck, FiAlertCircle, FiBold, FiItalic, FiList, FiImage } = FiIcons;

// Rich Text Editor Component with MathJax support
const RichTextEditor = ({ value, onChange, placeholder, rows = 4 }) => {
  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    if (editorRef.current && !showPreview) {
      // Only update if different to avoid cursor jumps
      // Use a more careful approach to prevent DOM errors
      try {
        if (editorRef.current && editorRef.current.innerHTML !== (localValue || '')) {
          editorRef.current.innerHTML = localValue || '';
        }
      } catch (e) {
        console.warn('Failed to update editor content:', e);
      }
    }
  }, [localValue, showPreview]);

  useEffect(() => {
    // Render MathJax in preview mode
    if (showPreview && previewRef.current && window.MathJax) {
      window.MathJax.typesetPromise?.([previewRef.current]).catch((err) => console.error('MathJax error:', err));
    }
  }, [showPreview, localValue]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      let newValue = editorRef.current.innerHTML;
      
      // Fix common encoding issues with mathematical symbols
      newValue = newValue.replace(/\uFFFD/g, '^'); // Replace replacement characters with caret
      newValue = newValue.replace(/\u00A0/g, ' '); // Replace non-breaking spaces
      newValue = newValue.replace(/θ/g, '&theta;'); // Proper theta encoding
      newValue = newValue.replace(/π/g, '&pi;'); // Proper pi encoding
      newValue = newValue.replace(/∠/g, '&ang;'); // Proper angle encoding
      
      setLocalValue(newValue);
      onChange(newValue);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    // Prevent common issues that cause cursor jumps
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br><br>');
    }
  }, []);

  const execCommand = useCallback((command, value = null) => {
    // Ensure editor is focused before executing command
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    // Trigger input event to capture changes
    setTimeout(() => handleInput(), 0);
  }, [handleInput]);

  // Handle placeholder display more safely
  useEffect(() => {
    if (!showPreview && editorRef.current && !localValue) {
      try {
        if (editorRef.current.children.length === 0) {
          editorRef.current.innerHTML = `<span class="text-gray-400">${placeholder}</span>`;
        }
      } catch (e) {
        console.warn('Failed to set placeholder:', e);
      }
    }
  }, [localValue, placeholder, showPreview]);

  // Special function to insert mathematical symbols
  const insertMathSymbol = useCallback((symbol) => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, symbol);
    setTimeout(() => handleInput(), 0);
  }, [handleInput]);

  // Special function to insert LaTeX math expressions
  const insertMathExpression = useCallback((expression) => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, `$${expression}$`);
    setTimeout(() => handleInput(), 0);
  }, [handleInput]);

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-100 border-b border-gray-300 p-2 flex items-center space-x-1 flex-wrap">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Bold"
        >
          <SafeIcon icon={FiBold} className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Italic"
        >
          <SafeIcon icon={FiItalic} className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Underline"
        >
          <span className="font-bold">U</span>
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Bullet List"
        >
          <SafeIcon icon={FiList} className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Numbered List"
        >
          <span className="text-xs font-bold">1.</span>
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <select
          onChange={(e) => execCommand('formatBlock', e.target.value)}
          className="text-sm border-0 bg-transparent"
        >
          <option value="">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        {/* Math Symbols */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => insertMathSymbol('&theta;')} // θ
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="Theta (θ)"
          >
            θ
          </button>
          <button
            type="button"
            onClick={() => insertMathSymbol('&pi;')} // π
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="Pi (π)"
          >
            π
          </button>
          <button
            type="button"
            onClick={() => insertMathSymbol('^')}
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="Superscript"
          >
            x^y
          </button>
          <button
            type="button"
            onClick={() => insertMathSymbol('&radic;')} // √
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="Square Root"
          >
            √
          </button>
          <button
            type="button"
            onClick={() => insertMathSymbol('&ang;')} // ∠
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="Angle"
          >
            ∠
          </button>
          <button
            type="button"
            onClick={() => insertMathExpression('frac{a}{b}')} // Fraction
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="Fraction"
          >
            a/b
          </button>
          <button
            type="button"
            onClick={() => insertMathExpression('sqrt{x}')} // Square root
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="Square Root"
          >
            √x
          </button>
        </div>
        <div className="flex-1"></div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`px-3 py-1 text-xs rounded ${
            showPreview ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
          title="Toggle Math Preview"
        >
          {showPreview ? 'Edit' : 'Preview Math'}
        </button>
      </div>
      {/* Editor or Preview */}
      {showPreview ? (
        <div
          ref={previewRef}
          className={`p-3 bg-gray-50 min-h-[${rows * 24}px] max-h-96 overflow-y-auto`}
          style={{ minHeight: `${rows * 24}px` }}
          dangerouslySetInnerHTML={{ __html: localValue || `<span class="text-gray-400">${placeholder}</span>` }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className={`p-3 focus:outline-none bg-white min-h-[${rows * 24}px] max-h-96 overflow-y-auto`}
          style={{ minHeight: `${rows * 24}px` }}
          suppressContentEditableWarning
        />
      )}
    </div>
  );
};

const QuizQuestionEditor = ({ courseId, level, onClose }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    console.log('QuizQuestionEditor mounted with:', { courseId, level });
    fetchQuestions();
  }, [courseId, level]);

  // Trigger MathJax rendering when questions are displayed or editingIndex changes
  useEffect(() => {
    if (window.MathJax && questions.length > 0) {
      setTimeout(() => {
        window.MathJax.typesetPromise?.().catch((err) => console.error('MathJax error:', err));
      }, 100);
    }
  }, [questions, editingIndex]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`/api/questions?course_id=${encodeURIComponent(courseId)}&level=${encodeURIComponent(level)}`);
      if (!resp.ok) throw new Error('Failed to load questions');
      const data = await resp.json();
      
      // DEBUG: Log raw API response
      console.log('Raw API response:', data);
      
      // Transform API data to editable format
      const editableQuestions = data.map(q => ({
        id: q.id,
        question_number: q.question_number,
        question_text: q.question_text,
        options: Array.isArray(q.options) ? q.options : (q.options_json ? JSON.parse(q.options_json || '[]') : []),
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        question_type: q.question_type || 'mcq',
        image_url: q.image_url || null
      }));
      
      setQuestions(editableQuestions);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (index) => {
    try {
      setSaving(true);
      const question = questions[index];
      
      let imageUrl = question.image_url;
      
      // If there's a new image file to upload
      if (question.image_file) {
        const formData = new FormData();
        formData.append('image', question.image_file);
        formData.append('course_id', courseId);
        formData.append('level', level);
        
        const uploadResp = await fetch('/api/upload-question-image', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResp.ok) throw new Error('Failed to upload image');
        
        const uploadData = await uploadResp.json();
        imageUrl = uploadData.imageUrl;
      }
      
      const resp = await fetch(`/api/questions/${question.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: question.question_text,
          options: question.options,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          question_type: question.question_type,
          image_url: imageUrl
        })
      });
      
      if (!resp.ok) throw new Error('Failed to save question');
      
      // Update local state with saved image URL
      setQuestions(prev => prev.map((q, i) => 
        i === index ? { ...q, image_url: imageUrl, image_file: null } : q
      ));
      
      setSuccess(`Question ${question.question_number} saved successfully!`);
      setEditingIndex(null);
      setSaving(false);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (index) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const question = questions[index];
      const resp = await fetch(`/api/questions/${question.id}`, { method: 'DELETE' });
      
      if (!resp.ok) throw new Error('Failed to delete question');
      
      setQuestions(prev => prev.filter((_, i) => i !== index));
      setSuccess('Question deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      id: `new_${Date.now()}`,
      question_number: questions.length + 1,
      question_text: '',
      options: [''], // Start with one empty option for short answer by default
      correct_answer: 0,
      explanation: '',
      question_type: 'short_answer', // Default to short answer
      image_url: null,
      isNew: true
    };
    
    setQuestions(prev => [...prev, newQuestion]);
    setEditingIndex(questions.length);
  };

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const addOption = (questionIndex) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex && q.question_type === 'mcq') {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === questionIndex && q.question_type === 'mcq' && q.options.length > 1) {
        // Create new options array without the removed option
        const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
        
        // Adjust correct_answer if needed
        let newCorrectAnswer = q.correct_answer;
        if (optionIndex < q.correct_answer) {
          // If we removed an option before the correct answer, shift it down
          newCorrectAnswer = Math.max(0, q.correct_answer - 1);
        } else if (optionIndex === q.correct_answer) {
          // If we removed the correct answer, set it to the first option
          newCorrectAnswer = 0;
        } else if (q.correct_answer >= newOptions.length) {
          // If correct answer is now out of bounds, set to last option
          newCorrectAnswer = Math.max(0, newOptions.length - 1);
        }
        
        return { 
          ...q, 
          options: newOptions,
          correct_answer: newCorrectAnswer
        };
      }
      return q;
    }));
  };

  if (loading) {
    console.log('QuizQuestionEditor loading...');
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading questions...</div>
      </div>
    );
  }

  console.log('QuizQuestionEditor rendering with', questions.length, 'questions');
  
  // DEBUG: Log first question structure
  if (questions.length > 0) {
    console.log('First question structure:', questions[0]);
  }

  // If editing a specific question, show full-page editor
  if (editingIndex !== null) {
    const question = questions[editingIndex];
    
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Question {question.question_number}</h2>
              <span className={`inline-block mt-2 px-3 py-1 text-xs rounded ${
                question.question_type === 'mcq' ? 'bg-blue-100 text-blue-800' :
                question.question_type === 'short_answer' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {question.question_type === 'mcq' ? 'Multiple Choice' :
                 question.question_type === 'short_answer' ? 'Short Answer' :
                 'Image Based'}
              </span>
            </div>
            <button
              onClick={() => setEditingIndex(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <SafeIcon icon={FiX} className="h-6 w-6" />
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <SafeIcon icon={FiAlertCircle} className="h-5 w-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <SafeIcon icon={FiX} className="h-4 w-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
              <SafeIcon icon={FiCheck} className="h-5 w-5 text-green-500" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          {/* Question Form */}
          <div className="space-y-6">
            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question
                <span className="ml-2 text-xs text-gray-500">
                  💡 Use $ for inline math: $x^2 + y^2$ or $$ for display: $${'\\frac{a}{b}'}$$
                </span>
              </label>
              <ErrorBoundary>
                <RichTextEditor
                  value={question.question_text}
                  onChange={(value) => updateQuestion(editingIndex, 'question_text', value)}
                  placeholder="Enter question text..."
                  rows={4}
                />
              </ErrorBoundary>
            </div>

            {/* Metadata Row */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Active</option>
                  <option>Draft</option>
                  <option>Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Priority</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Normal</option>
                  <option>High</option>
                  <option>Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input type="text" placeholder="Add tags..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Question/Marks Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Marks</label>
                <input type="number" defaultValue="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select 
                  value={question.question_type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    // When switching to short_answer, ensure we have at least one option for the correct answer
                    if (newType === 'short_answer' && question.options.length === 0) {
                      updateQuestion(editingIndex, 'options', ['']);
                    }
                    // When switching from short_answer to mcq, ensure we have at least 2 options
                    else if (newType === 'mcq' && question.question_type === 'short_answer' && question.options.length < 2) {
                      const newOptions = [...question.options];
                      while (newOptions.length < 2) {
                        newOptions.push('');
                      }
                      updateQuestion(editingIndex, 'options', newOptions);
                      updateQuestion(editingIndex, 'correct_answer', 0);
                    }
                    updateQuestion(editingIndex, 'question_type', newType);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="image_based">Image Based</option>
                </select>
              </div>
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Image (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {question.image_url ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img 
                        src={question.image_url.startsWith('http') ? question.image_url : `http://localhost:5174${question.image_url}`}
                        alt="Question diagram"
                        className="max-w-md h-auto rounded border border-gray-200"
                        onError={(e) => {
                          console.error('Image load failed:', question.image_url);
                          e.target.style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => updateQuestion(editingIndex, 'image_url', null)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                        title="Remove image"
                      >
                        <SafeIcon icon={FiX} className="h-4 w-4" />
                      </button>
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            // Create a temporary URL for preview
                            const imageUrl = URL.createObjectURL(file);
                            updateQuestion(editingIndex, 'image_url', imageUrl);
                            updateQuestion(editingIndex, 'image_file', file);
                          }
                        }}
                        className="hidden"
                        id="change-image"
                      />
                      <label
                        htmlFor="change-image"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        <SafeIcon icon={FiImage} className="h-4 w-4" />
                        <span>Change Image</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <SafeIcon icon={FiImage} className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          // Create a temporary URL for preview
                          const imageUrl = URL.createObjectURL(file);
                          updateQuestion(editingIndex, 'image_url', imageUrl);
                          updateQuestion(editingIndex, 'image_file', file);
                        }
                      }}
                      className="hidden"
                      id="upload-image"
                    />
                    <label
                      htmlFor="upload-image"
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      <SafeIcon icon={FiImage} className="h-4 w-4" />
                      <span>Upload Image</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Options Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Options</label>
                {question.question_type === 'mcq' && (
                  <button
                    type="button"
                    onClick={() => addOption(editingIndex)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                  >
                    <SafeIcon icon={FiPlus} className="h-4 w-4" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>
              
              {/* MCQ Options Layout */}
              {question.question_type === 'mcq' ? (
                <div className="space-y-4">
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          Option {String.fromCharCode(65 + optIndex)}
                        </label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="correct_answer"
                              checked={question.correct_answer === optIndex}
                              onChange={() => updateQuestion(editingIndex, 'correct_answer', optIndex)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">Is Correct?</span>
                          </label>
                          {question.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to remove this option?')) {
                                  removeOption(editingIndex, optIndex);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 text-sm flex items-center space-x-1"
                              title="Remove this option"
                            >
                              <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <ErrorBoundary>
                        <RichTextEditor
                          value={option}
                          onChange={(value) => updateOption(editingIndex, optIndex, value)}
                          placeholder={`Enter option ${String.fromCharCode(65 + optIndex)} text...`}
                          rows={3}
                        />
                      </ErrorBoundary>
                    </div>
                  ))}
                </div>
              ) : (
                /* Short Answer Layout */
                <div className="space-y-4">
                  <div className="border border-gray-300 rounded-lg p-4 bg-white">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correct Answer
                      <span className="ml-2 text-xs text-gray-500">
                        💡 Students will type their answer manually. Case-insensitive comparison will be used.
                      </span>
                    </label>
                    <input
                      type="text"
                      value={question.options[0] || ''}
                      onChange={(e) => updateOption(editingIndex, 0, e.target.value)}
                      placeholder="Enter the correct answer that students should provide..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Example: If the correct answer is "42", students typing "42", " 42 ", or "42.0" will be considered correct.
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Accepted Error Range
                        <span className="ml-2 text-xs text-gray-500">
                          For numeric answers
                        </span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                      <div className="mt-1 text-xs text-gray-500">
                        Allow answers within ± this value (e.g., 0.5 allows answers within ±0.5 of correct)
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marks Awarded
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>Full Marks</option>
                        <option>Partial (0.5)</option>
                        <option>Partial (0.25)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xs text-blue-800">
                      <strong>💡 How Short Answer Grading Works:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Student answers are compared to the correct answer (case-insensitive)</li>
                        <li>Extra spaces are automatically trimmed</li>
                        <li>For numeric answers, the accepted error range is applied</li>
                        <li>Partial marks can be awarded for close answers</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Answer Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Answer Explanation</label>
              <ErrorBoundary>
                <RichTextEditor
                  value={question.explanation}
                  onChange={(value) => updateQuestion(editingIndex, 'explanation', value)}
                  placeholder="Enter detailed explanation..."
                  rows={6}
                />
              </ErrorBoundary>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                type="button"
                onClick={() => handleDeleteQuestion(editingIndex)}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-medium flex items-center space-x-2"
              >
                <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                <span>Delete Question</span>
              </button>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuestion(editingIndex)}
                  disabled={saving}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center space-x-2"
                >
                  <SafeIcon icon={FiSave} className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Update Question'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Quiz Questions</h2>
              <p className="text-sm text-gray-600 mt-1">
                Course: {courseId} | Level: {level} | {questions.length} questions
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <SafeIcon icon={FiX} className="h-6 w-6" />
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <SafeIcon icon={FiAlertCircle} className="h-5 w-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-500">
                <SafeIcon icon={FiX} className="h-4 w-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
              <SafeIcon icon={FiCheck} className="h-5 w-5 text-green-500" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          {/* Questions List */}
          <div className="p-6 space-y-6">
            {questions.map((question, qIndex) => (
              <div key={question.id} className="border border-gray-300 rounded-lg p-6 bg-gray-50">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Question {question.question_number}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded ${
                      question.question_type === 'mcq' ? 'bg-blue-100 text-blue-800' :
                      question.question_type === 'short_answer' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {question.question_type === 'mcq' ? 'Multiple Choice' :
                       question.question_type === 'short_answer' ? 'Short Answer' :
                       'Image Based'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingIndex === qIndex ? (
                      <>
                        <button
                          onClick={() => handleSaveQuestion(qIndex)}
                          disabled={saving}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 flex items-center space-x-1"
                        >
                          <SafeIcon icon={FiSave} className="h-4 w-4" />
                          <span>{saving ? 'Saving...' : 'Save'}</span>
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingIndex(qIndex)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center space-x-1"
                        >
                          <SafeIcon icon={FiEdit2} className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(qIndex)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium flex items-center space-x-1"
                        >
                          <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text
                  </label>
                  {editingIndex === qIndex ? (
                    <RichTextEditor
                      value={question.question_text}
                      onChange={(value) => updateQuestion(qIndex, 'question_text', value)}
                      placeholder="Enter question text..."
                      rows={5}
                    />
                  ) : (
                    <div className="bg-white p-3 rounded-lg border border-gray-200" dangerouslySetInnerHTML={{ __html: question.question_text || '<span class="text-gray-400 italic">No question text</span>' }}>
                    </div>
                  )}
                </div>

                {/* Image Display (if exists) - AFTER question, BEFORE options */}
                {question.image_url && editingIndex !== qIndex && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <img 
                        src={question.image_url.startsWith('http') ? question.image_url : `http://localhost:5174${question.image_url}`}
                        alt="Question diagram"
                        className="max-w-xs h-auto rounded"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  </div>
                )}

                {/* Options */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options {editingIndex === qIndex && question.question_type === 'mcq' && (
                      <button
                        onClick={() => addOption(qIndex)}
                        className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                      >
                        + Add Option
                      </button>
                    )}
                  </label>
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name={`correct_${qIndex}`}
                            checked={question.correct_answer === optIndex}
                            onChange={() => editingIndex === qIndex && updateQuestion(qIndex, 'correct_answer', optIndex)}
                            disabled={editingIndex !== qIndex}
                            className="h-4 w-4 text-green-600"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            {String.fromCharCode(65 + optIndex)})
                          </span>
                        </div>
                        {editingIndex === qIndex ? (
                          <>
                            <ErrorBoundary>
                              <RichTextEditor
                                value={option}
                                onChange={(value) => updateOption(qIndex, optIndex, value)}
                                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                rows={3}
                              />
                            </ErrorBoundary>
                            {question.options.length > 1 && question.question_type === 'mcq' && (
                              <button
                                onClick={() => removeOption(qIndex, optIndex)}
                                className="text-red-500 hover:text-red-700 mt-2"
                                title="Remove this option"
                              >
                                <SafeIcon icon={FiX} className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="flex-1 bg-white p-2 rounded-lg border border-gray-200" dangerouslySetInnerHTML={{ __html: option || '<span class="text-gray-400 italic">Empty option</span>' }}>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Correct Answer Display */}
                {editingIndex !== qIndex && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    {question.question_type === 'short_answer' ? (
                      <div>
                        <span className="text-sm font-medium text-green-800">
                          ✓ Correct Answer: {question.options[0] || 'Not specified'}
                        </span>
                        <div className="text-xs text-green-600 mt-1">
                          Students will type their answer manually
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-green-800">
                        ✓ Correct Answer: {String.fromCharCode(65 + question.correct_answer)} - {question.options[question.correct_answer] || 'N/A'}
                      </span>
                    )}
                  </div>
                )}

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Explanation
                  </label>
                  {editingIndex === qIndex ? (
                    <ErrorBoundary>
                      <RichTextEditor
                        value={question.explanation}
                        onChange={(value) => updateQuestion(qIndex, 'explanation', value)}
                        placeholder="Enter detailed explanation..."
                        rows={6}
                      />
                    </ErrorBoundary>
                  ) : (
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: question.explanation || '<span class="text-gray-400 italic">No explanation provided</span>' }}>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add New Question Button */}
            <button
              onClick={handleAddQuestion}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 text-gray-600 hover:text-blue-600"
            >
              <SafeIcon icon={FiPlus} className="h-5 w-5" />
              <span className="font-medium">Add New Question</span>
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Total: {questions.length} questions
              </div>
              <button
                onClick={onClose}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 font-medium"
              >
                Close Editor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestionEditor;
