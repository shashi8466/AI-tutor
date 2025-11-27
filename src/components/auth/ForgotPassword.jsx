import { useState } from 'react';
    import { Link } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { useAuth } from '../../context/AuthContext';
    import SafeIcon from '../../common/SafeIcon';
    import AuthLayout from './AuthLayout';
    import * as FiIcons from 'react-icons/fi';
    const { FiMail, FiArrowLeft, FiCheckCircle } = FiIcons;

    const ForgotPassword = () => {
      const { forgotPassword } = useAuth();
      const [email, setEmail] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const [isSubmitted, setIsSubmitted] = useState(false);
      const [errors, setErrors] = useState({});

      const handleChange = (e) => {
        setEmail(e.target.value);
        if (errors.email) {
          setErrors(prev => ({ ...prev, email: '' }));
        }
      };

      const validateEmail = () => {
        if (!email.trim()) {
          setErrors({ email: 'Email is required' });
          return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
          setErrors({ email: 'Email is invalid' });
          return false;
        }
        return true;
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateEmail()) return;
        setIsLoading(true);
        try {
          await forgotPassword(email);
          setIsSubmitted(true);
        } catch (error) {
          setErrors({ general: error.message });
        } finally {
          setIsLoading(false);
        }
      };

      if (isSubmitted) {
        return (
          <AuthLayout title="Check Your Email" subtitle="We've sent password reset instructions">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <SafeIcon icon={FiCheckCircle} className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">
                  Password reset instructions sent!
                </h3>
                <p className="text-gray-600">
                  We&apos;ve sent an email to <strong>{email}</strong> with instructions to reset your password.
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Didn&apos;t receive the email?</strong> Check your spam folder or try again with a different email address.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-500 font-medium"
                >
                  <SafeIcon icon={FiArrowLeft} className="h-4 w-4" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          </AuthLayout>
        );
      }

      return (
        <AuthLayout title="Reset Password" subtitle="Enter your email to receive reset instructions">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
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
                  value={email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
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
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Reset Instructions'
              )}
            </motion.button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-500 font-medium"
              >
                <SafeIcon icon={FiArrowLeft} className="h-4 w-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        </AuthLayout>
      );
    };

    export default ForgotPassword;