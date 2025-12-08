import React, { useState } from 'react';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
    }

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
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
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
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
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
