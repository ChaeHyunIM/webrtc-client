import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import io, { type Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:5000"); // Replace with your server URL

export const Route = createFileRoute("/room/$roomId")({
  component: Room,
});

export default function Room() {
  const { roomId } = useParams({
    strict: false,
  });
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  // const [roomId, setRoomId] = useState<string>("");

  // Initialize local media stream
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });
    if (roomId) {
      socket.emit("join-room", roomId);
    }
  }, [roomId]);

  // Initialize WebRTC peer connection
  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }, // Google's public STUN server
      ],
    });
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate, roomId);
      }
    };

    pc.ontrack = (event) => {
      console.log("event11", event);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    socket.on("ice-candidate", (candidate: RTCIceCandidate) => {
      if (pc && candidate) {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("offer", async (offer: RTCSessionDescriptionInit) => {
      if (pc && localStream) {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", answer, roomId);
      }
    });

    socket.on("answer", async (answer: RTCSessionDescriptionInit) => {
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    return () => {
      pc.close();
      socket.off("ice-candidate");
      socket.off("offer");
      socket.off("answer");
    };
  }, []);

  // Create an offer to start a call
  const createOffer = async () => {
    if (peerConnectionRef.current && localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnectionRef.current!.addTrack(track, localStream);
      });

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socket.emit("offer", offer, roomId);
    }
  };

  // Join a room
  // const joinRoom = () => {
  //   if (roomId) {
  //     socket.emit("join-room", roomId);
  //   }
  // };

  return (
    <div className="App">
      <h1>WebRTC Video Chat</h1>
      <div>
        <video ref={localVideoRef} autoPlay muted playsInline />
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>
      <div>
        {/* <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        /> */}
        {/* <button onClick={joinRoom}>Join Room</button> */}
        <button onClick={createOffer}>Start Call</button>
      </div>
    </div>
  );
}
