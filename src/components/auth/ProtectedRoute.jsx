import {Navigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import StudentInterface from '../student/StudentInterface';

const ProtectedRoute=({children,requiredRole})=> {
  const {user,isAuthenticated,isLoading}=useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    return <Navigate to={`/${user.role}`} replace />;
  }

  // If the child is StudentInterface, pass the user prop
  if (children.type === StudentInterface) {
    return <children.type {...children.props} user={user} />;
  }

  return children;
};

export default ProtectedRoute;