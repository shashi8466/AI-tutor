import {useState} from 'react';
    import {useNavigate,Link} from 'react-router-dom';
    import {motion} from 'framer-motion';
    import {useAuth} from '../../context/AuthContext';
    import SafeIcon from '../../common/SafeIcon';
    import AuthLayout from './AuthLayout';
    import * as FiIcons from 'react-icons/fi';
    const {FiUser,FiMail,FiLock,FiPhone,FiCalendar,FiCheck}=FiIcons;

    const Register=()=> {
      const navigate=useNavigate();
      const {register}=useAuth();
      const [formData,setFormData]=useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        phoneNumber: '',
        age: '',
        grade: '',
        organization: ''
      });
      const [errors,setErrors]=useState({});
      const [isLoading,setIsLoading]=useState(false);

      const handleChange=(e)=> {
        const {name,value,type,checked}=e.target;
        setFormData(prev=> ({
          ...prev,
          [name]: type==='checkbox' ? checked : value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
          setErrors(prev=> ({...prev,[name]: ''}));
        }
      };

      const validateForm=()=> {
        const newErrors={};
        if (!formData.fullName.trim()) {
          newErrors.fullName='Full name is required';
        }
        if (!formData.email.trim()) {
          newErrors.email='Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email='Email is invalid';
        }
        if (!formData.password) {
          newErrors.password='Password is required';
        } else if (formData.password.length < 6) {
          newErrors.password='Password must be at least 6 characters';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword='Passwords do not match';
        }
        if (formData.role==='student' && formData.age && (formData.age < 5 || formData.age > 100)) {
          newErrors.age='Please enter a valid age';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length===0;
      };

      const handleSubmit=async (e)=> {
        e.preventDefault();
        if (!validateForm()) return;
        
        setIsLoading(true);
        try {
          const registrationData = { ...formData };
          delete registrationData.confirmPassword;
          await register(registrationData);
          // Redirect based on role
          if (formData.role==='admin') {
            navigate('/admin');
          } else {
            navigate('/student');
          }
        } catch (error) {
          setErrors({general: error.message});
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <AuthLayout title="Create Account" subtitle="Join AI Tutor and start learning today">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative">
                  <input 
                    type="radio" 
                    name="role" 
                    value="student" 
                    checked={formData.role==='student'} 
                    onChange={handleChange}
                    className="sr-only peer" 
                  />
                  <div className="p-4 border-2 rounded-lg cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Student</span>
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 peer-checked:border-blue-500 peer-checked:bg-blue-500">
                        {formData.role==='student' && (
                          <SafeIcon icon={FiCheck} className="h-3 w-3 text-white m-0.5" />
                        )}
                      </div>
                    </div>
                  </div>
                </label>
                <label className="relative">
                  <input 
                    type="radio" 
                    name="role" 
                    value="admin" 
                    checked={formData.role==='admin'} 
                    onChange={handleChange}
                    className="sr-only peer" 
                  />
                  <div className="p-4 border-2 rounded-lg cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Admin</span>
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 peer-checked:border-blue-500 peer-checked:bg-blue-500">
                        {formData.role==='admin' && (
                          <SafeIcon icon={FiCheck} className="h-3 w-3 text-white m-0.5" />
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiUser} className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  name="fullName" 
                  value={formData.fullName} 
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.fullName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

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
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
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
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Create a password"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiLock} className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {formData.role==='admin' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SafeIcon icon={FiPhone} className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      type="tel" 
                      name="phoneNumber" 
                      value={formData.phoneNumber} 
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization (Optional)</label>
                  <input 
                    type="text" 
                    name="organization" 
                    value={formData.organization} 
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your organization"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SafeIcon icon={FiCalendar} className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      type="number" 
                      name="age" 
                      value={formData.age} 
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.age ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your age"
                      min="5"
                      max="100"
                    />
                  </div>
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade (Optional)</label>
                  <select 
                    name="grade" 
                    value={formData.grade} 
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select your grade</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                    <option value="6">Grade 6</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                    <option value="college">College</option>
                  </select>
                </div>
              </>
            )}

            <motion.button 
              whileHover={{scale: 1.02}} 
              whileTap={{scale: 0.98}} 
              type="submit" 
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Sign Up'
              )}
            </motion.button>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
              </span>
              <Link 
                to="/login" 
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Sign In
              </Link>
            </div>
          </form>
        </AuthLayout>
      );
    };

    export default Register;