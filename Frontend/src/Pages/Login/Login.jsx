import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../Services/authService';
import styles from './Login.module.css';
import { LogIn, Mail, Lock, Loader } from 'lucide-react';
import { useAuth } from '../../Context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login: setAuthUser } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await login(formData);
      setAuthUser(data.token);
      navigate('/user');
    } catch (error) {
      console.error('Error during login:', error);
      setError(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
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
          <LogIn className={styles.authIcon} size={28} />
          <h2>Welcome Back</h2>
          <p>Login to manage your crypto portfolio</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <Mail className={styles.inputIcon} size={18} />
            <input type="email" name="email" placeholder="Email Address" value={formData.email}
              onChange={handleInputChange} disabled={isLoading} required />
          </div>

          <div className={styles.inputGroup}>
            <Lock className={styles.inputIcon} size={18} />
            <input type="password" name="password" placeholder="Password" value={formData.password}
              onChange={handleInputChange} disabled={isLoading} required />
          </div>

          <div className={styles.forgotPassword}>
            <button type="button" onClick={() => navigate('/reset-password')} className={styles.secondaryButton} disabled={isLoading} >
              Forgot Password?
            </button>
          </div>

          <button type="submit" className={`${styles.authButton} ${isLoading ? styles.loading : ''}`} disabled={isLoading} >
            {isLoading ? (
              <>
                <Loader className={styles.spinnerIcon} size={18} />
                <span>Logging in...</span>
              </>
            ) : (
              'Login to Account'
            )}
          </button>
        </form>

        <div className={styles.authFooter}>
          <p>
            Don't have an account?{' '}
            <a href="/signup" className={styles.authLink} tabIndex={isLoading ? -1 : 0}>
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;