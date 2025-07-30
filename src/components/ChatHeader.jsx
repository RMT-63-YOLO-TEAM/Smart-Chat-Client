import React from "react";

export default function ChatHeader({ username, room, onLeave }) {
  return (
    <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-3 rounded-t-lg shadow">
      <div>
        <h2 className="text-lg font-semibold">Room: {room}</h2>
        <p className="text-sm">
          You are logged in as <strong>{username}</strong>
        </p>
      </div>
      <button
        onClick={onLeave}
        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium"
      >
        Leave
      </button>
    </div>
  );
}
