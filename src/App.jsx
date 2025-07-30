import { useEffect } from "react";
// import { BrowserRouter, Routes, Route } from "react-router";
import { io } from "socket.io-client";
//* Jenis nya -> Event based
//* -> Emit -> Mengirimkan request (client -> server)
//* -> On -> Menerima request

const socket = io("http://localhost:3000");

function App() {
  useEffect(() => {
    // koneksi berhasil
    socket.on("connect", () => {
      console.log(":green_circle: Connected to server:", socket.id);
    });

    // opsional: handle disconnect
    socket.on("disconnect", () => {
      console.log(":red_circle: Disconnected from server");
    });

    return () => {
      socket.disconnect(); // penting! bersihin koneksi pas komponen unmount
    };
  }, []);
  return (
    <div>
      <h1>Smart Chat Client</h1>
    </div>

    //   <BrowserRouter>
    //     <Routes>
    //       <Route path="/" element={<App />} />
    //       <Route path="/" element={<App />} />
    //     </Routes>
    //   </BrowserRouter>
  );
}

export default App;
