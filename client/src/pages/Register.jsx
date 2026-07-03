import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';

const Register = () => {
  const navigate = useNavigate();
  const { register, error, loading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    const { username, email, password, phoneNumber } = formData;
    if (!username || !email || !password || !phoneNumber) {
      setLocalError('Please fill in all fields');
      return;
    }
    
    // Validate password strength (must match server requirements)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setLocalError('Password must be at least 8 characters and contain uppercase, lowercase, number, and special character (@$!%*?&)');
      return;
    }

    // Validate username (3-30 characters, alphanumeric + _ -)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      setLocalError('Username must be 3-30 characters (alphanumeric, underscore, hyphen only)');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    const result = await register(formData);
    if (result.success) {
      navigate('/chats');
    } else {
      setLocalError(result.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-12 p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text">Create Account</h1>
            <p className="text-text-secondary text-sm mt-1">Join the conversation</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-text-secondary text-sm mb-1">Username</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-background border border-border-color rounded-12 py-3 pl-10 pr-4 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
                    placeholder="Choose a username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-1">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-background border border-border-color rounded-12 py-3 pl-10 pr-4 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-1">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full bg-background border border-border-color rounded-12 py-3 pl-10 pr-4 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-1">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-background border border-border-color rounded-12 py-3 pl-10 pr-12 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
                    placeholder="Password (8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {(localError || error) && (
                <div className="text-red-500 text-sm">{localError || error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3 rounded-12 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;