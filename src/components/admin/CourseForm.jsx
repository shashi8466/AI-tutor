import { useState, useEffect } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { useCourse } from '../../context/CourseContext';
    import QuizDocumentUploader from './QuizDocumentUploader';
    import SafeIcon from '../../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    const { FiX, FiUpload, FiFile, FiVideo, FiTrash2, FiEdit2 } = FiIcons;

    // Dynamic topic templates for different course types
    const topicTemplates = {
      'SAT Tutor': {
        Easy: ['Linear Equations', 'Basic Punctuation', 'Reading for Main Idea', 'Sentence Structure', 'Word Problems', 'Grammar Basics'],
        Medium: ['Systems of Equations', 'Grammar and Usage', 'Analyzing Paored Passages', 'Quadratic Functions', 'Data Interpretation', 'Complex Sentences'],
        Hard: ['Advanced Functions', 'Rhetorical Analysis', 'Interpreting Complex Data', 'Trigonometry', 'Literary Analysis', 'Advanced Word Problems']
      },
      'Python Tutor': {
        Easy: ['Variables and Data Types', 'Basic Syntax', 'Simple Functions', 'Print Statements', 'Comments', 'Basic Operators'],
        Medium: ['Lists and Dictionaries', 'Conditional Logic', 'Loops and Iteration', 'File Operations', 'Error Handling', 'Function Parameters'],
        Hard: ['Object-Oriented Programming', 'Decorators', 'Generators', 'Async Programming', 'Data Structures', 'Algorithm Complexity']
      },
      'Math Tutor': {
        Easy: ['Basic Arithmetic', 'Fractions and Decimals', 'Simple Equations', 'Geometry Basics', 'Number Patterns', 'Measurements'],
        Medium: ['Algebraic Expressions', 'Linear Functions', 'Geometry Proofs', 'Statistics Basics', 'Probability', 'Exponents'],
        Hard: ['Calculus Basics', 'Trigonometry', 'Advanced Statistics', 'Complex Numbers', 'Matrix Operations', 'Differential Equations']
      },
      'Science Tutor': {
        Easy: ['Scientific Method', 'Basic Chemistry', 'Simple Physics', 'Biology Basics', 'Lab Safety', 'Measurements'],
        Medium: ['Chemical Reactions', 'Force and Motion', 'Cell Biology', 'Energy Transfer', 'Genetics', 'Ecosystems'],
        Hard: ['Quantum Physics', 'Organic Chemistry', 'Molecular Biology', 'Thermodynamics', 'Electromagnetism', 'Advanced Genetics']
      },
      'Language Tutor': {
        Easy: ['Basic Vocabulary', 'Simple Sentences', 'Common Phrases', 'Pronunciation', 'Basic Grammar', 'Daily Conversations'],
        Medium: ['Complex Sentences', 'Grammar Rules', 'Writing Skills', 'Reading Comprehension', 'Vocabulary Building', 'Cultural Context'],
        Hard: ['Literary Analysis', 'Advanced Composition', 'Linguistic Structures', 'Translation Skills', 'Cultural Nuances', 'Professional Writing']
      },
      'History Tutor': {
        Easy: ['Timeline Basics', 'Key Dates', 'Important Figures', 'Geography Basics', 'Primary Sources', 'Simple Events'],
        Medium: ['Historical Analysis', 'Cause and Effect', 'Primary Document Analysis', 'Comparative History', 'Historical Context', 'Research Methods'],
        Hard: ['Historiography', 'Advanced Research', 'Thematic Analysis', 'Comparative Civilizations', 'Historical Debate', 'Source Criticism']
      }
    };

    // Get Started button templates
    const getStartedTemplates = {
      'SAT Tutor': {
        Easy: "Master Linear Equations",
        Medium: "Analyze Paired Passages",
        Hard: "Complete Rhetorical Analysis"
      },
      'Python Tutor': {
        Easy: "Start with Variables",
        Medium: "Build Functions",
        Hard: "Master OOP Concepts"
      },
      'Math Tutor': {
        Easy: "Solve Basic Equations",
        Medium: "Master Linear Functions",
        Hard: "Conquer Calculus"
      },
      'Science Tutor': {
        Easy: "Explore Scientific Method",
        Medium: "Understand Chemical Reactions",
        Hard: "Dive into Quantum Physics"
      },
      'Language Tutor': {
        Easy: "Learn Basic Vocabulary",
        Medium: "Build Complex Sentences",
        Hard: "Analyze Literature"
      },
      'History Tutor': {
        Easy: "Learn Key Dates",
        Medium: "Analyze Historical Events",
        Hard: "Master Historical Debate"
      }
    };

    const CourseForm = ({ onClose, editingCourse }) => {
      const { addCourse, updateCourse } = useCourse();
      const [formData, setFormData] = useState({
        title: '',
        description: '',
        tutorType: '',
        level: 'Easy',
        status: true,
        trainingDocuments: [],
        studyMaterials: {
          Easy: [],
          Medium: [],
          Hard: []
        },
        videoLectures: {
          Easy: [],
          Medium: [],
          Hard: []
        },
        quizQuestions: {
          Easy: [],
          Medium: [],
          Hard: []
        },
        topics: {
          Easy: [],
          Medium: [],
          Hard: []
        },
        getStartedButtons: {
          Easy: '',
          Medium: '',
          Hard: ''
        }
      });
      
      const [courseId] = useState(() => editingCourse?.id || `course_${Date.now()}`);

      useEffect(() => {
        if (editingCourse) {
          // Ensure all required properties exist
          const updatedCourse = {
            ...editingCourse,
            studyMaterials: editingCourse.studyMaterials || { Easy: [], Medium: [], Hard: [] },
            videoLectures: editingCourse.videoLectures || { Easy: [], Medium: [], Hard: [] },
            topics: editingCourse.topics || { Easy: [], Medium: [], Hard: [] },
            getStartedButtons: editingCourse.getStartedButtons || { Easy: '', Medium: '', Hard: '' }
          };
          setFormData(updatedCourse);
        }
      }, [editingCourse]);

      const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
        }));
      };

      const handleFileUpload = (type, level = null) => (e) => {
        const files = Array.from(e.target.files);
        if (level) {
          setFormData(prev => ({
            ...prev,
            [type]: {
              ...prev[type],
              [level]: [
                ...prev[type][level],
                ...files.map(file => ({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  lastModified: file.lastModified,
                  file: file // Store the actual file object
                }))
              ]
            }
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            [type]: [
              ...prev[type],
              ...files.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                file: file // Store the actual file object
              }))
            ]
          }));
        }
      };

      const handleFileDelete = (type, level, indexToDelete) => {
        setFormData(prev => {
          if (level) {
            const updatedLevelFiles = prev[type][level].filter((_, index) => index !== indexToDelete);
            return {
              ...prev,
              [type]: {
                ...prev[type],
                [level]: updatedLevelFiles
              }
            };
          } else {
            const updatedFiles = prev[type].filter((_, index) => index !== indexToDelete);
            return {
              ...prev,
              [type]: updatedFiles
            };
          }
        });
      };

      const generateDynamicTopics = (tutorType, level, hasMaterials) => {
        if (!hasMaterials) return [];
        
        const templates = topicTemplates[tutorType] || topicTemplates['Math Tutor'];
        const baseTopics = templates[level] || [];
        
        // Add dynamic variation based on uploaded materials
        return baseTopics.map(topic => {
          const variations = [
            topic,
            `Introduction to ${topic}`,
            `${topic}: Fundamentals`,
            `Understanding ${topic}`,
            `${topic} Basics`
          ];
          return variations[Math.floor(Math.random() * variations.length)];
        });
      };

      const generateGetStartedButtons = (tutorType, level, hasMaterials) => {
        if (!hasMaterials) return '';
        
        const templates = getStartedTemplates[tutorType] || getStartedTemplates['Math Tutor'];
        const baseButton = templates[level] || `Get Started with ${level}`;
        
        const variations = [
          baseButton,
          `Begin ${baseButton}`,
          `Start ${baseButton}`,
          `Master ${baseButton}`,
          `Explore ${baseButton}`
        ];
        return variations[Math.floor(Math.random() * variations.length)];
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Create course object with consistent ID
        const courseData = {
          ...formData,
          id: courseId, // Ensure we use the consistent ID
          createdAt: editingCourse?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        try {
          if (editingCourse) {
            updateCourse(editingCourse.id, courseData);
          } else {
            addCourse(courseData);
          }
          
          onClose();
        } catch (error) {
          console.error('Error saving course:', error);
        }
      };

      const tutorTypes = [
        'Python Tutor',
        'SAT Tutor',
        'Math Tutor',
        'Science Tutor',
        'Language Tutor',
        'History Tutor'
      ];

      const levels = ['Easy', 'Medium', 'Hard'];

      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </h3>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiX} className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., SAT Math Prep, Python Programming"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Tutor Type
                </label>
                <select
                  name="tutorType"
                  value={formData.tutorType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Tutor Type</option>
                  {tutorTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Short summary of what the course covers"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex items-center space-x-3 pt-3">
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Active</span>
              </div>
            </div>

            {/* Supabase Quiz Document Uploader */}
            {formData.title && formData.tutorType && (
              <QuizDocumentUploader 
                courseId={courseId} 
                tutorType={formData.tutorType}
                onUploadComplete={() => {
                  // Refresh course data after upload
                }}
              />
            )}

            {/* Legacy file upload section for other materials */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload AI Training Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <SafeIcon icon={FiUpload} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload('trainingDocuments')}
                  className="hidden"
                  id="training-docs"
                />
                <label htmlFor="training-docs" className="cursor-pointer">
                  <span className="text-blue-600 font-medium">Click to upload</span>
                  <span className="text-gray-500"> or drag and drop</span>
                  <p className="text-sm text-gray-500 mt-2">PDF, DOC, DOCX, TXT files</p>
                </label>
                {formData.trainingDocuments.length > 0 && (
                  <div className="mt-4 text-sm text-gray-600">
                    {formData.trainingDocuments.length} files selected
                  </div>
                )}
              </div>
            </div>

            {levels.map(level => (
              <div key={level} className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  📘 {level} Level Uploads
                </h4>
                <p className="text-gray-600 mb-4">
                  Upload study materials and video lectures designed for {level.toLowerCase()}-level learners. <br />
                  <span className="text-sm text-blue-600">
                    Topics and "Get Started" buttons will be automatically generated based on {formData.tutorType || 'selected'} course type.
                  </span>
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Study Materials Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <SafeIcon icon={FiFile} className="inline h-4 w-4 mr-1" />
                      Study Materials
                    </label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload('studyMaterials', level)}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {formData.studyMaterials[level].length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-xs font-semibold text-gray-600 uppercase mb-2">Manage Uploaded Files</h5>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          <AnimatePresence>
                            {formData.studyMaterials[level].map((file, index) => (
                              <motion.div
                                key={`${file.name}-${file.lastModified}-${index}`}
                                layout
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                className="flex items-center justify-between bg-white p-2 rounded-md border"
                              >
                                <span className="text-sm text-gray-800 truncate flex-1 mr-2" title={file.name}>
                                  {file.name}
                                </span>
                                <div className="flex items-center">
                                  <button
                                    type="button"
                                    disabled
                                    className="text-gray-300 cursor-not-allowed p-1 rounded-full mr-1"
                                    title="Edit file name (coming soon)"
                                  >
                                    <SafeIcon icon={FiEdit2} className="h-4 w-4" />
                                  </button>
                                  <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: '#FFF1F2' }}
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    onClick={() => handleFileDelete('studyMaterials', level, index)}
                                    className="text-red-500 p-1 rounded-full"
                                    title="Delete file"
                                  >
                                    <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Video Lectures Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <SafeIcon icon={FiVideo} className="inline h-4 w-4 mr-1" />
                      Video Lectures
                    </label>
                    <input
                      type="file"
                      multiple
                      accept=".mp4,.mov,.avi"
                      onChange={handleFileUpload('videoLectures', level)}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                    {formData.videoLectures[level].length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-xs font-semibold text-gray-600 uppercase mb-2">Manage Uploaded Files</h5>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          <AnimatePresence>
                            {formData.videoLectures[level].map((file, index) => (
                              <motion.div
                                key={`${file.name}-${file.lastModified}-${index}`}
                                layout
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                className="flex items-center justify-between bg-white p-2 rounded-md border"
                              >
                                <span className="text-sm text-gray-800 truncate flex-1 mr-2" title={file.name}>
                                  {file.name}
                                </span>
                                <div className="flex items-center">
                                  <button
                                    type="button"
                                    disabled
                                    className="text-gray-300 cursor-not-allowed p-1 rounded-full mr-1"
                                    title="Edit file name (coming soon)"
                                  >
                                    <SafeIcon icon={FiEdit2} className="h-4 w-4" />
                                  </button>
                                  <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: '#FFF1F2' }}
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    onClick={() => handleFileDelete('videoLectures', level, index)}
                                    className="text-red-500 p-1 rounded-full"
                                    title="Delete file"
                                  >
                                    <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {formData.tutorType && formData.studyMaterials[level].length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">Preview Generated Topics:</p>
                    <div className="text-xs text-blue-700">
                      {generateDynamicTopics(formData.tutorType, level, true).slice(0, 3).join(', ')}
                      {generateDynamicTopics(formData.tutorType, level, true).length > 3 && '...'}
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Button: "{generateGetStartedButtons(formData.tutorType, level, true)}"
                    </p>
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {editingCourse ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </form>
        </motion.div>
      );
    };

    export default CourseForm;