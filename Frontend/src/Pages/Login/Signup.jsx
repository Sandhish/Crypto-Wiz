import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../../Services/authService';
import styles from '../Login/Login.module.css';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await signup(formData);
      localStorage.setItem('token', data.token);
      navigate('/user');
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBackground}>
        <div className={styles.gradientOverlay}></div>
        <div className={styles.gridPattern}></div>
      </div>

      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <UserPlus className={styles.authIcon} size={28} />
          <h2>Create Account</h2>
          <p>Join millions of crypto traders worldwide</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <User className={styles.inputIcon} size={18} />
            <input type="text" name="name" placeholder="Full Name"
              value={formData.name} onChange={handleInputChange} required
            />
          </div>

          <div className={styles.inputGroup}>
            <Mail className={styles.inputIcon} size={18} />
            <input type="email" name="email" placeholder="Email Address"
              value={formData.email} onChange={handleInputChange} required
            />
          </div>

          <div className={styles.inputGroup}>
            <Lock className={styles.inputIcon} size={18} />
            <input type="password" name="password" placeholder="Password"
              value={formData.password} onChange={handleInputChange} required
            />
          </div>

          <button type="submit" className={styles.authButton}>
            Create Account
          </button>
        </form>

        <div className={styles.authFooter}>
          <p> Already have an account?{' '}
            <a href="/login" className={styles.authLink}>
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;