import React from 'react';
import '../styles/HomePage.css';

const HomePage = () => {
  const username = localStorage.getItem('username');
  const userId = localStorage.getItem('userId');

  const handleSportSelect = (sport) => {
    if (!userId) {
      window.location.href = '/login';
    } else {
      window.location.href = `/chat/${sport}`;
    }
  };

  const sports = [
    { icon: '🏉', name: 'Rugby', key: 'rugby' },
    { icon: '⚽', name: 'Football', key: 'football' },
    { icon: '🎾', name: 'Tennis', key: 'tennis' },
    { icon: '🏐', name: 'Volley', key: 'volley' },
    { icon: '🚴', name: 'Cyclisme', key: 'cyclisme' }
  ];

  return (
    <div className="home-container">
      <header>
        <h1>Assistant Sportif</h1>
        {username ? (
          <div className="user-info">
            <p>Bonjour, {username}</p>
            <div className="user-actions">
              <a href="/history" className="history-button">Historique</a>
              <button 
                onClick={() => {
                  localStorage.removeItem('username');
                  localStorage.removeItem('userId');
                  window.location.reload();
                }}
              >
                Déconnexion
              </button>
            </div>
          </div>
        ) : (
          <a href="/login" className="login-button">Connexion</a>
        )}
      </header>

      <div className="main-content-wrapper">
        <aside className="sports-sidebar">
          <h2>Sports</h2>
          {sports.map((sport) => (
            <div 
              key={sport.key} 
              className="sport-sidebar-item" 
              onClick={() => handleSportSelect(sport.key)}
            >
              <span className="sport-icon">{sport.icon}</span>
              <span className="sport-name">{sport.name}</span>
            </div>
          ))}
        </aside>

        <main className="main-content">
          <div className="welcome-section">
            <h2>Bienvenue sur notre Assistant Sportif</h2>
            <p>Posez vos questions sur votre sport préféré et obtenez des réponses instantanées.</p>
          </div>
        </main>
      </div>

      <footer>
        <p>© 2025 Assistant Sportif - Tous droits réservés</p>
        <div className="footer-links">
          {username && (
            <>
              <a href="/history" className="history-link">Historique des conversations</a>
              <a href="/admin" className="admin-link">Administration</a>
            </>
          )}
        </div>
      </footer>
    </div>
  );
};

export default HomePage;