import { useState } from 'react';
    import { motion } from 'framer-motion';
    import SafeIcon from '../../../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    
    const { FiVideo, FiMessageCircle, FiBook, FiFileText, FiDownload, FiEye, FiClock, FiFile, FiX, FiAward } = FiIcons;
    
    const LearningMaterialsFrame = ({ selectedCourse, currentLevel, frameData, setCurrentFrame, setSelectedCourse }) => {
      const currentTopic = frameData.currentTopic;
      const [selectedMaterial, setSelectedMaterial] = useState(null);
    
      const studyMaterials = selectedCourse?.studyMaterials?.[currentLevel] || [];
      const videoLectures = selectedCourse?.videoLectures?.[currentLevel] || [];
    
      const handleVideoClick = () => {
        setCurrentFrame('videos');
      };
    
      const handleAskQuestion = () => {
        setCurrentFrame('chat');
      };
    
      const handleGoToQuiz = () => {
        setCurrentFrame('quizTransition');
      };
    
      const handleBackToCourseSelection = () => {
        setSelectedCourse(null);
        setCurrentFrame('welcome');
      };
    
      const handleViewMaterial = (material) => {
        setSelectedMaterial(material);
      };
    
      const handleDownloadMaterial = (material) => {
        // Create a download link for the material if it has a file object
        if (material.file) {
          const url = URL.createObjectURL(material.file);
          const a = document.createElement('a');
          a.href = url;
          a.download = material.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      };
    
      const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };
    
      const getFileIcon = (fileName) => {
        const extension = fileName?.split('.').pop()?.toLowerCase();
        switch (extension) {
          case 'pdf': return FiFileText;
          case 'doc': case 'docx': return FiFile;
          case 'txt': return FiFileText;
          default: return FiFile;
        }
      };
    
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <SafeIcon icon={FiBook} className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Let's begin learning {currentTopic}!
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Here you can explore lesson materials, practice examples, and explanations uploaded by your instructor. Choose a resource to continue.
            </p>
          </div>
    
          {/* Study Materials Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <SafeIcon icon={FiFileText} className="h-5 w-5 mr-3 text-blue-600" />
                Study Materials for {currentLevel} Level
              </h3>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {studyMaterials.length} files
              </span>
            </div>
            {studyMaterials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studyMaterials.map((material, index) => {
                  const FileIcon = getFileIcon(material.name);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-3 flex-1">
                            <SafeIcon icon={FileIcon} className="h-8 w-8 text-gray-500 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {material.name || `Study Material ${index + 1}`}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {material.size ? `Size: ${formatFileSize(material.size)}` : 'Uploaded by instructor'}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {material.type || 'document'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleViewMaterial(material)}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium flex-1 justify-center px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            <SafeIcon icon={FiEye} className="h-4 w-4" />
                            <span>View</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDownloadMaterial(material)}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm font-medium flex-1 justify-center px-3 py-2 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                          >
                            <SafeIcon icon={FiDownload} className="h-4 w-4" />
                            <span>Download</span>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-100 rounded-xl p-8 text-center">
                <SafeIcon icon={FiFileText} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Study Materials Yet</h3>
                <p className="text-gray-600 text-sm">
                  Your instructor hasn't uploaded study materials for {currentLevel} level yet.
                </p>
              </div>
            )}
          </div>
    
          {/* Video Lectures Preview */}
          {videoLectures.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <SafeIcon icon={FiVideo} className="h-5 w-5 mr-3 text-purple-600" />
                  Video Lectures for {currentLevel} Level
                </h3>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  {videoLectures.length} videos
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videoLectures.slice(0, 2).map((video, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-purple-50 rounded-lg border border-purple-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <SafeIcon icon={FiVideo} className="h-8 w-8 text-purple-600" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {video.name || `Video Lecture ${index + 1}`}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {video.size ? `Size: ${formatFileSize(video.size)}` : 'Uploaded by instructor'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <SafeIcon icon={FiClock} className="h-3 w-3" />
                        <span>Video duration will be shown when played</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {videoLectures.length > 2 && (
                <div className="text-center mt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVideoClick}
                    className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                  >
                    View all {videoLectures.length} videos →
                  </motion.button>
                </div>
              )}
            </div>
          )}
    
          {/* Action Buttons */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleVideoClick}
              className="group bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 text-center hover:from-purple-100 hover:to-indigo-100 hover:border-purple-300 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
            >
              <div>
                <SafeIcon icon={FiVideo} className="h-10 w-10 text-purple-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Premade Videos
                </h3>
                <p className="text-gray-600 text-sm">
                  Watch instructional videos to understand the concepts
                </p>
              </div>
              {videoLectures.length > 0 && (
                <span className="inline-block mt-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                  {videoLectures.length} videos available
                </span>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAskQuestion}
              className="group bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
            >
              <div>
                <SafeIcon icon={FiMessageCircle} className="h-10 w-10 text-green-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ask a Question</h3>
                <p className="text-gray-600 text-sm">
                  Get personalized help from your AI tutor
                </p>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoToQuiz}
              className="group bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 text-center hover:from-yellow-100 hover:to-orange-100 hover:border-yellow-300 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
            >
              <div>
                <SafeIcon icon={FiAward} className="h-10 w-10 text-yellow-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Take the Quiz</h3>
                <p className="text-gray-600 text-sm">
                  Test your knowledge on {currentTopic}
                </p>
              </div>
            </motion.button>
          </div>
    
          {/* Material Viewer Modal */}
          {selectedMaterial && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl max-w-4xl max-h-[90vh] w-full overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {selectedMaterial.name}
                  </h3>
                  <button
                    onClick={() => setSelectedMaterial(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <SafeIcon icon={FiX} className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                  {selectedMaterial.type?.includes('pdf') ? (
                    <div className="text-center py-8">
                      <SafeIcon icon={FiFileText} className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">PDF Preview</p>
                      <p className="text-sm text-gray-500 mb-6">
                        Full PDF viewing would be implemented here in a production environment.
                      </p>
                      <button
                        onClick={() => handleDownloadMaterial(selectedMaterial)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Download Full Document
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <SafeIcon icon={FiFile} className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Document Preview</p>
                      <p className="text-sm text-gray-500 mb-6">
                        Document preview would be implemented here based on file type.
                      </p>
                      <button
                        onClick={() => handleDownloadMaterial(selectedMaterial)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Download Document
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
    
          <div className="text-center mt-8">
            <button onClick={handleBackToCourseSelection} className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Course Selection
            </button>
          </div>
        </motion.div>
      );
    };
    
    export default LearningMaterialsFrame;