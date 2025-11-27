// Fixed video playback and download functionality
    import { useState } from 'react';
    import { motion } from 'framer-motion';
    import SafeIcon from '../../../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    const { FiVideo, FiMessageCircle, FiBook, FiPlay, FiDownload, FiX } = FiIcons;

    const VideosFrame = ({ selectedCourse, currentLevel, frameData, setCurrentFrame, setSelectedCourse }) => {
      const currentTopic = frameData.currentTopic;
      const [selectedVideo, setSelectedVideo] = useState(null);

      const handleAskQuestion = () => {
        setCurrentFrame('chat');
      };

      const handleReviewMaterials = () => {
        setCurrentFrame('learningMaterials');
      };

      const handleBackToCourseSelection = () => {
        setSelectedCourse(null);
        setCurrentFrame('welcome');
      };

      // Get uploaded videos for the current level
      const uploadedVideos = selectedCourse?.videoLectures?.[currentLevel] || [];

      const handleVideoSelect = (video) => {
        setSelectedVideo(video);
      };

      const handleDownloadVideo = (video) => {
        // Create a download link for the video if it has a file object
        if (video.file) {
          const url = URL.createObjectURL(video.file);
          const a = document.createElement('a');
          a.href = url;
          a.download = video.name;
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

      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <SafeIcon icon={FiVideo} className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Here are the learning videos for {currentTopic}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Watch the videos carefully to grasp the key concepts. Once you're ready,
              you can ask me questions for clarification or review the study material!
            </p>
          </div>

          {/* Display uploaded videos from admin */}
          {uploadedVideos.length > 0 ? (
            <div className="space-y-6 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <SafeIcon icon={FiVideo} className="h-5 w-5 mr-3 text-purple-600" />
                  📹 {currentLevel} Level Videos for {currentTopic}
                </h3>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  {uploadedVideos.length} videos
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {uploadedVideos.map((video, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => handleVideoSelect(video)}
                  >
                    <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="text-center text-white relative z-10">
                        <SafeIcon icon={FiVideo} className="h-12 w-12 mx-auto mb-2 opacity-60 group-hover:scale-110 transition-transform" />
                        <SafeIcon icon={FiPlay} className="h-8 w-8 mx-auto mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                        <p className="text-sm opacity-75 group-hover:opacity-100 transition-opacity">Click to play</p>
                      </div>
                      {video.size && (
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {formatFileSize(video.size)}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {video.name || `Video ${index + 1}`}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {video.size ? `Size: ${formatFileSize(video.size)}` : 'Admin uploaded video'}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-gray-500">{video.type || 'video/mp4'}</span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadVideo(video);
                          }}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center space-x-1 px-2 py-1 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
                        >
                          <SafeIcon icon={FiDownload} className="h-4 w-4" />
                          <span>Download</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-xl p-8 mb-8">
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center text-white">
                  <SafeIcon icon={FiVideo} className="h-16 w-16 mx-auto mb-4 opacity-60" />
                  <p className="text-lg">No Videos Available Yet</p>
                  <p className="text-sm opacity-75">Your instructor hasn't uploaded videos for this level</p>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {currentTopic} - {currentLevel} Level
                </h3>
                <p className="text-gray-600">
                  Video content for {currentLevel} level learners will be available once your instructor uploads them.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReviewMaterials}
              className="group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 text-center hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-300"
            >
              <SafeIcon icon={FiBook} className="h-10 w-10 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Study Materials</h3>
              <p className="text-gray-600 text-sm">Access additional learning resources</p>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAskQuestion}
              className="group bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-300"
            >
              <SafeIcon icon={FiMessageCircle} className="h-10 w-10 text-green-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ask a Question</h3>
              <p className="text-gray-600 text-sm">Get help from your AI tutor</p>
            </motion.button>
          </div>

          {/* Video Player Modal */}
          {selectedVideo && (
            <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl max-w-4xl w-full overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {selectedVideo.name}
                  </h3>
                  <button 
                    onClick={() => setSelectedVideo(null)} 
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <SafeIcon icon={FiX} className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <div className="aspect-video bg-black flex items-center justify-center">
                  {selectedVideo.file ? (
                    <video controls className="w-full h-full" src={URL.createObjectURL(selectedVideo.file)} />
                  ) : (
                    <div className="text-center text-white">
                      <SafeIcon icon={FiVideo} className="h-16 w-16 mx-auto mb-4 opacity-60" />
                      <p className="text-lg">Video Player</p>
                      <p className="text-sm opacity-75 mt-2">
                        Video playback would be implemented here with the actual video file
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-gray-50 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {selectedVideo.size && `Size: ${formatFileSize(selectedVideo.size)}`}
                  </div>
                  <button
                    onClick={() => handleDownloadVideo(selectedVideo)}
                    className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center space-x-1"
                  >
                    <SafeIcon icon={FiDownload} className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          <div className="text-center mt-8">
            <button 
              onClick={handleBackToCourseSelection} 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Course Selection
            </button>
          </div>
        </motion.div>
      );
    };

    export default VideosFrame;