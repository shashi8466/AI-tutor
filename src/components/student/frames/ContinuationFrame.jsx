import {motion} from 'framer-motion';
    import SafeIcon from '../../../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    const {FiArrowRight,FiMessageCircle,FiAward}=FiIcons;

    const ContinuationFrame=({frameData,setCurrentFrame,setSelectedCourse})=> {
      const currentTopic=frameData.currentTopic;

      const handleContinueConcept=()=> {
        setCurrentFrame('learningMaterials');
      };

      const handleAskQuestion=()=> {
        setCurrentFrame('chat');
      };

      const handleStartQuiz=()=> {
        setCurrentFrame('quizTransition');
      };

      const handleBackToCourseSelection=()=> {
        setSelectedCourse(null);
        setCurrentFrame('welcome');
      };

      return (
        <motion.div
          initial={{opacity: 0,y: 20}}
          animate={{opacity: 1,y: 0}}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              What would you like to do next?
            </h1>
            <p className="text-lg text-gray-600">
              Choose your next step in learning {currentTopic}
            </p>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            <motion.button
              whileHover={{scale: 1.02}}
              whileTap={{scale: 0.98}}
              onClick={handleContinueConcept}
              className="w-full group bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 text-left hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    A. Continue learning the next concept in {currentTopic}
                  </h3>
                  <p className="text-gray-600">Explore more advanced topics and deepen your understanding</p>
                </div>
                <SafeIcon
                  icon={FiArrowRight}
                  className="h-6 w-6 text-blue-600 group-hover:translate-x-1 transition-transform"
                />
              </div>
            </motion.button>
            <motion.button
              whileHover={{scale: 1.02}}
              whileTap={{scale: 0.98}}
              onClick={handleAskQuestion}
              className="w-full group bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-left hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    B. Ask another question about this material
                  </h3>
                  <p className="text-gray-600">Get clarification or dive deeper into specific areas</p>
                </div>
                <SafeIcon
                  icon={FiMessageCircle}
                  className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform"
                />
              </div>
            </motion.button>
            <motion.button
              whileHover={{scale: 1.02}}
              whileTap={{scale: 0.98}}
              onClick={handleStartQuiz}
              className="w-full group bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 text-left hover:from-purple-100 hover:to-pink-100 hover:border-purple-300 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    C. Move on to the quiz for this topic
                  </h3>
                  <p className="text-gray-600">Test your knowledge and track your progress</p>
                </div>
                <SafeIcon
                  icon={FiAward}
                  className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform"
                />
              </div>
            </motion.button>
          </div>
          <div className="text-center mt-8 space-y-4">
            <button
              onClick={handleBackToCourseSelection}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Course Selection
            </button>
            <div>
              <button
                onClick={()=> setCurrentFrame('chat')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Chat
              </button>
            </div>
          </div>
        </motion.div>
      );
    };

    export default ContinuationFrame;