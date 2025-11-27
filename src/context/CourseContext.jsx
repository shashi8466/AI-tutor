import React, { createContext, useContext, useState, useEffect } from 'react';
    import { firebaseStorage, firestore } from '../firebase/firebase';
    import { ref as storageRef, deleteObject } from 'firebase/storage';
    import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
    
    const CourseContext = createContext();
    
    export const useCourse = () => {
      const context = useContext(CourseContext);
      if (!context) {
        throw new Error('useCourse must be used within a CourseProvider');
      }
      return context;
    };
    
    export const CourseProvider = ({ children }) => {
      const [courses, setCourses] = useState([]);
      const [selectedCourse, setSelectedCourse] = useState(null);
      const [currentLevel, setCurrentLevel] = useState('Easy');
      const [currentTopic, setCurrentTopic] = useState(null);
      const [studentProgress, setStudentProgress] = useState({});
      const [unlockedLevels, setUnlockedLevels] = useState({});
    
      // Load data from localStorage on mount
      useEffect(() => {
        const savedCourses = localStorage.getItem('aiTutorCourses');
        const savedProgress = localStorage.getItem('studentProgress');
        const savedUnlockedLevels = localStorage.getItem('unlockedLevels');

        console.log('CourseContext - Loading from localStorage:', { 
          hasSavedCourses: !!savedCourses,
          hasSavedProgress: !!savedProgress,
          hasSavedUnlockedLevels: !!savedUnlockedLevels
        });

        if (savedCourses) {
          try {
            const parsedCourses = JSON.parse(savedCourses);
            console.log('CourseContext - Parsed courses:', parsedCourses);
            if (Array.isArray(parsedCourses)) {
              setCourses(parsedCourses);
            } else {
              setCourses([]);
            }
          } catch (error) {
            console.error("Failed to parse courses from localStorage", error);
            setCourses([]);
          }
        }

        if (savedProgress) {
          try {
            const parsedProgress = JSON.parse(savedProgress);
            if (typeof parsedProgress === 'object' && parsedProgress !== null && !Array.isArray(parsedProgress)) {
              setStudentProgress(parsedProgress);
            } else {
              setStudentProgress({});
            }
          } catch (error) {
            console.error("Failed to parse student progress from localStorage", error);
            setStudentProgress({});
          }
        }

        if (savedUnlockedLevels) {
          try {
            const parsedUnlockedLevels = JSON.parse(savedUnlockedLevels);
            if (typeof parsedUnlockedLevels === 'object' && parsedUnlockedLevels !== null && !Array.isArray(parsedUnlockedLevels)) {
              setUnlockedLevels(parsedUnlockedLevels);
            } else {
              setUnlockedLevels({});
            }
          } catch (error) {
            console.error("Failed to parse unlocked levels from localStorage", error);
            setUnlockedLevels({});
          }
        }
      }, []);
    
      // Save courses to localStorage whenever courses change
      useEffect(() => {
        try {
          console.log('CourseContext - Saving courses to localStorage:', courses);
          localStorage.setItem('aiTutorCourses', JSON.stringify(courses));
          console.log('CourseContext - Courses saved successfully');
        } catch (error) {
          console.error("Failed to save courses to localStorage", error);
        }
      }, [courses]);
    
      // Save progress to localStorage whenever progress changes
      useEffect(() => {
        try {
          localStorage.setItem('studentProgress', JSON.stringify(studentProgress));
        } catch (error) {
          console.error("Failed to save student progress to localStorage", error);
        }
      }, [studentProgress]);
    
      // Save unlocked levels to localStorage
      useEffect(() => {
        try {
          localStorage.setItem('unlockedLevels', JSON.stringify(unlockedLevels));
        } catch (error) {
          console.error("Failed to save unlocked levels to localStorage", error);
        }
      }, [unlockedLevels]);
    
      const addCourse = (course) => {
        const newCourse = {
          ...course,
          id: course.id || `course_${Date.now()}`, // Use the existing ID if provided, otherwise generate one
          createdAt: new Date().toISOString(),
        };
        setCourses(prev => [...prev, newCourse]);
        return newCourse;
      };
    
      const updateCourse = (courseId, updates) => {
        setCourses(prev =>
          prev.map(course =>
            course.id === courseId ? { ...course, ...updates } : course
          )
        );
      };
    
      const deleteCourse = async (courseId) => {
        try {
          // Fetch associated quiz uploads from Firestore
          const uploadsCol = collection(firestore, 'quiz_uploads');
          const q = query(uploadsCol, where('course_id', '==', courseId));
          const snapshot = await getDocs(q);
          const uploads = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

          // Delete files from Firebase Storage
          for (const upload of uploads) {
            if (upload.file_path) {
              const fileRef = storageRef(firebaseStorage, `quiz-docs/${upload.file_path}`);
              try { await deleteObject(fileRef); } catch {}
            }
          }

          // Delete Firestore documents in quiz_uploads (and rely on app logic to ignore orphaned questions)
          for (const upload of uploads) {
            await deleteDoc(doc(firestore, 'quiz_uploads', upload.id));
          }
    
          // Update local state - THIS IS THE KEY FIX
          setCourses(prev => prev.filter(course => course.id !== courseId));
    
          // Also clear selection if the deleted course was selected
          if (selectedCourse?.id === courseId) {
            setSelectedCourse(null);
          }
    
          // Return success
          return { success: true };
        } catch (error) {
          console.error('Error during course deletion process:', error);
          throw error;
        }
      };
    
      const updateProgress = (courseId, level, topicId, progress) => {
        setStudentProgress(prev => ({
          ...prev,
          [courseId]: {
            ...prev[courseId],
            [level]: {
              ...prev[courseId]?.[level],
              [topicId]: progress,
            },
          },
        }));
      };
    
      const getTopicsForLevel = (course, level) => {
        console.log('CourseContext - getTopicsForLevel called with:', { course, level });
        if (!course) return [];
        const topics = course.topics?.[level] || [];
        console.log('CourseContext - Found topics:', topics);
        console.log('CourseContext - Study materials count:', course.studyMaterials?.[level]?.length);
        
        if (topics.length === 0 && course.studyMaterials?.[level]?.length > 0) {
          console.log('CourseContext - Using fallback topics for:', course.tutorType, level);
          const fallbackTopics = {
            'SAT Tutor': {
              Easy: ['Linear Equations', 'Basic Punctuation', 'Reading for Main Idea'],
              Medium: ['Systems of Equations', 'Grammar and Usage', 'Analyzing Paired Passages'],
              Hard: ['Advanced Functions', 'Rhetorical Analysis', 'Interpreting Complex Data'],
            },
            'Python Tutor': {
              Easy: ['Variables and Data Types', 'Basic Syntax', 'Simple Functions'],
              Medium: ['Lists and Dictionaries', 'Conditional Logic', 'Loops and Iteration'],
              Hard: ['Object-Oriented Programming', 'Decorators', 'Generators'],
            },
            'Math Tutor': {
              Easy: ['Basic Arithmetic', 'Fractions and Decimals', 'Simple Equations'],
              Medium: ['Algebraic Expressions', 'Linear Functions', 'Geometry Proofs'],
              Hard: ['Calculus Basics', 'Trigonometry', 'Advanced Statistics'],
            },
            'Science Tutor': {
              Easy: ['Scientific Method', 'Basic Chemistry', 'Simple Physics'],
              Medium: ['Chemical Reactions', 'Force and Motion', 'Cell Biology'],
              Hard: ['Quantum Physics', 'Organic Chemistry', 'Molecular Biology'],
            },
            'Language Tutor': {
              Easy: ['Basic Vocabulary', 'Simple Sentences', 'Common Phrases'],
              Medium: ['Complex Sentences', 'Grammar Rules', 'Writing Skills'],
              Hard: ['Literary Analysis', 'Advanced Composition', 'Linguistic Structures'],
            },
            'History Tutor': {
              Easy: ['Timeline Basics', 'Key Dates', 'Important Figures'],
              Medium: ['Historical Analysis', 'Cause and Effect', 'Primary Document Analysis'],
              Hard: ['Historiography', 'Advanced Research', 'Thematic Analysis'],
            },
          };
          const result = fallbackTopics[course.tutorType]?.[level] || [
            `Introduction to ${level} concepts`,
            `${level} Level Fundamentals`,
            `Advanced ${level} Topics`,
          ];
          console.log('CourseContext - Returning fallback topics:', result);
          return result;
        }
        console.log('CourseContext - Returning topics:', topics);
        return topics;
      };
    
      const unlockNextLevel = (courseId, completedLevel) => {
        const levelOrder = ['Easy', 'Medium', 'Hard'];
        const completedIndex = levelOrder.indexOf(completedLevel);
        const currentUnlockedLevel = getUnlockedLevel(courseId);
        const currentUnlockedIndex = levelOrder.indexOf(currentUnlockedLevel);
    
        if (completedIndex !== -1 && completedIndex >= currentUnlockedIndex && completedIndex < levelOrder.length - 1) {
          const nextLevel = levelOrder[completedIndex + 1];
          setUnlockedLevels(prev => ({
            ...prev,
            [courseId]: nextLevel,
          }));
        }
      };
    
      const getUnlockedLevel = (courseId) => {
        return unlockedLevels[courseId] || 'Easy';
      };
    
      const value = {
        courses,
        selectedCourse,
        setSelectedCourse,
        currentLevel,
        setCurrentLevel,
        currentTopic,
        setCurrentTopic,
        studentProgress,
        addCourse,
        updateCourse,
        deleteCourse,
        updateProgress,
        getTopicsForLevel,
        unlockNextLevel,
        getUnlockedLevel,
      };
    
      return (
        <CourseContext.Provider value={value}>
          {children}
        </CourseContext.Provider>
      );
    };