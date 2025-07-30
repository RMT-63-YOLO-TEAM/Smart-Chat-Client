import { BrowserRouter, Routes, Route } from "react-router";
import ChatRoom from "./pages/ChatRoom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/room" element={<App />} /> */}
        <Route path="/join" element={<ChatRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
