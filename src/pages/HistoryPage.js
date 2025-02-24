// pages/HistoryPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/HistoryPage.css';

const HistoryPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  // Redirection si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!userId || !username) {
      navigate('/login');
    }
  }, [userId, username, navigate]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:8000/history/${userId}`);
        if (!response.ok) {
          throw new Error('Échec du chargement de l\'historique');
        }
        const data = await response.json();
        
        // Organiser les conversations par sport
        const sportsSorted = ['rugby', 'football', 'tennis', 'volley', 'cyclisme'];
        const sortedData = [...data].sort((a, b) => {
          // D'abord trier par sport selon l'ordre défini
          const sportIndexA = sportsSorted.indexOf(a.sport);
          const sportIndexB = sportsSorted.indexOf(b.sport);
          if (sportIndexA !== sportIndexB) {
            return sportIndexA - sportIndexB;
          }
          // Ensuite par date (du plus récent au plus ancien)
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
        setConversations(sortedData);
        setLoading(false);
      } catch (error) {
        console.error('Erreur:', error);
        setError('Impossible de charger l\'historique des conversations');
        setLoading(false);
      }
    };

    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  const getSportEmoji = (sport) => {
    switch(sport) {
      case 'rugby': return '🏉';
      case 'football': return '⚽';
      case 'tennis': return '🎾';
      case 'volley': return '🏐';
      case 'cyclisme': return '🚴';
      default: return '🏆';
    }
  };

  const getSportName = (sport) => {
    return sport.charAt(0).toUpperCase() + sport.slice(1);
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Regrouper les conversations par sport
  const conversationsByCategory = {};
  conversations.forEach(conv => {
    if (!conversationsByCategory[conv.sport]) {
      conversationsByCategory[conv.sport] = [];
    }
    conversationsByCategory[conv.sport].push(conv);
  });

  if (loading) {
    return (
      <div className="history-container">
        <header>
          <h1>Historique des conversations</h1>
          <Link to="/" className="back-button">Retour à l'accueil</Link>
        </header>
        <div className="loading-indicator">Chargement de l'historique...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <header>
          <h1>Historique des conversations</h1>
          <Link to="/" className="back-button">Retour à l'accueil</Link>
        </header>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <header>
        <h1>Historique des conversations</h1>
        <Link to="/" className="back-button">Retour à l'accueil</Link>
      </header>

      <main className="history-content">
        {Object.keys(conversationsByCategory).length === 0 ? (
          <div className="no-history-message">
            <p>Vous n'avez pas encore de conversations.</p>
            <Link to="/" className="start-chat-button">Commencer une conversation</Link>
          </div>
        ) : (
          Object.entries(conversationsByCategory).map(([sport, convs]) => (
            <div key={sport} className="sport-section">
              <h2>
                <span className="sport-emoji">{getSportEmoji(sport)}</span>
                {getSportName(sport)}
              </h2>
              <div className="conversation-list">
                {convs.map(conv => {
                  // Obtenir le premier message de l'utilisateur (question) et la réponse du bot
                  const userMessage = conv.messages.find(msg => msg.is_user);
                  const botResponse = conv.messages.find(msg => !msg.is_user);
                  
                  return (
                    <div key={conv.id} className="conversation-card">
                      <div className="conversation-header">
                        <span className="conversation-date">{formatDate(conv.created_at)}</span>
                        <Link 
                          to={`/chat/${sport}?conversation=${conv.id}`} 
                          className="continue-button"
                        >
                          Continuer
                        </Link>
                      </div>
                      <div className="conversation-preview">
                        {userMessage && (
                          <div className="message-preview user-preview">
                            <strong>Vous:</strong> {userMessage.content}
                          </div>
                        )}
                        {botResponse && (
                          <div className="message-preview bot-preview">
                            <strong>Assistant:</strong> {botResponse.content}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default HistoryPage;