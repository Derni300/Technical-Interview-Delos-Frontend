// pages/ChatPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import '../styles/ChatPage.css';

const ChatPage = () => {
  const { sport } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  // Vérification de l'authentification
  useEffect(() => {
    if (!userId || !username) {
      navigate('/login');
    }
  }, [userId, username, navigate]);

  // Défilement automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Validations pour le sport
  useEffect(() => {
    const validSports = ['rugby', 'football', 'tennis', 'volley', 'cyclisme'];
    if (!validSports.includes(sport)) {
      navigate('/');
    }
  }, [sport, navigate]);

  // Chargement d'une conversation existante si spécifiée dans l'URL
  useEffect(() => {
    const fetchExistingConversation = async () => {
      const params = new URLSearchParams(location.search);
      const convId = params.get('conversation');
      
      if (convId) {
        setLoading(true);
        try {
          console.log(`Fetching conversation with ID: ${convId}`);
          const response = await fetch(`http://localhost:8000/conversation/${convId}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Conversation data received:', data);
            
            if (data.sport === sport) {
              setConversationId(data.id);
              
              // Formater les messages correctement pour l'affichage
              const formattedMessages = data.messages.map(msg => ({
                id: msg.id,
                content: msg.content,
                is_user: msg.is_user,
                created_at: new Date(msg.created_at)
              }));
              
              // Tri des messages par date pour s'assurer qu'ils sont dans le bon ordre
              formattedMessages.sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
              
              console.log('Formatted messages:', formattedMessages);
              setMessages(formattedMessages);
            } else {
              console.warn(`Sport mismatch: URL sport is ${sport}, conversation sport is ${data.sport}`);
              // Optionnel: rediriger vers le bon sport
              // navigate(`/chat/${data.sport}?conversation=${convId}`);
            }
          } else {
            console.error('Failed to fetch conversation:', await response.text());
          }
        } catch (error) {
          console.error('Error fetching conversation:', error);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('No conversation ID in URL, starting new conversation');
      }
    };

    if (userId) {
      fetchExistingConversation();
    }
  }, [userId, sport, location.search, navigate]);

  const getSportEmoji = () => {
    switch(sport) {
      case 'rugby': return '🏉';
      case 'football': return '⚽';
      case 'tennis': return '🎾';
      case 'volley': return '🏐';
      case 'cyclisme': return '🚴';
      default: return '🏆';
    }
  };

  const getSportName = () => {
    return sport.charAt(0).toUpperCase() + sport.slice(1);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: input,
      is_user: true,
      created_at: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Créer un message temporaire pour la réponse en streaming
      const tempBotMessageId = Date.now().toString() + '-streaming';
      setMessages(prev => [...prev, {
        id: tempBotMessageId,
        content: '',
        is_user: false,
        created_at: new Date(),
        isStreaming: true
      }]);

      // Fonction pour mettre à jour le contenu du message en streaming
      const updateStreamingMessage = (newContent) => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempBotMessageId 
              ? { ...msg, content: newContent } 
              : msg
          )
        );
      };

      // Préparation des données pour la requête
      const streamRequestData = {
        user_id: userId,
        sport: sport,
        content: input
      };

      // Ajouter l'ID de conversation s'il existe
      if (conversationId) {
        streamRequestData.conversation_id = conversationId;
      }

      console.log('Sending streaming request:', streamRequestData);
      
      // Faire la requête en streaming
      const response = await fetch('http://localhost:8000/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(streamRequestData)
      });

      if (!response.ok) {
        throw new Error('Erreur de streaming');
      }

      // Préparer le reader pour le streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamContent = '';
      let headerInfo = null;

      // Lire la réponse chunk par chunk
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        console.log('Received chunk:', chunk);
        
        // La première ligne est supposée être notre info d'en-tête (header_info)
        if (!headerInfo) {
          const endOfHeader = chunk.indexOf('\n');
          if (endOfHeader !== -1) {
            const headerText = chunk.substring(0, endOfHeader);
            try {
              headerInfo = JSON.parse(headerText);
              console.log('Header info:', headerInfo);
              
              // Si nous avons un ID de conversation, l'enregistrer
              if (headerInfo.conversation_id && !conversationId) {
                setConversationId(headerInfo.conversation_id);
                
                // Mettre à jour l'URL sans recharger la page
                const newUrl = `${window.location.pathname}?conversation=${headerInfo.conversation_id}`;
                window.history.pushState({}, '', newUrl);
              }
              
              // Le reste du chunk après l'en-tête
              streamContent += chunk.substring(endOfHeader + 1);
            } catch (e) {
              console.error('Erreur de parsing JSON pour l\'en-tête:', e);
              streamContent += chunk;
            }
          } else {
            streamContent += chunk;
          }
        } else {
          streamContent += chunk;
        }
        
        // Mettre à jour le message en streaming
        updateStreamingMessage(streamContent);
      }

      console.log('Streaming complete. Final content:', streamContent);
      
      // Une fois le streaming terminé, remplacer le message temporaire par un message permanent
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempBotMessageId 
            ? { 
                id: headerInfo?.message_id || (Date.now().toString() + '-bot'),
                content: streamContent.trim(), 
                is_user: false,
                created_at: new Date(),
                isStreaming: false
              } 
            : msg
        )
      );

    } catch (error) {
      console.error('Network error:', error);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.isStreaming 
            ? {
                id: Date.now().toString() + '-error',
                content: "Désolé, une erreur de connexion s'est produite. Vérifiez votre connexion internet.",
                is_user: false,
                created_at: new Date(),
                isStreaming: false
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <Link to="/" className="back-button">◀ Retour</Link>
        <h1>{getSportEmoji()} Assistant {getSportName()}</h1>
        <div className="header-actions">
          <Link to="/history" className="history-link">Historique</Link>
          <div className="user-info">{username}</div>
        </div>
      </header>

      <main className="chat-main">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <p>Bonjour, je suis votre assistant {getSportName()}. Comment puis-je vous aider aujourd'hui ?</p>
            </div>
          ) : (
            messages.map(message => (
              <div 
                key={message.id} 
                className={`message ${message.is_user ? 'user-message' : 'bot-message'} ${message.isStreaming ? 'streaming-message' : ''}`}
              >
                <div className="message-content">{message.content}</div>
                <div className="message-time">
                  {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))
          )}
          {loading && !messages.some(msg => msg.isStreaming) && (
            <div className="message bot-message loading">
              <div className="loading-dots">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="chat-footer">
        <form onSubmit={sendMessage} className="chat-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tapez votre question ici..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Envoyer
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatPage;