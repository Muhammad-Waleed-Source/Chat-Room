import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

function Chat({ user, onLogout }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io('/', {
      transports: ['websocket'], // Force websocket
    });

    setSocket(newSocket);

    newSocket.emit('join', user.username);

    newSocket.on('message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    return () => newSocket.close();
  }, [user.username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && socket) {
      socket.emit('sendMessage', { user: user.username, text: input });
      setInput('');
    }
  };

  return (
    <div className="chat-layout">
      <div className="sidebar">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '60px', height: '60px' }} />
        </div>
        <h3>Online Users ({onlineUsers.length})</h3>
        <div className="user-list">
          {onlineUsers.map((u, index) => (
            <div key={index} className="user-list-item">
              <div className="status-dot"></div>
              {u.avatar && (
                  <img 
                    src={u.avatar} 
                    alt="avatar" 
                    style={{ 
                      width: '30px', 
                      height: '30px', 
                      borderRadius: '50%', 
                      marginRight: '10px',
                      objectFit: 'cover'
                    }} 
                  />
              )}
              {u.username} {u.username === user.username && '(You)'}
            </div>
          ))}
        </div>
        <button 
          onClick={onLogout} 
          className="primary-btn" 
          style={{ marginTop: 'auto', background: 'var(--error-color)' }}
        >
          Logout
        </button>
      </div>

      <div className="chat-area">
        <div className="messages">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.user === user.username ? 'own' : msg.user === 'System' ? 'system' : 'other'}`}
            >
              {msg.user !== user.username && msg.user !== 'System' && (
                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '2px' }}>{msg.user}</div>
              )}
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="input-area" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="primary-btn" style={{ width: '100px', marginTop: 0 }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
