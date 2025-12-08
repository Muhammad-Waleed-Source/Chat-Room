import React, { useState } from 'react';
import Auth from './components/Auth';
import Chat from './components/Chat';

function App() {
  const [user, setUser] = useState(null);

  return (
    <div className={user ? "container" : ""}>
      {user ? (
        <Chat user={user} onLogout={() => setUser(null)} />
      ) : (
        <Auth onLogin={setUser} />
      )}
    </div>
  );
}

export default App;
