// pages/AdminPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/AdminPage.css';

const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    if (!localStorage.getItem('userId')) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setError('Impossible de charger les statistiques');
        }
      } catch (error) {
        setError('Erreur de connexion au serveur');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="admin-container">
        <header>
          <h1>Page d'administration</h1>
          <Link to="/" className="back-button">Retour à l'accueil</Link>
        </header>
        <div className="loading-indicator">Chargement des statistiques...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container">
        <header>
          <h1>Page d'administration</h1>
          <Link to="/" className="back-button">Retour à l'accueil</Link>
        </header>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header>
        <h1>Page d'administration</h1>
        <Link to="/" className="back-button">Retour à l'accueil</Link>
      </header>

      <main className="admin-content">
        <section className="stats-overview">
          <h2>Statistiques globales</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.user_count}</div>
              <div className="stat-label">Utilisateurs</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.conversation_count}</div>
              <div className="stat-label">Conversations</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.message_count}</div>
              <div className="stat-label">Messages</div>
            </div>
          </div>
        </section>

        <section className="sport-stats">
          <h2>Statistiques par sport</h2>
          <div className="sport-chart">
            {Object.entries(stats.sport_stats).map(([sport, count]) => (
              <div key={sport} className="sport-bar">
                <div className="sport-label">
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </div>
                <div 
                  className="sport-value-bar"
                  style={{ 
                    width: `${(count / Math.max(...Object.values(stats.sport_stats))) * 100}%`,
                    backgroundColor: getSportColor(sport)
                  }}
                >
                  {count}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

// Fonction pour attribuer une couleur à chaque sport
function getSportColor(sport) {
  const colors = {
    rugby: '#28a745',
    football: '#007bff',
    tennis: '#ffc107',
    volley: '#dc3545',
    cyclisme: '#6610f2'
  };
  return colors[sport] || '#6c757d';
}

export default AdminPage;