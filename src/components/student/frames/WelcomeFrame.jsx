import { motion } from 'framer-motion';
    import SafeIcon from '../../../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    const { FiBook, FiArrowRight } = FiIcons;

    const WelcomeFrame = ({ courses, setSelectedCourse, setCurrentFrame, studentName }) => {
      console.log('WelcomeFrame - Received courses:', courses);
      
      const handleCourseSelect = (course) => {
        console.log('WelcomeFrame - Course selected:', course);
        setSelectedCourse(course);
        setCurrentFrame('topicIntro');
      };

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="mb-8">
            <SafeIcon icon={FiBook} className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Hello, {studentName?.split(' ')[0]}! 👋 Welcome to your AI Tutor
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              I&apos;m here to help you learn step-by-step with interactive lessons and quizzes. Please select a course to begin — for example: Python, Algebra, Chemistry.
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No courses available. Please contact your administrator.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <motion.button
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleCourseSelect(course)}
                  className="group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 text-left hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">
                      {course.title}
                    </h3>
                    <SafeIcon icon={FiArrowRight} className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {course.tutorType}
                    </span>
                    <span className="text-gray-500">{course.level} Level</span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      );
    };

    export default WelcomeFrame;