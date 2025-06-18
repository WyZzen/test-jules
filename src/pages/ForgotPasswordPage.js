import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password', // URL to redirect to after email confirmation
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Password reset email sent. Please check your inbox.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Forgot Password</h2>
      <form onSubmit={handlePasswordReset}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Email'}
        </button>
      </form>
      <p>
        Remembered your password? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
