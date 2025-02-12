import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();
  const joinRoom = () => {
    if (!roomId) return alert("Enter a room ID!");
    navigate({
      to: "/room/$roomId",
      params: { roomId },
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold">WebRTC Video Call</h2>
      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="mb-2 p-2 border rounded"
      />
      <button
        onClick={joinRoom}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Join Room
      </button>
    </div>
  );
}
