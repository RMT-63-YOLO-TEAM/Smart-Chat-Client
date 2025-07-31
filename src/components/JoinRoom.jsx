import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useChat } from "../context/ChatContext";

export default function JoinRoom() {
  const navigate = useNavigate();
  const {
    username,
    setUsername,
    room,
    setRoom,
    errors,
    setErrors,
    isConnected,
    socket,
  } = useChat();

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 2) {
      newErrors.username = "Username must be at least 2 characters";
    }
    if (!room.trim()) {
      newErrors.room = "Room name is required";
    } else if (room.length < 3) {
      newErrors.room = "Room name must be at least 3 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      if (socket && isConnected) {
        socket.emit("join", { username, room });
        socket.once("joined", () => {
          navigate("/room");
        });
      } else {
        setErrors((prev) => ({
          ...prev,
          submit: "Unable to connect to the server",
        }));
      }
    }
  };

  // Socket sudah diinisialisasi di context

  useEffect(() => {
    if (isConnected) {
      setErrors((prev) => ({
        ...prev,
        submit: "",
      }));
    }
  }, [isConnected]);
  useEffect(() => {
    if (username || room) {
      setErrors((prev) => ({
        ...prev,
        submit: "",
      }));
    }
  }, [username, room]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center p-0 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-8 flex flex-col justify-center min-h-[80vh]">
        <div className="text-center mb-8">
          <div className="text-3xl sm:text-4xl mb-4">💬</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            SmartChat
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Real-time chat with AI assistant
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.username ? "border-red-500" : "border-gray-300"
              } text-sm sm:text-base`}
              placeholder="Enter your username"
              maxLength={20}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="room"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Room Name
            </label>
            <input
              type="text"
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.room ? "border-red-500" : "border-gray-300"
              } text-sm sm:text-base`}
              placeholder="Enter room name"
              maxLength={30}
            />
            {errors.room && (
              <p className="mt-1 text-sm text-red-600">{errors.room}</p>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!isConnected}
            className={`w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              isConnected
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isConnected ? "Join Chat Room" : "Connecting..."}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2 sm:mb-3">Features:</p>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 text-xs">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Real-time Chat
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                AI Assistant
              </span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Multiple Rooms
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 text-center">
          <div
            className={`inline-flex items-center text-sm ${
              isConnected ? "text-green-600" : "text-red-600"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            {isConnected ? "Connected" : "Disconnected"}
          </div>
        </div>
      </div>
    </div>
  );
}
