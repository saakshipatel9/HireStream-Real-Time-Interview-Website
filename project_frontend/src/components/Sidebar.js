import React, { useState, useEffect, useRef } from "react";
import Client from "../components/Client";
import { Navigate } from "react-router-dom";

function Sidebar({
  clients,
  location,
  reactNavigator,
  socketRef,
  isRoomCreator,
  roomId,
  iceServers,
}) {
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
          {/* <video
            id="local-video"
            className="video-container"
            autoPlay="autoplay"
          ></video>
          <video
            id="remote-video"
            className="video-container"
            autoPlay="autoplay"
          ></video> */}
        </div>
        <div className="clientList">
          {clients.map((client) => {
            return <Client key={client.socketId} username={client.username} />;
          })}
        </div>
      </div>
      {/* <button className="btn button copyBtn">Copy Room ID</button> */}
      <button className="btn button leaveBtn" onClick={leaveRoom}>
        Leave
      </button>
    </>
  );
}

export default Sidebar;
