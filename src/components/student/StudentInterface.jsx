import { useState, useEffect } from 'react';
import { useCourse } from '../../context/CourseContext';
import WelcomeFrame from './frames/WelcomeFrame';
import TopicIntroFrame from './frames/TopicIntroFrame';
import QuizFrame from './frames/QuizFrame';
import VideosFrame from './frames/VideosFrame';
import LearningMaterialsFrame from './frames/LearningMaterialsFrame';
import ChatFrame from './frames/ChatFrame';
import ContinuationFrame from './frames/ContinuationFrame';
import QuizTransitionFrame from './frames/QuizTransitionFrame';

const StudentInterface = ({ user }) => {
  const { courses, unlockNextLevel } = useCourse();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentLevel, setCurrentLevel] = useState('Easy');
  const [currentTopic, setCurrentTopic] = useState(null);
  const [currentFrame, setCurrentFrame] = useState('welcome');
  const [frameData, setFrameData] = useState({});
  const [previousScores, setPreviousScores] = useState({});

  // Debug: Log available courses
  useEffect(() => {
    console.log('StudentInterface - Available courses:', courses);
    console.log('StudentInterface - Courses from localStorage:', localStorage.getItem('aiTutorCourses'));
  }, [courses]);

  const activeCourses = courses.filter(course => course.status);

  const frameComponents = {
    welcome: WelcomeFrame,
    topicIntro: TopicIntroFrame,
    learningMaterials: LearningMaterialsFrame,
    videos: VideosFrame,
    quiz: QuizFrame,
    quizTransition: QuizTransitionFrame,
    chat: ChatFrame,
    continuation: ContinuationFrame
  };

  const CurrentFrameComponent = frameComponents[currentFrame] || WelcomeFrame;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <CurrentFrameComponent
          courses={activeCourses}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          currentLevel={currentLevel}
          setCurrentLevel={setCurrentLevel}
          currentFrame={currentFrame}
          setCurrentFrame={setCurrentFrame}
          frameData={frameData}
          setFrameData={setFrameData}
          studentName={user?.fullName}
          previousScores={previousScores}
          setPreviousScores={setPreviousScores}
          currentTopic={currentTopic}
          setCurrentTopic={setCurrentTopic}
          unlockNextLevel={unlockNextLevel}
        />
      </div>
    </div>
  );
};

export default StudentInterface;