import React, { useState, useEffect, useRef } from "react";
import Client from "../components/Client";
import { Navigate } from "react-router-dom";

function Sidebar({ clients, location, reactNavigator, joined }) {
  const videoChatContainer = document.getElementById("video-chat-container");
  const localVideoComponent = document.getElementById("local-video");
  const remoteVideoComponent = document.getElementById("remote-video");
  const mediaConstraints = {
    audio: true,
    video: true,
  };
  let localStream;
  let remoteStream;
  let rtcPeerConnection; // Connection between the local device and the remote peer.
  let mic_switch = true;
  let click = 1;

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ],
  };

  const showVideoConference = () => {
    videoChatContainer.style = "display: block";
  };

  const setLocalStream = async () => {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      console.log("Hello");
    } catch (error) {
      console.error("Could not get user media", error);
    }

    localStream = stream;
    localVideoComponent.srcObject = stream;
  };

  const init = async function () {
    showVideoConference();
    await setLocalStream(mediaConstraints);
  };

  if (joined) {
    init();
  }

  if (!location.state) {
    return <Navigate to />;
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  return (
    <>
      <div className="asideInner">
        <div className="video_options m-2">
          <button className="btn button">
            <i className="bi bi-mic-fill"></i>
          </button>
          <button className="btn button ms-2">
            <i className="bi bi-camera-video-fill"></i>
          </button>
        </div>
        <p style={{ fontWeight: "bold" }}>Connected</p>
        <div id="video-chat-container" className="video-position">
          <video
            id="local-video"
            className="video-container"
            autoPlay="autoplay"
            muted
          ></video>
          <video
            id="remote-video"
            className="video-container"
            autoPlay="autoplay"
          ></video>
        </div>
        {/* <div className="clientList">
          {clients.map((client) => {
            return <Client key={client.socketId} username={client.username} />;
          })}
        </div> */}
      </div>
      {/* <button className="btn button copyBtn">Copy Room ID</button> */}
      <button className="btn button leaveBtn" onClick={leaveRoom}>
        Leave
      </button>
    </>
  );
}

export default Sidebar;
