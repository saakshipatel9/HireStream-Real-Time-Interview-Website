import React, { useState, useEffect, useRef, useContext } from "react";
import Sidebar from "../components/Sidebar";
import EditorComponent from "../components/EditorComponent";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { initSocket } from "../socket";
import ACTIONS from "../actions/SocketActions";
import ReactDOM from "react-dom";
import axios from "axios";
import { defineThemes } from "../lib/defineThemes";
import { languageOptions } from "../constants/languageOptions";
import Modal from "react-bootstrap/Modal";
import { Peer } from "peerjs";

const javascriptDefault = `// some comment`;

function EditorPage() {
  const clearCacheData = () => {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  };

  const navigate = useNavigate();

  const location = useLocation();
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const reactNavigator = useNavigate();
  const { roomId } = useParams();
  const [clients, setClients] = useState([]);
  const [code, setCode] = useState(javascriptDefault);
  const [customInput, setCustomInput] = useState("");
  const [theme, setTheme] = useState("oceanic-next");
  const [processing, setProcessing] = useState(null);
  const [outputDetails, setOutputDetails] = useState(null);
  const [language, setLanguage] = useState(languageOptions[0]);
  const [btnDisable, setBtnDisable] = useState(false);
  const [value, setValue] = useState(code);
  const [selectedOption, setSelectedOption] = useState(languageOptions[0]);
  const [userJoinMsg, setUserJoinMsg] = useState("");
  const [isShow, setIsShow] = useState(false);
  const [fUser, setFUser] = useState("");
  const [mic, setMic] = useState(false);
  const [video, setVideo] = useState(false);
  const [peerId, setPeerId] = useState(null);
  const mediaConstraints = {
    audio: true,
    video: true,
  };

  let localStream;
  let remoteStream;
  let localVideoComponent;
  let remoteVideoComponent;
  let videoContainer;
  let renderVideo = (stream) => {
    videoContainer.srcObject = stream;
  };
  let rtcPeerConnection;

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleError(err));
      socketRef.current.on("connect_failed", (err) => handleError(err));
      function handleError(e) {
        console.log("socket error", e);
        // toast("socket connection failed try again later!");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.userName,
      });

      //admin allowing user to join
      // socketRef.current.on(ACTIONS.USER_JOIN_PERMISSION, ({ username }) => {
      //   const msg = `${username} wants to join the meeting`;
      //   setUserJoinMsg(msg);
      //   setIsShow(true);
      //   setFUser(username);
      // });

      //Listening for join event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId, isRoomCreator }) => {
          if (username !== location.state?.userName) {
            //Notify all users using toast notification
            console.log(`${username} joined the room.`);
          }
          setClients(clients);

          // sync code on first load
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            socketId,
            code: codeRef.current,
          });
        }
      );

      socketRef.current.on("start_call", async ({ username }) => {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        // addLocalTracks(rtcPeerConnection);
        // let id = `video-${username}`;
        // remoteVideoComponent = document.getElementById(id);
        let id = `video-${username}`;
        localVideoComponent = document.getElementById(id);
        addLocalTracks(rtcPeerConnection);
        rtcPeerConnection.ontrack = setRemoteStream;
        rtcPeerConnection.onicecandidate = sendIceCandidate;
        await createOffer(rtcPeerConnection);
      });

      socketRef.current.on("webrtc_offer", async (event) => {
        console.log("Socket event callback: webrtc_offer");

        rtcPeerConnection = new RTCPeerConnection(iceServers);
        addLocalTracks(rtcPeerConnection);
        rtcPeerConnection.ontrack = setRemoteStream;
        rtcPeerConnection.onicecandidate = sendIceCandidate;
        rtcPeerConnection.setRemoteDescription(
          new RTCSessionDescription(event)
        );
        await createAnswer(rtcPeerConnection);
      });

      socketRef.current.on("webrtc_answer", (event) => {
        console.log("Socket event callback: webrtc_answer");

        rtcPeerConnection.setRemoteDescription(
          new RTCSessionDescription(event)
        );
      });

      socketRef.current.on("webrtc_ice_candidate", (event) => {
        console.log("Socket event callback: webrtc_ice_candidate");

        // ICE candidate configuration.
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: event.label,
          candidate: event.candidate,
        });
        rtcPeerConnection.addIceCandidate(candidate);
      });

      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ value }) => {
        // console.log(value);
        if (value !== null) {
          // console.log("code changed");

          setValue(value);
          onChange("code", value);
        }
      });

      socketRef.current.on(ACTIONS.UPDATE_WRITER, ({ username }) => {
        var client_container = document.getElementsByClassName("clientList");
        for (let child of client_container[0].children) {
          if (child.classList.contains("writing")) {
            child.classList.remove("writing");
          }
        }
        // var client_ele = client_container[0].childNodes;
        // for(let i=0;i<client_ele.length;i++) {
        //   if(client_ele[i])
        // }
        let wUser = document.getElementById(username);
        wUser.classList.add("writing");
      });

      socketRef.current.on(ACTIONS.CODING_LANGUAGE_CHANGE, ({ sl }) => {
        setSelectedOption(sl);
        setLanguage(sl);
      });

      //Listening for disconnetion event
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        //notify user that he/she left the room
        console.log(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });

      defineThemes("oceanic-next").then((_) =>
        setTheme({ value: "oceanic-next", label: "Oceanic Next" })
      );
    };
    init();

    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
  }, []);

  useEffect(() => {
    let peer = new Peer();
    // {
    //   host: "localhost:",
    //   path: "/peerjs/myapp",
    // }
    peer.on("open", (id) => {
      console.log("My peer ID is: " + id);
    });
    peer.on("error", (error) => {
      console.error(error);
    });

    // Handle incoming voice/video connection
    peer.on("call", (call) => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          call.answer(stream); // Answer the call with an A/V stream.
          call.on("stream", renderVideo);
        })
        .catch((err) => {
          console.error("Failed to get local stream", err);
        });
    });
  }, []);

  // useEffect(() => {
  //   editorRef.current = CodeEditor;
  //   editorRef.current.on("change", (instance, changes) => {
  //     console.log("changes", changes);
  //   });
  // }, []);

  const joinUser = () => {
    socketRef.current.emit(ACTIONS.JOIN_USER, { roomId, username: fUser });
    setIsShow(false);
  };

  const onSelectChange = (sl) => {
    setLanguage(sl);
    setSelectedOption(sl);
    console.log(sl);
    socketRef.current.emit(ACTIONS.CODING_LANGUAGE_CHANGE, {
      roomId,
      sl,
    });
  };

  const onChange = (action, data) => {
    switch (action) {
      case "code": {
        setCode(data);
        break;
      }
      default: {
        console.warn("case not handled!", action, data);
      }
    }
  };

  const handleCompile = () => {
    console.log(code);
    setBtnDisable(true);
    setProcessing(true);
    const formData = {
      language_id: language.id,
      // encode source code in base64
      source_code: btoa(code),
      stdin: btoa(customInput),
    };
    console.log(formData);
    const options = {
      method: "POST",
      url: "https://judge0-ce.p.rapidapi.com/submissions",
      params: { base64_encoded: "true", fields: "*" },
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        "X-RapidAPI-Key": "cea12a80dbmsh55888b4f56ba4d7p1b0a5ejsn61028cc9bc41",
      },
      data: formData,
    };

    axios
      .request(options)
      .then(function (response) {
        console.log("res.data", response.data);
        const token = response.data.token;
        checkStatus(token);
      })
      .catch((err) => {
        let error = err.response ? err.response.data : err;
        setProcessing(false);
        console.log(error);
      });
  };

  const checkStatus = async (token) => {
    const options = {
      method: "GET",
      url: "https://judge0-ce.p.rapidapi.com/submissions" + "/" + token,
      params: { base64_encoded: "true", fields: "*" },
      headers: {
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        "X-RapidAPI-Key": "cea12a80dbmsh55888b4f56ba4d7p1b0a5ejsn61028cc9bc41",
      },
    };
    try {
      let response = await axios.request(options);
      let statusId = response.data.status?.id;

      // Processed - we have a result
      if (statusId === 1 || statusId === 2) {
        // still processing
        setTimeout(() => {
          checkStatus(token);
        }, 2000);
        return;
      } else {
        setProcessing(false);
        setOutputDetails(response.data);
        // showSuccessToast(`Compiled Successfully!`)
        console.log("response.data", response.data);
        const ioWindow = document.getElementById("io-window");
        ioWindow.scrollIntoView({ behavior: "smooth" });
        setBtnDisable(false);
        return;
      }
    } catch (err) {
      console.log("err", err);
      setProcessing(false);
      // showErrorToast();
    }
  };

  function handleThemeChange(th) {
    const theme = th;
    console.log("theme...", theme);

    if (["light", "vs-dark"].includes(theme.value)) {
      setTheme(theme);
    } else {
      defineThemes(theme.value).then((_) => setTheme(theme));
    }
  }

  const handleEditorChange = (value) => {
    setValue(value);
    onChange("code", value);
    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
      roomId,
      value,
      username: location.state?.userName,
    });
    // onChange("code", value);
  };

  async function setLocalStream(mediaConstraints) {
    let stream;
    try {
      await navigator.mediaDevices
        .getUserMedia(mediaConstraints)
        .then((stream) => {
          localVideoComponent.srcObject = stream;
          localStream = stream;
        });
    } catch (error) {
      console.error("Could not get user media", error);
    }

    console.log("set local stream", localVideoComponent);
    return stream;
  }

  const manageVideo = async () => {
    if (!video) {
      setVideo(true);
      let id = `video-${location.state?.userName}`;
      localVideoComponent = document.getElementById(id);
      // await setLocalStream(mediaConstraints);
      socketRef.current.emit("start_call", {
        roomId,
        username: location.state?.userName,
      });
    } else {
      setVideo(false);
    }
  };

  function addLocalTracks(rtcPeerConnection) {
    navigator.mediaDevices.getUserMedia(mediaConstraints).then((stream) => {
      localVideoComponent.srcObject = stream;
      stream
        .getTracks()
        .forEach((track) => rtcPeerConnection.addTrack(track, stream));
    });
  }

  function setRemoteStream(event) {
    console.log(event.streams);
    remoteVideoComponent.srcObject = event.streams[0];
    remoteStream = event.stream;
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

  async function createAnswer(rtcPeerConnection) {
    let sessionDescription;
    try {
      sessionDescription = await rtcPeerConnection.createAnswer();
      rtcPeerConnection.setLocalDescription(sessionDescription);
    } catch (error) {
      console.error(error);
    }

    socketRef.current.emit("webrtc_answer", {
      type: "webrtc_answer",
      sdp: sessionDescription,
      roomId,
    });
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

  return (
    <div className="mainWrap container-fluid mh-100 overflow-hidden">
      <div className="row">
        <div className="editor-container col-lg-9 border-3 border-end">
          <EditorComponent
            socketRef={socketRef}
            roomId={roomId}
            value={value}
            handleEditorChange={handleEditorChange}
            onSelectChange={onSelectChange}
            handleThemeChange={handleThemeChange}
            handleCompile={handleCompile}
            btnDisable={btnDisable}
            processing={processing}
            code={code}
            onChange={onChange}
            language={language}
            theme={theme}
            outputDetails={outputDetails}
            customInput={customInput}
            setCustomInput={setCustomInput}
            selectedOption={selectedOption}
          />
        </div>
        <div className="aside min-vh-100 col-lg-3">
          <Sidebar
            clients={clients}
            location={location}
            reactNavigator={reactNavigator}
            socketRef={socketRef}
            roomId={roomId}
            iceServers={iceServers}
            mic={mic}
            video={video}
            manageVideo={manageVideo}
          />
        </div>
      </div>

      <Modal show={isShow}>
        <Modal.Header>
          <h3>User join permission</h3>
        </Modal.Header>
        <Modal.Body>{userJoinMsg}</Modal.Body>
        <Modal.Footer>
          <button className="btn button mt-2" onClick={joinUser}>
            Allow
          </button>
          <button className="btn button mt-2">Dismiss</button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default EditorPage;
