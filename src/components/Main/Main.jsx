

import React, { useContext, useState, useEffect, useRef } from 'react';
import './Main.css'; // Ensure this path is correct
import { assets } from '../../assets/assets'; // Ensure this path is correct
import { Context } from '../../context/Context'; // Ensure this path is correct
import { useNavigate } from 'react-router-dom';

const Main = () => {
  const {
    onSent,
    recentPrompt,
    showResult,
    loading,
    resultData,
    setInput,
    input,
    newChat, // Added from context
  } = useContext(Context);

  const endOfResultsRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [enableSpeech, setEnableSpeech] = useState(true);
  const [spokenText, setSpokenText] = useState('');
  const [speechQueue, setSpeechQueue] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [chatHistory, setChatHistory] = useState([]); // Not used with current onSent

  const [file, setFile] = useState(null); // To store the uploaded file
  const [imagePreview, setImagePreview] = useState(null); // For image preview

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
          setFile(selectedFile);
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result);
          };
          reader.readAsDataURL(selectedFile);
          console.log('Main: Selected file:', selectedFile.name);
      } else {
          alert("Please select an image file.");
          setFile(null);
          setImagePreview(null);
          event.target.value = null;
      }
    } else {
        setFile(null);
        setImagePreview(null);
    }
  };

  // handleFileUpload is not needed if sending file with prompt via onSent
  // const handleFileUpload = async () => { ... };

  const prepareTextForSpeech = (text) => {
    if (!text) return [];
    const div = document.createElement('div');
    div.innerHTML = text; // Let browser parse HTML entities and tags
    let cleanedText = (div.textContent || div.innerText || "").trim();
    
    cleanedText = cleanedText
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1')   // Remove italic markdown
      .replace(/<\/br>/gi, '. ')     // Treat <br> as sentence end
      .replace(/\n+/g, ' ');         // Replace multiple newlines with a space
    
    // Split into sentences or meaningful chunks
    const sentences = cleanedText.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [];
    return sentences.filter(s => s.trim() !== ""); // Filter out empty sentences
  };

  const speakSentence = (sentence) => {
    if (!('speechSynthesis' in window) || !sentence || sentence.trim() === "") {
      console.log("Speech synthesis not supported or no sentence to speak.");
      setIsSpeaking(false);
      setSpeechQueue(prev => prev.slice(1));
      return;
    }
    const utterance = new SpeechSynthesisUtterance(sentence.trim());
    utterance.lang = 'en-US';
    utterance.rate = 1.2; // Adjusted rate
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeechQueue((prevQueue) => prevQueue.slice(1));
    };
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
      setSpeechQueue((prevQueue) => prevQueue.slice(1));
    };
    speechSynthesis.speak(utterance);
  };
  
  const processSpeechQueue = async () => {
    if (!isSpeaking && speechQueue.length > 0) {
      speakSentence(speechQueue[0]);
    }
  };

  useEffect(() => {
    processSpeechQueue();
  }, [speechQueue, isSpeaking]);

  const speakInChunks = (newText) => {
    if (enableSpeech && newText) {
        // Always process the full newText to regenerate sentences
        const sentences = prepareTextForSpeech(newText);
        console.log("Main: Sentences for speech:", sentences);
        setSpeechQueue(sentences);
        setSpokenText(newText); // Update that this text has been "processed" for speech
    }
  };

  useEffect(() => {
    if (resultData && !loading) {
      stopSpeaking(); // Stop previous speech before starting new
      speakInChunks(resultData);
    }
  }, [resultData, loading, enableSpeech]); // Rerun if enableSpeech changes too

  const stopSpeaking = () => {
    if ('speechSynthesis' in window && speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeechQueue([]);
  };

  // Modified formatResultDataAsHTML to handle bold and line breaks from context's parsing
  const formatResultDataAsHTML = (data) => {
    // The data from context is already processed with <b> and </br>
    // We just need to ensure it's correctly set as HTML
    if (!data) return { __html: '' };
    return { __html: data.replace(/<\/br>/g, '<br />') }; // Ensure valid XHTML <br />
  };
  
  // formatResultDataAsParagraphs is not strictly needed if formatResultDataAsHTML is used with dangerouslySetInnerHTML
  // But if you want to wrap everything in <p> tags:
  // const formatResultDataAsParagraphs = (data) => {
  //   if (!data) return null;
  //   return data.split("</br>").map((line, index) => (
  //     <p key={index} dangerouslySetInnerHTML={{ __html: line }} />
  //   ));
  // };

  const handleActualSend = async () => { // Renamed from handleNewSearch to be more generic
    if (!input.trim() && !file) {
        console.log("Main: Nothing to send (no input and no file).");
        return;
    }
    console.log("Main: Calling onSent with input:", input, "and file:", file ? file.name : "No Image");
    await onSent(input, file); // Pass input and file to context's onSent

    // Clear local states after sending
    setInput('');
    setFile(null);
    setImagePreview(null);
    if (document.getElementById('file-input')) {
      document.getElementById('file-input').value = null;
    }
    setSpokenText(''); 
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && (input.trim() || file)) { // Send on Enter if input or file
      e.preventDefault();
      handleActualSend();
    }
  };

  const copyToClipboard = () => {
    if (resultData) {
      const div = document.createElement('div');
      div.innerHTML = resultData.replace(/<\/br>/g, '\n'); // Convert <br> to newlines for plain text
      const textToCopy = div.textContent || div.innerText || "";

      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch(err => {
          console.error('Main: Failed to copy: ', err);
        });
    }
  };

  useEffect(() => {
    if (endOfResultsRef.current) {
      endOfResultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [resultData]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Main: Speech Recognition API not supported.");
      return;
    }
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognitionAPI();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => setIsListening(true);
    recognitionInstance.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      setInput(prev => prev ? prev + " " + transcript : transcript);
      // Consider if you want to auto-send after speech:
      // handleActualSend(); 
    };
    recognitionInstance.onerror = (event) => console.error('Main: Speech recognition error: ', event.error);
    recognitionInstance.onend = () => setIsListening(false);
    setRecognition(recognitionInstance);

    return () => { // Cleanup
        if (recognitionInstance) {
            recognitionInstance.abort();
        }
    };
  }, []);

  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (e) {
        console.error("Main: Error starting recognition:", e);
        setIsListening(false); // Ensure state is correct if start fails
      }
    }
  };
  
  const handleRegister = () => navigate('/register');
  const handleLogin = () => {
      //setIsLoggedIn(true); // Simulate login - replace with actual logic
      navigate('/login');
  };
  const handleLogout = () => {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      navigate('/');
  }
  const handleProfileClick = () => navigate('/profile');

  const handleCardClick = (promptText) => {
    setInput(promptText);
    // Optionally auto-send when a card is clicked:
    // onSent(promptText, null); 
    // setInput(''); // Clear after setting to send
  };

  const handleMainNewChat = () => {
    newChat(); // From context
    setFile(null);
    setImagePreview(null);
    if (document.getElementById('file-input')) {
        document.getElementById('file-input').value = null;
    }
    // setInput is already cleared by context's newChat or will be by onSent
    setSpokenText('');
    stopListening();
    stopSpeaking();
  }

  return (
    <div className="main">
      <div className="nav">
        <p onClick={handleMainNewChat} style={{cursor: "pointer", fontWeight: "bold"}}>Gemini Clone</p>
        <div className="button-container">
          {isLoggedIn ? (
            <>
              <button className="nav-button" onClick={handleProfileClick}>Profile</button>
              <button className="nav-button" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="nav-button" onClick={handleRegister}>Register</button>
              <button className="nav-button" onClick={handleLogin}>Login</button>
            </>
          )}
        </div>
      </div>
      <div className="main-container">
        {!showResult ? (
          <>
            <div className="greet">
              <p><span>Hello, Dev.</span></p>
              <p>How can I help you today?</p>
            </div>
            <div className="cards">
              <div className="card" onClick={() => handleCardClick("Suggest beautiful places to see on an upcoming road trip")}>
                <p>Suggest beautiful places to see on an upcoming road trip</p>
                <img src={assets.compass_icon} alt="Compass" />
              </div>
              <div className="card" onClick={() => handleCardClick("Briefly summarize this concept: urban planning")}>
                <p>Briefly summarize this concept: urban planning</p>
                <img src={assets.bulb_icon} alt="Bulb" />
              </div>
              <div className="card" onClick={() => handleCardClick("Brainstorm team bonding activities for our work retreat")}>
                <p>Brainstorm team bonding activities for our work retreat</p>
                <img src={assets.message_icon} alt="Message" />
              </div>
              <div className="card" onClick={() => handleCardClick("Improve the readability of the following code")}>
                <p>Improve the readability of the following code</p>
                <img src={assets.code_icon} alt="Code" />
              </div>
            </div>
          </>
        ) : (
          <div className="result">
            <div className='result-title'>
              <img src={assets.user_icon} alt="User" />
              <p>{recentPrompt}</p>
            </div>
            <div className="result-data">
              <img src={assets.gemini_icon} alt="Gemini" />
              {loading
                ? <div className="loader">
                  <hr className="animated-bg" />
                  <hr className="animated-bg" />
                  <hr className="animated-bg" />
                </div>
                : (
                  <div className="output-box">
                    {/* Use dangerouslySetInnerHTML if resultData from context is already HTML-formatted */}
                    <div dangerouslySetInnerHTML={formatResultDataAsHTML(resultData)} />
                    <div ref={endOfResultsRef} />
                    <div className="result-actions">
                        <button onClick={copyToClipboard} className="action-button copy-button">
                            <img src={assets.copy_icon} alt="Copy" /> Copy
                        </button>
                        {enableSpeech && (
                        <button onClick={isSpeaking ? stopSpeaking : () => speakInChunks(resultData)} className="action-button speech-button">
                            <img src={isSpeaking ? assets.stop_icon : assets.volume_icon} alt="Speak" /> {isSpeaking ? 'Stop' : 'Speak'}
                        </button>
                        )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {copySuccess && <div className="copy-notification show">Copied to clipboard!</div>}

        <div className="main-bottom">
          <div className="search-box">
            <textarea
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              value={input}
              rows={1}
              placeholder='Enter a prompt here, or upload an image...'
            />
            <div className="search-box-icons">
              <label htmlFor="file-input" className="icon-button" title="Upload Image">
                <img src={assets.gallery_icon} alt="Upload" />
              </label>
              <input 
                type="file" 
                id="file-input" 
                style={{ display: 'none' }} 
                onChange={handleFileChange} // Changed from handleFileUpload
                accept="image/*"
              />
              {imagePreview && (
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="image-preview-icon"
                />
              )}
              <button onClick={toggleListening} className="icon-button" title={isListening ? "Stop Listening" : "Use Microphone"}>
                <img src={assets.mic_icon} alt="Mic" style={{ filter: isListening ? 'invert(50%) sepia(100%) saturate(2000%) hue-rotate(0deg) brightness(100%) contrast(100%)' : 'none' }}/>
              </button>
              {(input.trim() || file) && 
                <button onClick={handleActualSend} className="icon-button send-button" title="Send">
                    <img src={assets.send_icon} alt="Send" />
                </button>
              }
            </div>
          </div>
          <div className="speech-control" style={{ marginTop: '10px', textAlign: 'center' }}>
            <label style={{ color: 'grey', fontSize: '14px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={enableSpeech} 
                onChange={() => {
                  setEnableSpeech(!enableSpeech);
                  if (enableSpeech) { // If it was true and is now becoming false
                    stopSpeaking();
                  }
                }} 
                style={{ marginRight: '5px', verticalAlign: 'middle' }}
              />
              Enable speech output
            </label>
          </div>
          <p className="bottom-info">
            Gemini may display inaccurate info, including about people, so double-check its responses. Your privacy and Gemini Apps.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Main;


// import React, { useContext, useState, useEffect, useRef } from 'react';
// import './Main.css';
// import { assets } from '../../assets/assets';
// import { Context } from '../../context/Context';
// import { useNavigate } from 'react-router-dom';

// const Main = () => {
//   const {
//     onSent,
//     recentPrompt,
//     showResult,
//     loading,
//     resultData,
//     setInput,
//     input
//   } = useContext(Context);

//   const endOfResultsRef = useRef(null);
//   const [copySuccess, setCopySuccess] = useState(false);
//   const [recognition, setRecognition] = useState(null);
//   const [isListening, setIsListening] = useState(false);
//   const [enableSpeech, setEnableSpeech] = useState(true);
//   const [spokenText, setSpokenText] = useState('');
//   const [speechQueue, setSpeechQueue] = useState([]);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [chatHistory, setChatHistory] = useState([]); // State to maintain chat history
//   const navigate = useNavigate();

//   const handleInputChange = (e) => {
//     setInput(e.target.value); // Update input value
//   };


//   // const handleKeyPress = async (e) => {
//   //   if (e.key === 'Enter' && input.trim()) {
//   //     e.preventDefault(); // Prevent form submission

//   //     const userMessage = input.trim(); // Get the user message
//   //     try {
//   //       // Send message to backend
//   //       const response = await fetch('/chat', {
//   //         method: 'POST',
//   //         headers: {
//   //           'Content-Type': 'application/json',
//   //         },
//   //         body: JSON.stringify({
//   //           userId: 'USER_ID', // Replace with actual user ID
//   //           userMessage: userMessage,
//   //         }),
//   //       });

//   //       const data = await response.json();

//   //       if (response.ok) {
//   //         // Update chat history
//   //         setChatHistory((prev) => [...prev, { userMessage, aiResponse: data.aiResponse }]);
//   //         setInput(''); // Clear input field
//   //       } else {
//   //         console.error(data.error);
//   //       }
//   //     } catch (error) {
//   //       console.error('Error sending message:', error);
//   //     }
//   //   }
//   // };
//   useEffect(() => {
//     // Check if user is logged in
//     const token = localStorage.getItem('token');
//     if (token) {
//       setIsLoggedIn(true); // User is logged in
//     }
//   }, []);
//   const [file, setFile] = useState(null); // To store the uploaded file
//   // const navigate = useNavigate();
// // Handle file selection
// const handleFileChange = (event) => {
//   const selectedFile = event.target.files[0];
//   if (selectedFile) {
//       setFile(selectedFile);
//       console.log('Selected file:', selectedFile);
//   }
// };

// // Function to handle file upload
// const handleFileUpload = async () => {
//   if (!file) return;

//   const formData = new FormData();
//   formData.append('file', file);

//   try {
//       const response = await fetch('http://localhost:3000/upload', {
//           method: 'POST',
//           body: formData,
//       });

//       if (response.ok) {
//           console.log('File uploaded successfully.');
//       } else {
//           console.error('File upload failed.');
//       }
//   } catch (error) {
//       console.error('Error uploading file:', error);
//   }
// };

//   // Function to sanitize and prepare text for speech
//   const prepareTextForSpeech = (text) => {
//     const div = document.createElement('div');
//     div.innerHTML = text;
//     return div.textContent || div.innerText || ''; // Return the clean text
//   };

//   // Function to speak a single sentence
//   const speakSentence = (sentence) => {
//     return new Promise((resolve) => {
//       const utterance = new SpeechSynthesisUtterance(sentence);
//       utterance.lang = 'en-US';
//       utterance.rate = 1.4; // Increased rate for faster speech
//       utterance.pitch = 1; // Normal pitch

//       utterance.onend = () => {
//         resolve(); // Resolve promise when finished
//       };

//       speechSynthesis.speak(utterance);
//     });
//   };

//   // Function to process the speech queue
//   const processSpeechQueue = async () => {
//     if (speechQueue.length > 0 && !isSpeaking) {
//       setIsSpeaking(true);
//       const sentence = speechQueue[0];
//       await speakSentence(sentence);
//       setSpeechQueue((prevQueue) => prevQueue.slice(1));
//       setIsSpeaking(false);
//     }
//   };

//   // Effect to handle speech queue
//   useEffect(() => {
//     processSpeechQueue();
//   }, [speechQueue, isSpeaking]);

//   // Modified function to speak text in chunks
//   const speakInChunks = (newText) => {
//     if (enableSpeech) {
//       const unsaidText = newText.substring(spokenText.length);
//       if (unsaidText.trim() === '') return;

//       const cleanText = prepareTextForSpeech(unsaidText);
//       const sentences = cleanText.split(/(?<=[.!?])\s+/); // Split by sentence ending with punctuation

//       setSpeechQueue((prevQueue) => [...prevQueue, ...sentences]);
//       setSpokenText(newText);
//     }
//   };

//   // Effect to handle resultData changes
//   useEffect(() => {
//     if (resultData && !loading) {
//       speakInChunks(resultData);
//     }
//   }, [resultData, loading]);

//   // Function to stop speaking
//   const stopSpeaking = () => {
//     speechSynthesis.cancel();
//     setSpeechQueue([]);
//     setIsSpeaking(false);
//   };

//   const formatResultDataAsHTML = (data) => {
//     return { __html: data };
//   };

//   const formatResultDataAsParagraphs = (data) => {
//     const codeRegex = /`{3}(.*?)`{3}/gs;
//     const result = [];
//     const lines = data.split('\n');

//     lines.forEach((line, index) => {
//       const codeMatch = line.match(codeRegex);
//       if (codeMatch) {
//         const codeContent = codeMatch[1].trim();
//         result.push(
//           <p key={index} style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f8f8f8', padding: '10px', borderRadius: '5px' }}>
//             {codeContent}
//           </p>
//         );
//       } else {
//         if (line.includes('<') && line.includes('>')) {
//           result.push(
//             <div key={index} dangerouslySetInnerHTML={formatResultDataAsHTML(line)} />
//           );
//         } else if (line.trim() !== "") {
//           result.push(<p key={index}>{line}</p>);
//         }
//       }
//     });

//     return <>{result}</>;
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && input.trim()) {
//       handleNewSearch();
//     }
//   };

//   const handleNewSearch = () => {
//     if (!input.trim()) return;
//     onSent();
//     setInput('');
//     setSpokenText(''); // Reset spoken text when a new search is started
//   };

//   const copyToClipboard = () => {
//     if (resultData) {
//       navigator.clipboard.writeText(resultData)
//         .then(() => {
//           setCopySuccess(true);
//           setTimeout(() => setCopySuccess(false), 2000);
//         })
//         .catch(err => {
//           console.error('Failed to copy: ', err);
//         });
//     }
//   };

//   useEffect(() => {
//     if (endOfResultsRef.current) {
//       endOfResultsRef.current.scrollIntoView({ behavior: 'smooth' });
//     }
//   }, [resultData]);

//   // Initialize Speech Recognition
//   useEffect(() => {
//     if ('webkitSpeechRecognition' in window) {
//       const SpeechRecognition = window.webkitSpeechRecognition;
//       const recognitionInstance = new SpeechRecognition();
//       recognitionInstance.continuous = false;
//       recognitionInstance.interimResults = false;

//       recognitionInstance.onstart = () => {
//         setIsListening(true);
//         console.log('Voice recognition started. Speak into the microphone.');
//       };

//       recognitionInstance.onresult = (event) => {
//         const transcript = event.results[0][0].transcript;
//         setInput(transcript);
//         console.log('You said:', transcript);
//         handleNewSearch();
//       };

//       recognitionInstance.onerror = (event) => {
//         console.error('Error occurred in recognition: ', event.error);
//       };

//       setRecognition(recognitionInstance);
//     } else {
//       alert('Speech Recognition is not supported in this browser.');
//     }
//   }, []);

//   const toggleListening = () => {
//     if (isListening) {
//       recognition.stop();
//       setIsListening(false);
//     } else {
//       recognition.start();
//     }
//   };
  
//   const handleRegister = () => {
//     console.log("Register button clicked");
//     // Redirect to /register
//     navigate('/register'); 
//   };

//   const handleLogin = () => {
//     console.log("Login button clicked");
//     // Simulating a successful login (replace with actual login logic)
//     setIsLoggedIn(true);
//     // Redirect to /login or wherever needed
//     navigate('/login'); 
//   };

//   const handleProfileClick = () => {
//     navigate('/profile'); // Redirect to /xyz when profile icon is clicked
//   };

//   return (
//     <div className="main">
//       <div className="nav">
//         <p>Gemini</p>
//         <div className="button-container">
//           {isLoggedIn ? (
//             <img 
//               src={assets.user_icon} 
//               alt="Profile" 
//               onClick={handleProfileClick} 
//               style={{ cursor: 'pointer', width: '30px', height: '30px' }} 
//             />
//           ) : (
//             <>
//               <button className="button" onClick={handleRegister}>Register</button>
//               <button className="button" onClick={handleLogin}>Login</button>
//             </>
//           )}
//         </div>
//       </div>
//       <div className="main-container">
//         {showResult && (
//           <div className="result">
//             <div className='result-title'>
//               <img src={assets.user_icon} alt="" />
//               <p>{recentPrompt}</p>
//             </div>
//             <div className="result-data">
//               <img src={assets.gemini_icon} alt="" />
//               {loading
//                 ? <div className="loader">
//                   <hr className="animated-bg" />
//                   <hr className="animated-bg" />
//                   <hr className="animated-bg" />
//                 </div>
//                 : (
//                   <div className="output-box">
//                     {formatResultDataAsParagraphs(resultData)}
//                     <div ref={endOfResultsRef} />
//                     <button onClick={copyToClipboard} className="copy-button">Copy</button>
//                     {enableSpeech && (
//                       <button onClick={stopSpeaking} className="copy-button" style={{ marginLeft: '10px' }}>Stop Speaking</button>
//                     )}
//                   </div>
//                 )}
//             </div>
//           </div>
//         )}

//         {copySuccess && <div className="copy-notification">Copied!</div>}

//         {!showResult && (
//           <div className="greet">
//             <p><span>Hello, Dev.</span></p>
//             <p>How can I help you today?</p>
//             <div className="cards">
//               <div className="card">
//                 <p>Suggest beautiful places to see on an upcoming road trip</p>
//                 <img src={assets.compass_icon} alt="" />
//               </div>
//               <div className="card">
//                 <p>Briefly summarize this concept: urban planning</p>
//                 <img src={assets.bulb_icon} alt="" />
//               </div>
//               <div className="card">
//                 <p>Brainstorm team bonding activities for our work retreat</p>
//                 <img src={assets.message_icon} alt="" />
//               </div>
//               <div className="card">
//                 <p>Improve the readability of the following code</p>
//                 <img src={assets.code_icon} alt="" />
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="main-bottom">
//           <div className="search-box">
//             <input
//               onChange={handleInputChange}
//               value={input}
//               type="text"
//               placeholder='Enter a prompt here'
//               onKeyDown={handleKeyDown}
//             />
//             <div>
//             <label style={{ cursor: 'pointer' }}>
//             <img 
//               src={assets.gallery_icon} 
//               width={30} 
//               alt="Gallery" 
//               onClick={() => document.getElementById('file-input').click()} 
//             />
//             <input 
//               type="file" 
//               id="file-input" 
//               style={{ display: 'none' }} 
//               onChange={handleFileUpload} 
//               accept="image/*" // Accepts image files
//             />
//           </label>
//               <img 
//                 src={assets.mic_icon} 
//                 width={30} 
//                 alt="" 
//                 onClick={toggleListening}
//                 style={{ cursor: 'pointer', color: isListening ? 'red' : 'black' }}
//               />
//               {input && <img onClick={handleNewSearch} src={assets.send_icon} width={30} alt="" />}
//             </div>
//           </div>
//           <div className="speech-control" style={{ marginTop: '10px', color: 'white' }}>
//             <label>
//               <input 
//                 type="checkbox" 
//                 checked={enableSpeech} 
//                 onChange={() => {
//                   setEnableSpeech(!enableSpeech);
//                   if (!enableSpeech) {
//                     stopSpeaking();
//                   }
//                 }} 
//                 style={{ marginRight: '5px' }}
//               />
              
//               <span style={{ fontSize: '16px', marginLeft: '5px' ,color: 'grey'}}>Enable speech output</span>
//             </label>
//           </div>

//           <p className="bottom-info">
//             Gemini may display inaccurate info, including about people, so double-check its responses. Your privacy and Gemini Apps
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Main;
