import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { encryptMessage, decryptMessage } from '../utils/crypto';

function Chat({ user, onLogout }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [globalKey, setGlobalKey] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch Global Key
    fetch('/api/globalKey')
      .then(res => res.json())
      .then(data => setGlobalKey(data.publicKey))
      .catch(err => console.error("Failed to fetch global key", err));
  }, []);

  useEffect(() => {
    const newSocket = io('/', {
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.emit('join', user.username);

    // Handle system messages (join/leave)
    newSocket.on('message', (data) => {
       // System messages come here
       if (data.type === 'system' || data.user === 'System') {
           setMessages((prev) => [...prev, { ...data, type: 'system' }]);
       }
    });

    // Handle standard/broadcast messages
    newSocket.on('chatMessage', (data) => {
      // If this message is mentioned for ME, handle it in mentionedMessage event instead to avoid duplicates
      if (data.mentionedUser && data.mentionedUser === user.username) {
        return; 
      }
      
      // If I sent this message, ignore it (I display it optimistically).
      // This is crucial for Mentions because I can't decrypt the echo.
      if (data.from === user.username) {
        return;
      }
      
      let displayText = data.text;
      if (data.encryptedText) {
        displayText = `${data.encryptedText.substring(0, 20)}`;
      }
      
      setMessages((prev) => [...prev, { ...data, text: displayText, isEncrypted: !!data.encryptedText }]);
    });

    // Handle private mentioned messages
    newSocket.on('mentionedMessage', (data) => {
       const privateKey = localStorage.getItem('privateKey_' + user.username);
       let decrypted = "Failed to decrypt";
       if (privateKey) {
         const res = decryptMessage(data.decryptableText, privateKey);
         if (res) decrypted = res;
       }
       
       setMessages((prev) => [...prev, { 
         ...data, 
         text: decrypted, 
         isMention: true,
         isDecrypted: true
       }]);
    });

    newSocket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    return () => newSocket.close();
  }, [user.username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() && socket) {
      if (input.startsWith('@')) {
        const parts = input.split(' ');
        const mentionedUser = parts[0].substring(1);
        const actualMessage = parts.slice(1).join(' '); // Helper to get rest of string
        
        // Fetch User Public Key
        try {
           const res = await fetch(`/api/users/${mentionedUser}/publicKey`);
           const data = await res.json();
           
           if (data.success !== false && data.publicKey && globalKey) {
              // Encrypt
              const encryptedForAll = encryptMessage(actualMessage, globalKey);
              const encryptedForMentioned = encryptMessage(actualMessage, data.publicKey);
              
              socket.emit('sendMessage', {
                from: user.username,
                mentionedUser: mentionedUser,
                encryptedForAll,
                encryptedForMentioned
              });
              
              // Optimistic UI for Sender? 
              // Sender wants to see what they sent.
              // Server broadcasts 'chatMessage' which we listener handles.
              // But 'chatMessage' has 'encryptedForAll'.
              // We (Sender) can't decrypt 'encryptedForAll' (it's global key).
              // So we will see "Encrypted..." if we rely on broadcast.
              // Logic Check: Sender needs to see their own plain text.
              // I should append my own message manually OR handle it in the listener?
              // The listener receives 'chatMessage'.
              // If 'from' === user.username, we still see 'encryptedText'.
              // We should probably just append it locally here.
              
              // But if we append locally, and listener appends, we get specific duplicates.
              // My listener logic: "if data.mentionedUser === user... return" -> this handles receiving MY mention.
              // But if I sent it, the mentions user is SOMEONE ELSE.
              // So listener will process it.
              // But listener sees 'encryptedText'.
              // So I (Sender) will see "Encrypted". This is bad.
              
              // FIX: In 'chatMessage' listener:
              // If data.from === user.username, ignore? 
              // And append locally here?
              // Yes, that's standard optimistic UI pattern.
              
              setMessages(prev => [...prev, {
                from: user.username,
                text: input, // Show original input (which contains @username ...)
                isMention: true,
                timestamp: Date.now()
              }]);
              
              setInput('');
              return; 
           }
        } catch (err) {
          console.error("Encryption failed or user not found", err);
           // Fallback to normal send if error? Or alert?
           // Proceed to normal send logic below if failed?
        }
      }
      
      // Normal Message
      socket.emit('sendMessage', { from: user.username, text: input });
      // Optimistic append for normal message too, to be consistent
      setMessages(prev => [...prev, { from: user.username, text: input, timestamp: Date.now() }]);
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
              className={`message ${
                msg.type === 'system' || msg.user === 'System' ? 'system' :
                msg.from === user.username ? 'own' : 
                'other'
              } ${msg.isMention ? 'highlight-mention' : ''}`}
            >
              {(msg.type !== 'system' && msg.user !== 'System' && msg.from !== user.username) && (
                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '2px' }}>
                  {msg.from} {msg.isMention && <span style={{color: 'yellow'}}>(mentioned you)</span>}
                </div>
              )}
              {msg.isEncrypted && msg.type !== 'system' ? <span style={{fontStyle: 'italic', color: '#aaa'}}>{msg.text}</span> : msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="input-area" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="Type @username to mention..."
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
