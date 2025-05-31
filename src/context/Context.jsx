// Context.jsx
import { createContext, useState } from "react";

export const Context = createContext();

const ContextProvider = (props) => {
    const [prevPrompts, setPrevPrompts] = useState([]);
    const [input, setInput] = useState("");
    const [recentPrompt, setRecentPrompt] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState("");

    function delayPara(index, nextWord) {
        setTimeout(function () {
            setResultData(prev => prev + nextWord);
        }, 75 * index);
    }

    const onSent = async (promptText, imageFile) => {
        console.log("Context: onSent triggered with prompt:", promptText, "and imageFile:", imageFile ? imageFile.name : "No Image");
        setResultData("");
        setLoading(true);
        setShowResult(true);
        
        let displayPrompt = promptText || (imageFile ? "Image Analysis" : "No prompt provided");
        setRecentPrompt(displayPrompt);

        // Only add text-only prompts from user input to prevPrompts for now
        // This logic might need refinement based on how you want to handle image "prompts" in history
        if (promptText && !imageFile) {
            setPrevPrompts(prev => [...prev, promptText]);
        }

        try {
            const formData = new FormData();
            if (promptText && promptText.trim() !== "") { // Ensure promptText is not just whitespace
                formData.append('prompt', promptText.trim());
            }
            if (imageFile) {
                formData.append('image', imageFile, imageFile.name);
            }

            if (!formData.has('prompt') && !formData.has('image')) { // Check if formData is actually empty
                console.warn("Context: Attempting to send with no prompt and no image.");
                setResultData("Please enter a prompt or select an image.");
                setLoading(false);
                setShowResult(true); // Keep showing result area to display this message
                return;
            }
            
            console.log("Context: Sending FormData to backend. FormData entries:");
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            const response = await fetch('http://localhost:3000/generate_with_image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                let errorText = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.error("Context: Backend Error Response JSON:", errorData);
                    errorText = errorData.error || errorData.message || errorText;
                } catch (e) {
                    // If response is not JSON
                    errorText = await response.text();
                    console.error("Context: Backend Error Response Text:", errorText);
                }
                throw new Error(errorText);
            }

            const data = await response.json();
            console.log("<<<<< CONTEXT - Received data from backend: >>>>>", JSON.stringify(data, null, 2));

            if (!data || typeof data.text !== 'string') {
                console.error("Context: Backend response is missing 'text' field or it's not a string. Received:", data);
                throw new Error("Invalid response format from backend: 'text' field missing or not a string.");
            }

            if (data.text.trim() === "") {
                console.warn("Context: Received empty 'text' field from backend.");
                setResultData("Received an empty response from the AI."); // Handle empty text specifically
                setLoading(false);
                return;
            }

            let responseArray = data.text.split('**');
            let newArray = "";
            for (let i = 0; i < responseArray.length; i++) {
                if (i === 0 || i % 2 !== 1) {
                    newArray += responseArray[i];
                } else {
                    newArray += "<b>" + responseArray[i] + "</b>";
                }
            }
            
            // Handle cases where newArray might be empty after processing, e.g. if data.text was just "**"
            if (newArray.trim() === "" && data.text.trim() !== "") {
                // If markdown processing resulted in empty but original text was not, use original text
                console.warn("Context: Markdown processing resulted in empty string. Using original text.");
                newArray = data.text.replace(/\n/g, "</br>"); // Basic newline to <br>
            } else if (newArray.trim() === "" && data.text.trim() === "") {
                 // This case is handled by the empty text check above
            }


            responseArray = newArray.split('*').join("</br>").split(" "); // This might be too aggressive for *
                                                                        // Consider if * is only for lists or also emphasis
            
            console.log("Context: Final responseArray to be displayed word by word:", responseArray);

            if (responseArray.length === 0 || (responseArray.length === 1 && responseArray[0].trim() === "")) {
                console.warn("Context: After processing, responseArray is effectively empty. Displaying raw data.text or a message.");
                setResultData(data.text || "No textual content to display.");
            } else {
                for (let i = 0; i < responseArray.length; i++) {
                    const nextWord = responseArray[i];
                    delayPara(i, nextWord + " ");
                }
            }

        } catch (error) {
            console.error("Context: Error in onSent:", error.message);
            setResultData(`Error: ${error.message}`);
        } finally {
            setLoading(false);
            // setInput(""); // Clearing input is now handled in Main.jsx's handleSend
        }
    };

    const newChat = async () => {
        setLoading(false);
        setShowResult(false);
        setResultData("");
        setRecentPrompt("");
        setInput(""); // Also clear context's input on new chat
    };

    const contextValue = {
        prevPrompts,
        setPrevPrompts,
        onSent,
        setRecentPrompt,
        recentPrompt,
        showResult,
        loading,
        resultData,
        input,
        setInput,
        newChat
    };

    return (
        <Context.Provider value={contextValue}>
            {props.children}
        </Context.Provider>
    );
};

export default ContextProvider;



// import { createContext, useState } from "react";
// import runChat from "../config/gemini";

// export const Context = createContext();

// const ContextProvider = (props) => {

//     const [prevPrompts, setPrevPrompts] = useState([]);
//     const [input, setInput] = useState("");
//     const [recentPrompt, setRecentPrompt] = useState("");
//     const [showResult, setShowResult] = useState(false)
//     const [loading, setLoading] = useState(false)
//     const [resultData, setResultData] = useState("")


//     function delayPara(index, nextWord) {
//         setTimeout(function () {
//             setResultData(prev => prev + nextWord)
//         }, 75 * index);
//     }

//     const onSent = async (prompt) => {

//         setResultData("")
//         setLoading(true)
//         setShowResult(true)
//         let response;
//         if (prompt !== undefined) {
//             response = await runChat(prompt);
//             setRecentPrompt(prompt)
//         }
//         else {
//             setPrevPrompts(prev => [...prev, input]);
//             setRecentPrompt(input)
//             response = await runChat(input);
//         }
//         let responseArray = response.split('**');
//         let newArray = "";
//         for (let i = 0; i < responseArray.length; i++) {
//             if (i === 0 || i % 2 !== 1) {
//                 newArray += responseArray[i]
//             }
//             else {
//                 newArray += "<b>" + responseArray[i] + "</b>"
//             }
//         }
//         console.log(newArray);
//         responseArray = newArray.split('*').join("</br>").split(" ");
//         for (let i = 0; i < responseArray.length; i++) {
//             const nextWord = responseArray[i];
//             delayPara(i, nextWord + " ")
//         }
//         setLoading(false);
//         setInput("")
//     }

//     const newChat = async () => {
//         setLoading(false);
//         setShowResult(false);
//     }

//     const contextValue = {
//         prevPrompts,
//         setPrevPrompts,
//         onSent,
//         setRecentPrompt,
//         recentPrompt,
//         showResult,
//         loading,
//         resultData,
//         input,
//         setInput,
//         newChat
//     }

//     return (
//         <Context.Provider value={contextValue}>
//             {props.children}
//         </Context.Provider>
//     )
// }

// export default ContextProvider