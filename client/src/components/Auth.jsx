import React, { useState } from 'react';
import { generateKeys } from '../utils/crypto';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };



  const validateInput = () => {
     if (!isLogin) {
        // Full Name Validation
        const nameRegex = /^[A-Za-z ]+$/;
        if (!nameRegex.test(fullName)) {
             setError("Full name can only contain alphabets and spaces");
             return false;
        }
        if (fullName.length < 3 || fullName.length > 40) {
             setError("Full name must be between 3 and 40 characters");
             return false;
        }

        // Username Validation
        const usernameRegex = /^[a-zA-Z]+$/;
        if (!usernameRegex.test(username)) {
             setError("Username must contain only alphabets");
             return false;
        }
        // Strict Lowercase Check
        if (username !== username.toLowerCase()) {
             setError("Username must be all lowercase");
             return false;
        }
        
        if (password.length < 8) {
             setError("Password must be at least 8 characters long");
             return false;
        }
     }
     return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateInput()) return;
    // previous logic...

    const endpoint = isLogin ? '/api/login' : '/api/register';
    
    let body;
    let headers = {};

    if (isLogin) {
      body = JSON.stringify({ username, password });
      headers['Content-Type'] = 'application/json';
    } else {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('fullName', fullName);
      formData.append('email', email);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      body = formData;
      
      // Generate RSA Keys
      const crypt = generateKeys();
      const privateKey = crypt.getPrivateKey();
      const publicKey = crypt.getPublicKey();
      
      // Store private key locally
      localStorage.setItem('privateKey', privateKey);
      
      // process.env or just standard? JSEncrypt keys are PEM strings.
      formData.append('publicKey', publicKey);
    }
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: body,
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || 'An error occurred');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  return (
    <div className="auth-container">
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img src="/logo.png" alt="Logo" style={{ width: '80px', height: '80px' }} />
      </div>
      <div className="auth-tabs">
        <button 
          className={`auth-tab ${isLogin ? 'active' : ''}`} 
          onClick={() => {
            setIsLogin(true);
            setError('');
          }}
        >
          Login
        </button>
        <button 
          className={`auth-tab ${!isLogin ? 'active' : ''}`} 
          onClick={() => {
            setIsLogin(false);
            setError('');
          }}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="Full Name (Min 3 chars, Alphabets Only)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={fullName && (!/^[A-Za-z ]+$/.test(fullName) || fullName.length < 3 || fullName.length > 40) ? 'input-error' : ''}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </>
        )}
        <input
          type="text"
          placeholder="Username (Lowercase Alphabets Only)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className={!isLogin && username && (!/^[a-zA-Z]+$/.test(username) || username !== username.toLowerCase()) ? 'input-error' : ''}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {!isLogin && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>
              Avatar (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ padding: '5px' }}
            />
            {avatar && (
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <img 
                  src={avatar} 
                  alt="Avatar Preview" 
                  style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} 
                />
              </div>
            )}
          </div>
        )}

        {error && <p style={{ color: 'var(--error-color)' }}>{error}</p>}

        <button type="submit" className="primary-btn">
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
    </div>
  );
}

export default Auth;
