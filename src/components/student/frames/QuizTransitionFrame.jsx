import { motion } from 'framer-motion';
    import SafeIcon from '../../../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    const { FiAward, FiPlay, FiInfo } = FiIcons;

    const QuizTransitionFrame = ({ currentLevel, frameData, setCurrentFrame, setSelectedCourse }) => {
      const currentTopic = frameData.currentTopic;

      const handleContinueToQuiz = () => {
        setCurrentFrame('quiz');
      };

      const handleBackToCourseSelection = () => {
        setSelectedCourse(null);
        setCurrentFrame('welcome');
      };

      // Dynamic quiz details based on level
      const getQuizDetails = (level) => {
        const details = {
          Easy: { questions: 6, time: '~6', weight: '20%', scaledMax: 400, description: 'foundational concepts and basic understanding' },
          Medium: { questions: 10, time: '~10', weight: '30%', scaledMax: 600, description: 'intermediate concepts and practical applications' },
          Hard: { questions: 15, time: '~15', weight: '50%', scaledMax: 800, description: 'advanced concepts and complex problem-solving' }
        };
        return details[level] || details.Easy;
      };

      const quizDetails = getQuizDetails(currentLevel);

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="mb-8">
            <SafeIcon icon={FiAward} className="h-20 w-20 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">🎉 Excellent work!</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              You&apos;ve completed the learning section for <strong>{currentTopic}</strong>.
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">
              Now, let&apos;s test your understanding with a quiz for the <strong>{currentLevel}</strong> level.
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-8 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Quiz Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{quizDetails.questions}</div>
                <div className="text-gray-600">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{currentLevel}</div>
                <div className="text-gray-600">Difficulty</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{quizDetails.time}</div>
                <div className="text-gray-600">Minutes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{quizDetails.weight}</div>
                <div className="text-gray-600">Weight</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <SafeIcon icon={FiInfo} className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="font-semibold text-blue-800 mb-1">Quiz Details</h4>
                  <p className="text-sm text-blue-700">
                    This quiz focuses specifically on <strong>{currentTopic}</strong> at the {currentLevel} level, covering {quizDetails.description}. All questions are directly related to the topic you just studied.
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    Scaled Score: {quizDetails.scaledMax} points maximum ({quizDetails.weight} of overall score)
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 text-left bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">What to Expect:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• All {quizDetails.questions} questions are about {currentTopic}</li>
                <li>• Questions are {currentLevel.toLowerCase()} difficulty level</li>
                <li>• Each question has multiple choice options</li>
                <li>• You&apos;ll see explanations for correct/incorrect answers</li>
                <li>• Score {quizDetails.weight} toward your overall grade</li>
              </ul>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleContinueToQuiz}
            className="flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg mx-auto"
          >
            <SafeIcon icon={FiPlay} className="h-5 w-5" />
            <span>Continue to Quiz</span>
          </motion.button>

          <div className="text-center mt-8 space-y-4">
            <button onClick={handleBackToCourseSelection} className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Course Selection
            </button>
            <div>
              <button onClick={() => setCurrentFrame('continuation')} className="text-blue-600 hover:text-blue-700 font-medium">
                ← Back to Options
              </button>
            </div>
          </div>
        </motion.div>
      );
    };

    export default QuizTransitionFrame;