import React, { useState } from 'react';
import './profile.css'; // Add your custom styles here

const Profile = () => {
  // Dummy user data
  const userData = {
    username: 'JohnDoe',
    userId: 'user12345',
    email: 'johndoe@example.com',
  };

  // Dummy chat history
  const dummyChatHistory = [
    { userMessage: 'Hello!', aiResponse: 'Hi there! How can I assist you today?' },
    { userMessage: 'What’s the weather like today?', aiResponse: 'It’s sunny with a slight breeze.' },
    { userMessage: 'Can you recommend a good book?', aiResponse: 'Sure! I suggest reading "1984" by George Orwell.' },
  ];

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img 
          src="https://via.placeholder.com/100" 
          alt="User Icon" 
          className="profile-icon" 
        />
        <h2>{userData.username}</h2>
        <p>User ID: {userData.userId}</p>
        <p>Email: {userData.email}</p>
      </div>

      <div className="chat-history-section">
        <h3>Chat History</h3>
        {dummyChatHistory.length === 0 ? (
          <p>No chat history available.</p>
        ) : (
          <ul className="chat-history-list">
            {dummyChatHistory.map((chat, index) => (
              <li key={index} className="chat-history-item">
                <div className="user-message">
                  <strong>You:</strong> {chat.userMessage}
                </div>
                <div className="ai-response">
                  <strong>AI:</strong> {chat.aiResponse}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Profile;
