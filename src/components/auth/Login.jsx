import { useState, useEffect } from 'react';
    import { useNavigate, Link } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { useAuth } from '../../context/AuthContext';
    import SafeIcon from '../../common/SafeIcon';
    import AuthLayout from './AuthLayout';
    import * as FiIcons from 'react-icons/fi';
    const { FiMail, FiLock, FiAlertCircle } = FiIcons;

    const Login = () => {
      const navigate = useNavigate();
      const { login, user } = useAuth();
      const [formData, setFormData] = useState({ email: '', password: '' });
      const [errors, setErrors] = useState({});
      const [isLoading, setIsLoading] = useState(false);

      // Redirect if already authenticated
      useEffect(() => {
        if (user) {
          navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
        }
      }, [user, navigate]);

      const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
          setErrors(prev => ({ ...prev, [name]: '' }));
        }
      };

      const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Email is invalid';
        }
        if (!formData.password) {
          newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
          const userData = await login(formData.email, formData.password);
          // Redirect based on role
          if (userData.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/student');
          }
        } catch (error) {
          setErrors({ general: error.message });
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <AuthLayout title="Welcome Back" subtitle="Sign in to your AI Tutor account">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                <SafeIcon icon={FiAlertCircle} className="h-4 w-4 mr-2 flex-shrink-0" />
                {errors.general}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiMail} className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiLock} className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot Password?
              </Link>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </motion.button>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
              </span>
              <Link
                to="/register"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Sign Up
              </Link>
            </div>
          </form>
        </AuthLayout>
      );
    };

    export default Login;