import { motion } from 'framer-motion';
    import { useCourse } from '../../../context/CourseContext';
    import SafeIcon from '../../../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    
    const { FiPlay, FiBook, FiTrendingUp, FiLock, FiCheckCircle } = FiIcons;
    
    const TopicIntroFrame = ({ selectedCourse, setCurrentLevel, setCurrentFrame, setFrameData, setSelectedCourse }) => {
      const { getTopicsForLevel, getUnlockedLevel } = useCourse();
      const levels = ['Easy', 'Medium', 'Hard'];
      const unlockedLevel = getUnlockedLevel(selectedCourse.id);
      const unlockedIndex = levels.indexOf(unlockedLevel);
    
      const handleStartLevel = (level) => {
        setCurrentLevel(level);
        const topics = getTopicsForLevel(selectedCourse, level);
        if (topics.length > 0) {
          setFrameData({ currentTopic: topics[0] });
          setCurrentFrame('learningMaterials');
        }
      };
    
      const handleBackToCourseSelection = () => {
        setSelectedCourse(null);
        setCurrentFrame('welcome');
      };
    
      const getLevelIcon = (level) => {
        switch (level) {
          case 'Easy': return FiBook;
          case 'Medium': return FiTrendingUp;
          case 'Hard': return FiTrendingUp;
          default: return FiBook;
        }
      };
    
      const getLevelColor = (level, isLocked, isCompleted) => {
        if (isLocked) return 'from-gray-50 to-gray-100 border-gray-200';
        if (isCompleted) return 'from-green-50 to-emerald-50 border-green-300';
        switch (level) {
          case 'Easy': return 'from-green-50 to-emerald-50 border-green-200';
          case 'Medium': return 'from-yellow-50 to-orange-50 border-yellow-200';
          case 'Hard': return 'from-red-50 to-pink-50 border-red-200';
          default: return 'from-gray-50 to-gray-100 border-gray-200';
        }
      };
    
      const getGetStartedText = (level) => {
        return selectedCourse?.getStartedButtons?.[level] || `Get Started with ${level}`;
      };
    
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Great choice! We're starting with the {selectedCourse.title} course.
            </h1>
            <p className="text-lg text-gray-600">
              Here are the topics available for each level based on your {selectedCourse.tutorType} course materials:
            </p>
          </div>
          <div className="space-y-6">
            {levels.map((level, index) => {
              const isLocked = index > unlockedIndex;
              const isCompleted = index < unlockedIndex;
              const topics = getTopicsForLevel(selectedCourse, level);
              const LevelIcon = getLevelIcon(level);
              const hasMaterials = selectedCourse?.studyMaterials?.[level]?.length > 0;
    
              return (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gradient-to-r ${getLevelColor(level, isLocked, isCompleted)} border-2 rounded-xl p-6 ${
                    isLocked || !hasMaterials ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <SafeIcon icon={LevelIcon} className="h-6 w-6 text-gray-700 mr-3" />
                        <h3 className="text-xl font-semibold text-gray-900">
                          {level === 'Easy' ? '1️⃣' : level === 'Medium' ? '2️⃣' : '3️⃣'} {level} Level Topics
                        </h3>
                        {!hasMaterials && !isLocked && (
                          <span className="ml-3 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            No materials uploaded
                          </span>
                        )}
                        {isCompleted && (
                           <span className="ml-3 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
                            <SafeIcon icon={FiCheckCircle} className="h-3 w-3 mr-1" />
                            Completed
                          </span>
                        )}
                      </div>
                      {topics.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                          {topics.map((topic, i) => (
                            <div key={i} className="flex items-center text-gray-700">
                              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                              <span className="text-sm">{topic}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm mb-4">
                          {hasMaterials
                            ? 'Topics will be generated when materials are uploaded.'
                            : 'No topics available - please upload study materials first.'}
                        </p>
                      )}
                    </div>
                    {isLocked ? (
                      <div className="flex items-center space-x-2 bg-gray-200 text-gray-500 px-6 py-3 rounded-lg font-medium ml-6">
                        <SafeIcon icon={FiLock} className="h-4 w-4" />
                        <span>Locked</span>
                      </div>
                    ) : topics.length > 0 && hasMaterials ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStartLevel(level)}
                        className="flex items-center space-x-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-md ml-6"
                      >
                        <SafeIcon icon={isCompleted ? FiBook : FiPlay} className="h-4 w-4" />
                        <span>{isCompleted ? 'Review Level' : getGetStartedText(level)}</span>
                      </motion.button>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <button onClick={handleBackToCourseSelection} className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Course Selection
            </button>
          </div>
        </motion.div>
      );
    };
    
    export default TopicIntroFrame;