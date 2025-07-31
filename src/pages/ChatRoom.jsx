import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "../context/ChatContext";

export default function ChatRoom() {
  // Deklarasi hook harus di bagian paling atas
  const { username, room, socket, messages, setMessages } = useChat();
  const [socketId, setSocketId] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const navigate = useNavigate();
  // Kirim event join ke server jika username dan room sudah ada
  useEffect(() => {
    if (!socket) return;
    if (socket.connected && username && room) {
      socket.emit("join", { username, room });
    }
  }, [socket, username, room]);

  useEffect(() => {
    if (!socket) return;
    const handleConnect = () => setSocketId(socket.id);
    const handleWelcome = (data) => setSocketId(data.socketId);
    const handleChatMessage = (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);

      // Hide AI loading if this is an AI response
      if (data.user === "AI" && isAiLoading) {
        setIsAiLoading(false);
      }
    };
    const handleFetchMessages = (msgs) => setMessages(msgs);
    const handleDisconnect = () => setSocketId("");
    const handleOnlineUsers = (users) => setOnlineUsers(users);
    const handleUserJoined = ({ username }) => {
      setOnlineUsers((prev) =>
        prev.includes(username) ? prev : [...prev, username]
      );
    };
    const handleUserLeft = ({ username }) => {
      setOnlineUsers((prev) => prev.filter((u) => u !== username));
    };
    const handleAiLoading = (loading) => setIsAiLoading(loading);

    if (socket.connected && socket.id) {
      setSocketId(socket.id);
    }
    socket.on("connect", handleConnect);
    socket.on("welcome", handleWelcome);
    socket.on("chat message", handleChatMessage);
    socket.on("/chats/messages/fetch", handleFetchMessages);
    socket.on("disconnect", handleDisconnect);
    socket.on("online-users", handleOnlineUsers);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("/ai/loading", handleAiLoading);

    // Typing indicator
    socket.on("typing", ({ username: typingName }) => {
      if (typingName !== username) setTypingUser(typingName);
    });
    socket.on("stop-typing", ({ username: typingName }) => {
      if (typingName !== username) setTypingUser("");
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("welcome", handleWelcome);
      socket.off("chat message", handleChatMessage);
      socket.off("/chats/messages/fetch", handleFetchMessages);
      socket.off("disconnect", handleDisconnect);
      socket.off("online-users", handleOnlineUsers);
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("/ai/loading", handleAiLoading);
      socket.off("typing");
      socket.off("stop-typing");
    };
  }, [socket, setMessages, isAiLoading, username]);

  // Enhanced input change handler for AI mode
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);
    if (socket && value) {
      socket.emit("typing", { username, room });
    }
    if (value === "" && socket) {
      socket.emit("stop-typing", { username, room });
    }
    if (value.toLowerCase().startsWith("/ai")) {
      setIsAiMode(true);
    } else {
      setIsAiMode(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!socket) return;
    const trimmed = inputMessage.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase().startsWith("/ai")) {
      const prompt = trimmed.replace(/^\/ai\s*/i, "");
      if (prompt) {
        // Kirim pesan AI command sebagai chat message biasa agar terlihat semua orang
        socket.emit("chat message", {
          message: inputMessage,
          user: username,
          room,
        });

        // Kemudian kirim request ke AI
        setIsAiLoading(true);
        socket.emit("/ask/ai", { prompt, user: username, room });
      } else {
        // Jika hanya "/ai" tanpa pertanyaan, kirim sebagai pesan biasa
        socket.emit("chat message", {
          message: inputMessage,
          user: username,
          room,
        });
      }
    } else {
      // Pesan biasa
      socket.emit("chat message", {
        message: inputMessage,
        user: username,
        room,
      });
    }

    setInputMessage("");
    setIsAiMode(false);
    if (socket) {
      socket.emit("stop-typing", { username, room });
    }
  };

  const handleLeave = () => {
    if (socket) {
      socket.emit("leave", { username, room });
    }
    setOnlineUsers([]);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 py-4 border-b bg-white shadow-sm w-full">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 drop-shadow-sm tracking-tight font-sans">
            Smart <span className="text-purple-600">Chat</span>
          </span>
          <span className="text-base text-gray-600 font-medium">
            Selamat datang,{" "}
            <span className="font-bold text-blue-600">{username}</span>!
          </span>
          <span className="text-xs text-green-600 flex items-center gap-1 animate-pulse">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
            Terhubung
          </span>
        </div>
        <button
          onClick={handleLeave}
          className="mt-3 sm:mt-0 text-gray-600 hover:text-white hover:bg-red-500 text-base font-semibold px-4 sm:px-5 py-2 rounded-xl shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          Leave Room
        </button>
      </header>
      {/* Main Layout */}
      <div className="flex flex-col-reverse sm:flex-row flex-1 w-full">
        {/* Chat Area */}
        <main className="flex-1 flex flex-col items-center justify-center px-2 sm:px-8 py-4 sm:py-6 w-full">
          <div className="w-full max-w-3xl flex flex-col flex-1">
            {/* Chat Messages */}
            <div
              className="border rounded-lg bg-gray-50 p-4 sm:p-8 mb-4 shadow-sm flex flex-col justify-center"
              style={{ height: "calc(100vh - 220px)" }}
            >
              <div className="flex-1 overflow-y-auto max-h-full">
                {/* Typing Indicator */}
                {typingUser && (
                  <div className="flex items-center gap-2 mb-2 animate-fade-in">
                    <span className="text-xs text-gray-500 font-semibold">
                      {typingUser} sedang mengetik...
                    </span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  </div>
                )}
                {isAiLoading && (
                  <div className="flex flex-col items-start mb-3 animate-fade-in">
                    <div className="max-w-[90%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-lg bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 border border-blue-200">
                      <span className="font-bold text-blue-600 mb-2 block text-lg font-mono">
                        🤖 AI Assistant
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
                          AI sedang berpikir...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-fade-in">
                    <div className="text-xl sm:text-2xl mb-2 font-bold text-blue-400">
                      Belum ada pesan. Mulai percakapan!
                    </div>
                    <div className="text-sm text-purple-500">
                      Tip: Ketik{" "}
                      <span className="font-mono bg-gray-100 px-1 rounded">
                        /ai
                      </span>{" "}
                      diikuti pertanyaan untuk bertanya ke AI assistant
                    </div>
                  </div>
                ) : (
                  messages
                    .filter((msg) => msg.room === room)
                    .map((msg, index) => (
                      <div
                        key={index}
                        className={`flex flex-col ${
                          msg.user === username ? "items-end" : "items-start"
                        } mb-3 animate-slide-up`}
                      >
                        <div
                          className={`max-w-[90%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-lg border transition-all duration-300 font-sans ${
                            msg.user === username
                              ? "bg-green-100 border-green-300 text-green-800 hover:shadow-xl"
                              : msg.user === "AI"
                              ? "bg-blue-100 border-blue-300 text-blue-700 hover:shadow-xl font-mono"
                              : "bg-white border-gray-200 text-gray-900 hover:shadow-xl"
                          }`}
                        >
                          <span
                            className={`font-bold text-xs mb-1 block ${
                              msg.user === username
                                ? "text-green-700"
                                : msg.user === "AI"
                                ? "text-blue-600"
                                : "text-gray-600"
                            }`}
                          >
                            {msg.user === username ? "You" : msg.user}
                          </span>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.message}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
            {/* AI Mode Indicator */}
            {isAiMode && (
              <div className="mb-3 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 px-3 py-2 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-lg">
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
            {/* Input Form */}
            <form
              onSubmit={sendMessage}
              className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-auto w-full"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                placeholder={
                  isAiLoading
                    ? "AI sedang merespon..."
                    : isAiMode
                    ? "Tanyakan apapun ke AI... (misal: /ai Apa itu React?)"
                    : "Ketik pesan"
                }
                disabled={isAiLoading}
                className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 border rounded-2xl focus:outline-none focus:ring-2 text-base shadow transition-all duration-200 font-sans ${
                  isAiLoading
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-gray-300"
                    : isAiMode
                    ? "border-purple-300 focus:ring-purple-400 bg-gradient-to-r from-purple-50 to-blue-50"
                    : "focus:ring-green-400 hover:border-blue-300 hover:shadow-lg"
                }`}
              />
              <button
                type="submit"
                disabled={isAiLoading}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-bold transition duration-200 text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 font-sans ${
                  isAiLoading
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : isAiMode
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-xl"
                    : "bg-green-500 text-white hover:bg-green-600 hover:shadow-xl"
                }`}
              >
                {isAiLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : isAiMode ? (
                  <div className="flex items-center space-x-2 animate-bounce">
                    <span>🤖</span>
                    <span>Tanya AI</span>
                  </div>
                ) : (
                  "Kirim"
                )}
              </button>
            </form>
          </div>
        </main>
        {/* Sidebar */}
        <aside className="w-full sm:w-[340px] border-t sm:border-t-0 sm:border-l bg-gray-50 px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-4 sm:gap-6">
          <div>
            <div className="text-lg font-bold mb-2 text-blue-700 font-sans">
              Room Users ({onlineUsers.length})
            </div>
            <ul className="flex flex-col gap-2">
              {onlineUsers.length === 0 ? (
                <li className="text-gray-400 px-3 py-2 rounded-2xl border border-gray-200 bg-white transition-all duration-200">
                  No users online
                </li>
              ) : (
                onlineUsers.map((user, idx) => (
                  <li
                    key={idx}
                    className={`px-3 py-2 rounded-2xl border shadow-sm text-base flex items-center gap-2 transition-all duration-200 cursor-pointer hover:scale-[1.03] hover:shadow-lg font-sans ${
                      user === username
                        ? "bg-blue-100 border-blue-300 text-blue-700 font-bold"
                        : user === "AI"
                        ? "bg-purple-100 border-purple-300 text-purple-700 font-bold font-mono"
                        : "bg-white border-gray-200 text-gray-700"
                    }`}
                  >
                    {user === username ? (
                      <>
                        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-1 animate-pulse"></span>
                        {user}{" "}
                        <span className="text-xs font-normal">(You)</span>
                      </>
                    ) : user === "AI" ? (
                      <>
                        <span className="inline-block w-2 h-2 bg-purple-400 rounded-full mr-1 animate-bounce"></span>
                        🤖 <span className="font-bold">AI Assistant</span>
                      </>
                    ) : (
                      user
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow border border-gray-200">
            <div className="font-bold text-purple-700 mb-2 flex items-center gap-2 text-lg font-mono animate-bounce">
              <span>🤖</span> AI Assistant
            </div>
            <div className="text-xs text-gray-600 mb-2 font-sans">
              Ketik{" "}
              <span className="font-mono bg-gray-100 px-1 rounded">/ai</span> di
              chat untuk bertanya ke AI Assistant.
            </div>
            <div className="text-xs text-gray-600 font-sans">
              Contoh:{" "}
              <span className="font-mono bg-gray-100 px-1 rounded">
                /ai Apa itu React?
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow border border-gray-200">
            <div className="font-bold text-gray-700 mb-2 text-base font-sans">
              Features:
            </div>
            <ul className="text-xs text-gray-600 list-disc ml-4 font-sans">
              <li>Real-time messaging</li>
              <li>AI assistant integration</li>
              <li>Typing indicators</li>
              <li>Multiple chat rooms</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
