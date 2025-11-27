import SafeIcon from '../../common/SafeIcon';
    import * as FiIcons from 'react-icons/fi';
    const {FiBookOpen}=FiIcons;

    const AuthLayout=({children,title,subtitle})=> {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center items-center space-x-3 mb-8">
              <SafeIcon icon={FiBookOpen} className="h-12 w-12 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">AI Tutor</h1>
            </div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <p className="mt-2 text-gray-600">{subtitle}</p>
            </div>
          </div>
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
              {children}
            </div>
          </div>
        </div>
      );
    };

    export default AuthLayout;