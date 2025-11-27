import { Link, useLocation } from 'react-router-dom';
    import { useAuth } from '../../context/AuthContext';
    import SafeIcon from '../../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    
    const { FiBookOpen, FiHome, FiSettings, FiUser, FiLogOut } = FiIcons;
    
    const Navigation = () => {
      const location = useLocation();
      const { user, logout } = useAuth();
    
      if (!user) return null;
    
      return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center space-x-3">
                  <SafeIcon icon={FiBookOpen} className="h-8 w-8 text-blue-600" />
                  <h1 className="text-xl font-bold text-gray-900">AI Tutor Platform</h1>
                </Link>
                <Link 
                  to={`/${user.role}`}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <SafeIcon icon={FiHome} className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-4">
                  {user.role==='admin' ? (
                    <Link 
                      to="/admin" 
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname==='/admin' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <SafeIcon icon={FiSettings} className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  ) : (
                    <Link 
                      to="/student" 
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname==='/student' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <SafeIcon icon={FiUser} className="h-4 w-4" />
                      <span>Student</span>
                    </Link>
                  )}
                </div>
                <div className="flex items-center space-x-4 border-l border-gray-200 pl-6">
                  <button
                    onClick={logout}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <SafeIcon icon={FiLogOut} className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      );
    };
    
    export default Navigation;