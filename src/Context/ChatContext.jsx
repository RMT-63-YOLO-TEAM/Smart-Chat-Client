import { createContext, useContext, useState, useRef } from "react";
import { io } from "socket.io-client";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  // Ambil dari localStorage jika ada
  const [username, setUsername] = useState(
    () => localStorage.getItem("username") || ""
  );
  const [room, setRoom] = useState(() => localStorage.getItem("room") || "");
  const [errors, setErrors] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  // Sync ke localStorage setiap kali username/room berubah
  function updateUsername(name) {
    setUsername(name);
    localStorage.setItem("username", name);
  }
  function updateRoom(rm) {
    setRoom(rm);
    localStorage.setItem("room", rm);
  }

  // Inisialisasi socket hanya sekali
  if (!socketRef.current) {
    socketRef.current = io("https://api.gnaleroon.com", {
      transports: ["websocket"],
      secure: true,
    });
    socketRef.current.on("connect", () => setIsConnected(true));
    socketRef.current.on("disconnect", () => setIsConnected(false));
    socketRef.current.on("error", (data) =>
      setErrors((prev) => ({ ...prev, submit: data.message }))
    );
    socketRef.current.on("/chats/messages/fetch", (msgs) => setMessages(msgs));
  }

  return (
    <ChatContext.Provider
      value={{
        username,
        setUsername: updateUsername,
        room,
        setRoom: updateRoom,
        errors,
        setErrors,
        isConnected,
        socket: socketRef.current,
        messages,
        setMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
