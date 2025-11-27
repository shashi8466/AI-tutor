import { useState } from 'react';
    import { motion } from 'framer-motion';
    import { useAuth } from '../../context/AuthContext';
    import CourseForm from './CourseForm';
    import CourseList from './CourseList';
    import SafeIcon from '../../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    const { FiPlus } = FiIcons;

    const AdminDashboard = () => {
      const { user } = useAuth();
      const [showForm, setShowForm] = useState(false);
      const [editingCourse, setEditingCourse] = useState(null);

      const handleEditCourse = (course) => {
        setEditingCourse(course);
        setShowForm(true);
      };

      const handleCloseForm = () => {
        setShowForm(false);
        setEditingCourse(null);
      };

      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}!
                </h2>
                <p className="text-gray-600 mt-2">Create and manage AI tutor courses</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
              >
                <SafeIcon icon={FiPlus} className="h-5 w-5" />
                <span>Add New Course</span>
              </motion.button>
            </div>
          </div>

          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <CourseForm onClose={handleCloseForm} editingCourse={editingCourse} />
            </motion.div>
          )}

          <CourseList onEditCourse={handleEditCourse} />
        </div>
      );
    };

    export default AdminDashboard;