import React, { useState, useEffect, useRef } from "react";
import Client from "../components/Client";
import { Navigate } from "react-router-dom";

function Sidebar({
  clients,
  location,
  reactNavigator,
  joined,
  socketRef,
  isRoomCreator,
  roomId,
  iceServers,
}) {
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

  useEffect(() => {
    const init = async function () {
      showVideoConference();
      await setLocalStream(mediaConstraints);

      socketRef.current.on("start_call", async () => {
        console.log("Socket event callback: start_call");

        if (isRoomCreator) {
          rtcPeerConnection = new RTCPeerConnection(iceServers);
          addLocalTracks(rtcPeerConnection);
          rtcPeerConnection.ontrack = setRemoteStream;
          rtcPeerConnection.onicecandidate = sendIceCandidate;
          await createOffer(rtcPeerConnection);
        }
      });

      socketRef.current.on("webrtc_offer", async (event) => {
        console.log("Socket event callback: webrtc_offer");

        if (!isRoomCreator) {
          rtcPeerConnection = new RTCPeerConnection(iceServers);
          addLocalTracks(rtcPeerConnection);
          rtcPeerConnection.ontrack = setRemoteStream;
          rtcPeerConnection.onicecandidate = sendIceCandidate;
          rtcPeerConnection.setRemoteDescription(
            new RTCSessionDescription(event)
          );
          // await createAnswer(rtcPeerConnection);
        }
      });
    };

    init();
  }, [socketRef.current]);

  const showVideoConference = () => {
    videoChatContainer.style.display = "block";
    console.log("showVideoConference");
  };

  const setLocalStream = async () => {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    } catch (error) {
      console.error("Could not get user media", error);
    }

    localStream = stream;
    console.log(stream);
    localVideoComponent.srcObject = stream;
    console.log("setLocalStream");
  };

  function addLocalTracks(rtcPeerConnection) {
    localStream.getTracks().forEach((track) => {
      rtcPeerConnection.addTrack(track, localStream);
    });
    console.log("addLocalTracks");
  }

  function setRemoteStream(event) {
    remoteVideoComponent.srcObject = event.streams[0];
    remoteStream = event.stream;
    console.log("setRemoteStream");
  }

  function sendIceCandidate(event) {
    if (event.candidate) {
      socketRef.current.emit("webrtc_ice_candidate", {
        roomId,
        label: event.candidate.sdpMLineIndex,
        candidate: event.candidate.candidate,
      });
    }
  }

  async function createOffer(rtcPeerConnection) {
    let sessionDescription;
    try {
      sessionDescription = await rtcPeerConnection.createOffer();
      rtcPeerConnection.setLocalDescription(sessionDescription);
    } catch (error) {
      console.error(error);
    }

    socketRef.current.emit("webrtc_offer", {
      type: "webrtc_offer",
      sdp: sessionDescription,
      roomId,
    });
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
