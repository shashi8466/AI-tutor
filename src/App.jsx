import {HashRouter as Router,Routes,Route,Navigate} from 'react-router-dom';
    import {AuthProvider,useAuth} from './context/AuthContext';
    import {CourseProvider} from './context/CourseContext';
    import Navigation from './components/common/Navigation';
    import ProtectedRoute from './components/auth/ProtectedRoute';

    // Auth Components
    import Login from './components/auth/Login';
    import Register from './components/auth/Register';
    import ForgotPassword from './components/auth/ForgotPassword';

    // App Components
    import AdminDashboard from './components/admin/AdminDashboard';
    import StudentInterface from './components/student/StudentInterface';

    import './App.css';

    function AppRoutes() {
      const {user,isAuthenticated,isLoading}=useAuth();

      if (isLoading) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading AI Tutor...</p>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <Routes>
            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to={`/${user.role}`} replace /> : <Login />} 
            />
            <Route 
              path="/register" 
              element={isAuthenticated ? <Navigate to={`/${user.role}`} replace /> : <Register />} 
            />
            <Route 
              path="/forgot-password" 
              element={isAuthenticated ? <Navigate to={`/${user.role}`} replace /> : <ForgotPassword />} 
            />

            {/* Protected Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentInterface />
                </ProtectedRoute>
              } 
            />
            
            {/* Default Route */}
            <Route 
              path="/" 
              element={<Navigate to={isAuthenticated ? `/${user.role}` : "/login"} replace />} 
            />
            
            {/* Catch-all Route */}
            <Route 
              path="*" 
              element={<Navigate to={isAuthenticated ? `/${user.role}` : "/login"} replace />} 
            />
          </Routes>
        </div>
      );
    }

    function App() {
      return (
        <Router>
          <AuthProvider>
            <CourseProvider>
              <AppRoutes />
            </CourseProvider>
          </AuthProvider>
        </Router>
      );
    }

    export default App;