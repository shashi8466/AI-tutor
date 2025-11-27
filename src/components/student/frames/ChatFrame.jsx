import { useState, useEffect, useRef } from 'react';
    import { motion } from 'framer-motion';
    import SafeIcon from '../../../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    
    const { FiSend, FiMessageCircle, FiUser, FiBot, FiBook, FiVideo } = FiIcons;
    
    const ChatFrame = ({ selectedCourse, currentLevel, frameData, setCurrentFrame, setSelectedCourse }) => {
      const [messages, setMessages] = useState([]);
      const [inputValue, setInputValue] = useState('');
      const [isTyping, setIsTyping] = useState(false);
      const messagesEndRef = useRef(null);
    
      const currentTopic = frameData.currentTopic;
      const studyMaterials = selectedCourse?.studyMaterials?.[currentLevel] || [];
      const videoLectures = selectedCourse?.videoLectures?.[currentLevel] || [];
    
      const handleViewMaterials = () => {
        setCurrentFrame('learningMaterials');
      };
    
      const handleViewVideos = () => {
        setCurrentFrame('videos');
      };
    
      const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };
    
      // Generate AI response based on uploaded course materials
      const generateContextualResponse = () => {
        const contextualResponses = [
          `Based on the ${currentLevel} level materials for ${currentTopic}, here's what I can help you with:\n\n📚 Available Study Materials: ${studyMaterials.length} files\n🎥 Video Lectures: ${videoLectures.length} videos\n\nLet me explain this concept using the uploaded course content:\n\n${studyMaterials.length > 0 ? `Study materials available:\n${studyMaterials.slice(0, 3).map((m, i) => `${i + 1}. ${m.name || `Document ${i + 1}`}`).join('\n')}` : 'No study materials uploaded yet'}\n\n${videoLectures.length > 0 ? `Video lectures available:\n${videoLectures.slice(0, 2).map((v, i) => `${i + 1}. ${v.name || `Video ${i + 1}`}`).join('\n')}` : 'No video lectures uploaded yet'}\n\nWould you like me to reference specific materials or explain this concept differently?`,
          `Great question about ${currentTopic}! I can see from the ${currentLevel} level materials that ${selectedCourse.tutorType} has prepared comprehensive content for this topic.\n\n${studyMaterials.length > 0 ? `• There are ${studyMaterials.length} study documents available for deeper understanding\n• These include: ${studyMaterials.slice(0, 2).map(m => m.name || 'study materials').join(',')}` : '• No study materials have been uploaded yet for this level'}\n\n${videoLectures.length > 0 ? `• ${videoLectures.length} video lectures demonstrate practical applications\n• Videos cover: ${videoLectures.slice(0, 2).map(v => v.name || 'key concepts').join(',')}` : '• No video lectures have been uploaded yet for this level'}\n\nHere's how this concept applies in practice: [Based on uploaded materials]\n\nWould you like to move on, or ask another question about ${currentTopic}?`,
          `I can help you with ${currentTopic} using the ${currentLevel} level course materials!\n\n📋 Course Overview:\n• Course: ${selectedCourse.title}\n• Level: ${currentLevel}\n• Topic: ${currentTopic}\n• Tutor Type: ${selectedCourse.tutorType}\n\n📚 Available Resources:\n${studyMaterials.length > 0 ? `• ${studyMaterials.length} Study Documents:\n ${studyMaterials.map((m, i) => ` ${i + 1}. ${m.name || `Document ${i + 1}`} (${m.size ? formatFileSize(m.size) : 'size unknown'})`).join('\n ')}` : '• No study materials available yet'}\n\n${videoLectures.length > 0 ? `• ${videoLectures.length} Video Lectures:\n ${videoLectures.map((v, i) => ` ${i + 1}. ${v.name || `Video ${i + 1}`} (${v.size ? formatFileSize(v.size) : 'size unknown'})`).join('\n ')}` : '• No video lectures available yet'}\n\nI recommend ${studyMaterials.length > 0 ? 'reviewing the study materials first' : 'asking your instructor to upload materials'}, then ${videoLectures.length > 0 ? 'watching the video lectures' : 'requesting video content'}.\n\nDoes this help clarify the concept? Would you like to explore another aspect of ${currentTopic}?`
        ];
        return contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
      };
    
      useEffect(() => {
        // Initial AI message with course context and material references
        const materialSummary = [];
        if (studyMaterials.length > 0) {
          materialSummary.push(`📚 ${studyMaterials.length} Study Materials Available`);
          materialSummary.push(...studyMaterials.slice(0, 3).map((m, i) => ` • ${m.name || `Document ${i + 1}`}`));
        }
        if (videoLectures.length > 0) {
          materialSummary.push(`🎥 ${videoLectures.length} Video Lectures Available`);
          materialSummary.push(...videoLectures.slice(0, 2).map((v, i) => ` • ${v.name || `Video ${i + 1}`}`));
        }
        if (materialSummary.length === 0) {
          materialSummary.push('⚠️ No materials uploaded yet for this level');
        }
        setMessages([
          {
            id: 1,
            type: 'ai',
            content: `You can ask me anything about ${currentTopic}! 🧮\n\nI'm working with the ${currentLevel} level materials from your ${selectedCourse.tutorType} course.\n\n📋 Course Information:\n• Course: ${selectedCourse.title}\n• Level: ${currentLevel}\n• Topic: ${currentTopic}\n\n${materialSummary.join('\n')}\n\nType your question below and press Enter to get explanations based on your course materials!\n\n💡 Tip: I can reference specific uploaded materials in my responses. You can also ask me to help you access the study materials or videos.`
          }
        ]);
      }, [currentTopic, currentLevel, selectedCourse, studyMaterials, videoLectures]);
    
      useEffect(() => {
        scrollToBottom();
      }, [messages]);
    
      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };
    
      const handleSendMessage = (e) => {
        e.preventDefault();
        const messageContent = inputValue.trim();
        if (!messageContent) return;
        const userMessage = { id: Date.now(), type: 'user', content: messageContent };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);
        // Simulate AI response delay
        setTimeout(() => {
          const aiResponse = { id: Date.now() + 1, type: 'ai', content: generateContextualResponse() };
          setMessages(prev => [...prev, aiResponse]);
          setIsTyping(false);
        }, 1500);
      };
    
      const handleContinue = () => {
        setCurrentFrame('continuation');
      };
    
      const handleBackToCourseSelection = () => {
        setSelectedCourse(null);
        setCurrentFrame('welcome');
      };
    
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
          style={{ height: 'calc(100vh - 9rem)' }}
        >
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiMessageCircle} className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-semibold">AI Tutor Chat</h2>
                  <p className="text-blue-100">
                    {currentTopic} - {currentLevel} Level
                  </p>
                  <p className="text-xs text-blue-200 mt-1">
                    {selectedCourse?.tutorType}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {studyMaterials.length > 0 && (
                  <button
                    onClick={handleViewMaterials}
                    className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                  >
                    <SafeIcon icon={FiBook} className="h-4 w-4" />
                    <span>Materials ({studyMaterials.length})</span>
                  </button>
                )}
                {videoLectures.length > 0 && (
                  <button
                    onClick={handleViewVideos}
                    className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                  >
                    <SafeIcon icon={FiVideo} className="h-4 w-4" />
                    <span>Videos ({videoLectures.length})</span>
                  </button>
                )}
                <button
                  onClick={handleContinue}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Continue Learning →
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}
                  >
                    <SafeIcon
                      icon={message.type === 'user' ? FiUser : FiBot}
                      className={`h-4 w-4 ${message.type === 'user' ? 'text-blue-600' : 'text-green-600'}`}
                    />
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}
                  >
                    <p className="whitespace-pre-line">{message.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <SafeIcon icon={FiBot} className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Ask me anything about ${currentTopic}...`}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isTyping}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <SafeIcon icon={FiSend} className="h-4 w-4" />
                <span>Send</span>
              </motion.button>
            </form>
            <div className="text-center mt-3">
              <button
                onClick={handleBackToCourseSelection}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                ← Back to Course Selection
              </button>
            </div>
          </div>
        </motion.div>
      );
    };
    
    export default ChatFrame;