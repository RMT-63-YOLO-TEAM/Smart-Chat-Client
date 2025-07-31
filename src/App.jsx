import { BrowserRouter, Routes, Route } from "react-router";
import ChatRoom from "./pages/ChatRoom";
import JoinRoom from "./components/JoinRoom";
import { ChatProvider } from "./context/ChatContext";

function App() {
  return (
    <ChatProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<JoinRoom />} />
          <Route path="/room" element={<ChatRoom />} />
        </Routes>
      </BrowserRouter>
    </ChatProvider>
  );
}

export default App;
