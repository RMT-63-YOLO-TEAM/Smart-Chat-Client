import { BrowserRouter, Routes, Route } from "react-router";
import ChatRoom from "./pages/ChatRoom";
import JoinRoom from "./components/JoinRoom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JoinRoom />} />
        <Route path="/room" element={<ChatRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
