import React, { createContext, useContext, useState, useEffect } from 'react';

    const AuthContext = createContext();

    export const useAuth = () => {
      const context = useContext(AuthContext);
      if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
      }
      return context;
    };

    export const AuthProvider = ({ children }) => {
      const [user, setUser] = useState(null);
      const [isAuthenticated, setIsAuthenticated] = useState(false);
      const [isLoading, setIsLoading] = useState(true);

      // Load user from localStorage on mount
      useEffect(() => {
        const savedUser = localStorage.getItem('aiTutorUser');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            // Validate user data structure
            if (userData && typeof userData === 'object' && userData.id) {
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              // Clear invalid user data
              localStorage.removeItem('aiTutorUser');
            }
          } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('aiTutorUser');
          }
        }
        setIsLoading(false);
      }, []);

      // Save user to localStorage whenever user changes
      useEffect(() => {
        if (user) {
          try {
            localStorage.setItem('aiTutorUser', JSON.stringify(user));
          } catch (error) {
            console.error("Failed to save user to localStorage", error);
          }
        } else {
          localStorage.removeItem('aiTutorUser');
        }
      }, [user]);

      const register = async (userData) => {
        // Simulate API call
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            // Get existing users
            const existingUsers = JSON.parse(localStorage.getItem('aiTutorUsers') || '[]');
            
            // Check if email already exists
            if (existingUsers.find(u => u.email === userData.email)) {
              reject(new Error('Email already exists'));
              return;
            }
            
            // Create new user
            const newUser = {
              id: Date.now().toString(),
              ...userData,
              createdAt: new Date().toISOString()
            };
            
            // Save to localStorage
            existingUsers.push(newUser);
            localStorage.setItem('aiTutorUsers', JSON.stringify(existingUsers));
            
            // Auto login after registration
            const { password: _password, ...userWithoutPassword } = newUser;
            setUser(userWithoutPassword);
            setIsAuthenticated(true);
            resolve(userWithoutPassword);
          }, 1000);
        });
      };

      const login = async (email, password) => {
        // Simulate API call
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            const users = JSON.parse(localStorage.getItem('aiTutorUsers') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
              // Remove password from user object before storing
              const { password: _, ...userWithoutPassword } = user;
              setUser(userWithoutPassword);
              setIsAuthenticated(true);
              resolve(userWithoutPassword);
            } else {
              reject(new Error('Invalid email or password'));
            }
          }, 1000);
        });
      };

      const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('aiTutorUser');
      };

      const forgotPassword = async (email) => {
        // Simulate password reset email
        return new Promise((resolve) => {
          setTimeout(() => {
            console.log(`Password reset for ${email}`);
            resolve({
              message: 'Password reset instructions have been sent to your email.',
              email
            });
          }, 1500);
        });
      };

      const value = {
        user,
        isAuthenticated,
        isLoading,
        register,
        login,
        logout,
        forgotPassword
      };

      return (
        <AuthContext.Provider value={value}>
          {children}
        </AuthContext.Provider>
      );
    };