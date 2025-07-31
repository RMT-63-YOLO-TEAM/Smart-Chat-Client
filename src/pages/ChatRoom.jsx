import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChatHeader from "../components/ChatHeader";
import { useNavigate } from "react-router";
const socket = io("http://localhost:3000");

export default function ChatRoom() {
  const navigate = useNavigate();
  const [socketId, setSocketId] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);

  const username = localStorage.getItem("user");
  const room = localStorage.getItem("room");

  useEffect(() => {
    // koneksi berhasil
    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    // menerima welcome message dengan socket.id dari server
    socket.on("welcome", (data) => {
      console.log(" Welcome message:", data);
      setSocketId(data.socketId);
    });

    // menerima chat message dari server
    socket.on("chat message", (data) => {
      console.log("New message:", data);
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on("/ai/loading", (isLoading) => {
      console.log("AI loading state: ", isLoading);
      setIsAiLoading(isLoading);
    });

    // handle disconnect
    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
    });
    return () => {
      // Cleanup: hapus semua event listeners saat unmount
      socket.off("connect");
      socket.off("welcome");
      socket.off("chat message");
      socket.off("disconnect");
    };
    // return () => {
    //   socket.disconnect(); // cleanup koneksi saat unmount
    // };
  }, []);

  // fungsi untuk handle perubahan input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);

    // Check if user is entering AI mode
    if (value.toLowerCase().startsWith("/ai")) {
      setIsAiMode(true);
    } else {
      setIsAiMode(false);
    }
  };

  // fungsi untuk mengirim pesan
  const sendMessage = (e) => {
    e.preventDefault();

    if (inputMessage.trim().toLowerCase().startsWith("/ai")) {
      const prompt = inputMessage.trim().substring(4);
      if (prompt) {
        socket.emit("/ask/ai", { prompt });
      } else {
        socket.emit("chat message", {
          message: inputMessage,
          user: localStorage.getItem("user"),
        });
      }

      setInputMessage("");
    }

    if (inputMessage.trim()) {
      socket.emit("chat message", inputMessage);
      setInputMessage("");
    }
  };

  const handleLeave = () => {
    socket.emit("leave", { username, room });
    socket.disconnect();
    navigate("/");
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <ChatHeader username={username} room={room} onLeave={handleLeave} />
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Chat Room</h1>
      <p className="text-sm text-gray-500 mb-6">
        Socket ID:{" "}
        <span className="font-mono">{socketId || "Connecting..."}</span>
      </p>

      {/* Display messages */}
      <div className="border rounded-lg bg-gray-50 h-80 overflow-y-auto p-4 mb-6 shadow-sm">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center mt-32">
            No messages yet.
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                msg.id === socketId ? "items-end" : "items-start"
              } mb-3`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 shadow ${
                  msg.id === socketId
                    ? "bg-green-100 text-gray-800"
                    : "bg-white text-gray-900"
                }`}
              >
                <span className="font-semibold text-gray-600">
                  {msg.id === socketId ? "You" : msg.id}
                </span>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.message}
                </ReactMarkdown>
              </div>
            </div>
          ))
        )}
        {/* AI Loading Indicator */}
        {isAiLoading && (
          <div className="flex flex-col items-start mb-3">
            <div className="max-w-[70%] rounded-lg px-4 py-3 shadow bg-blue-50 text-gray-800 border border-blue-200">
              <span className="font-semibold text-blue-600 mb-2 block">
                AI Assistant
              </span>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-blue-600 italic">
                  AI is thinking...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* AI Mode Indicator */}
      {isAiMode && (
        <div className="mb-3 flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-purple-700">
              🤖 AI Mode Active
            </span>
          </div>
          <div className="text-xs text-purple-600">
            Your message will be sent to AI assistant
          </div>
        </div>
      )}
      <form onSubmit={sendMessage} className="flex gap-3">
        <input
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          placeholder={
            isAiLoading
              ? "AI is responding..."
              : isAiMode
              ? "Ask AI anything... (e.g., /ai What is React?)"
              : "Type your message..."
          }
          disabled={isAiLoading}
          className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            isAiLoading
              ? "bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-gray-300"
              : isAiMode
              ? "border-purple-300 focus:ring-purple-400 bg-gradient-to-r from-purple-50 to-blue-50"
              : "focus:ring-green-400"
          }`}
        />
        <button
          type="submit"
          disabled={isAiLoading}
          className={`px-6 py-2 rounded-lg font-semibold transition duration-200 ${
            isAiLoading
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : isAiMode
              ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {isAiLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Loading...</span>
            </div>
          ) : isAiMode ? (
            <div className="flex items-center space-x-2">
              <span>🤖</span>
              <span>Ask AI</span>
            </div>
          ) : (
            "Send"
          )}
        </button>
      </form>
    </div>
  );
}
