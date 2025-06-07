// Function to fetch chat history
const BACKEND_URL = 'https://gem-backend.onrender.com';
async function fetchChatHistory(userId) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/history/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Include the JWT token if authentication is needed
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }
  
      const chatHistory = await response.json();
      displayChatHistory(chatHistory); // Function to display chat history in the UI
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  }
  
  // Function to display chat history in the UI
  function displayChatHistory(chatHistory) {
    const chatHistoryContainer = document.getElementById('chat-history'); // Element to display chat history
    chatHistoryContainer.innerHTML = ''; // Clear existing history
  
    chatHistory.forEach(chat => {
      chat.messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>You:</strong> ${msg.userMessage} <br><strong>AI:</strong> ${msg.aiResponse}`;
        chatHistoryContainer.appendChild(messageElement);
      });
    });
  }