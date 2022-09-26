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
import { Tabs, Tab } from "react-bootstrap";
import Board from "../components/Board";

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

  const mediaConstraints = {
    audio: true,
    video: true,
  };

  let localStream = new MediaStream();
  let remoteStream;
  let localVideoComponent;
  let remoteVideoComponent;
  let videoContainer;
  let renderVideo = (stream) => {
    videoContainer.srcObject = stream;
  };
  let rtcPeerConnection;
  let isInitiator = location.state?.isInitiator;
  let id = `video-${location.state?.userName}`;
  localVideoComponent = document.getElementById(id);

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
        async ({ clients, username, socketId, isRoomCreator }) => {
          if (username !== location.state?.userName) {
            //Notify all users using toast notification
            console.log(`${username} joined the room.`);
          }
          setClients(clients);
          // setVideo(true);
          await setLocalStream(mediaConstraints);
          socketRef.current.emit("start_call", {
            roomId,
            username: location.state?.userName,
          });

          // sync code on first load
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            socketId,
            code: codeRef.current,
          });
        }
      );

      socketRef.current.on("start_call", async ({ username, uLocalStream }) => {
        let id = `video-${username}`;
        remoteVideoComponent = document.getElementById(id);
        console.log(remoteVideoComponent);
        if (isInitiator) {
          rtcPeerConnection = new RTCPeerConnection(iceServers);
          rtcPeerConnection.onicecandidate = sendIceCandidate;
          addLocalTracks(rtcPeerConnection);
          rtcPeerConnection.ontrack = setRemoteStream;
          await createOffer(rtcPeerConnection);
        }
      });

      socketRef.current.on("webrtc_offer", async (event) => {
        if (!isInitiator) {
          rtcPeerConnection = new RTCPeerConnection(iceServers);
          rtcPeerConnection.onicecandidate = sendIceCandidate;
          addLocalTracks(rtcPeerConnection);
          rtcPeerConnection.ontrack = setRemoteStream;
          rtcPeerConnection.setRemoteDescription(
            new RTCSessionDescription(event)
          );
          await createAnswer(rtcPeerConnection);
        }
      });

      socketRef.current.on("webrtc_answer", (event) => {
        rtcPeerConnection.setRemoteDescription(
          new RTCSessionDescription(event)
        );
      });

      socketRef.current.on("webrtc_ice_candidate", (event) => {
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

      socketRef.current.on("drawing", ({ data }) => {
        onDrawingEvent(data);
      });

      socketRef.current.on("undoRedo", ({ trackObj }) => {
        activateUndoRedo(trackObj);
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
    setBtnDisable(true);
    setProcessing(true);
    const formData = {
      language_id: language.id,
      // encode source code in base64
      source_code: btoa(code),
      stdin: btoa(customInput),
    };
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
    try {
      await navigator.mediaDevices
        .getUserMedia(mediaConstraints)
        .then((stream) => {
          let id = `video-${location.state?.userName}`;
          localVideoComponent = document.getElementById(id);
          localVideoComponent.srcObject = stream;
          localStream = stream;
        });
    } catch (error) {
      console.error("Could not get user media", error);
    }
  }

  const manageVideo = async () => {
    if (!video) {
      setVideo(true);
      let id = `video-${location.state?.userName}`;
      localVideoComponent = document.getElementById(id);
      localVideoComponent.style.visibility = "visible";
      await setLocalStream(mediaConstraints);
      // addLocalTracks(rtcPeerConnection);
      // setVideo(true);
      await setLocalStream(mediaConstraints);
      // socketRef.current.emit("start_call", {
      //   roomId,
      //   username: location.state?.userName,
      // });
    } else {
      setVideo(false);
      let id = `video-${location.state?.userName}`;
      localVideoComponent = document.getElementById(id);
      navigator.mediaDevices.getUserMedia(mediaConstraints).then((stream) => {
        localVideoComponent.srcObject = stream;
        stream.getTracks().forEach((track) => track.stop());
      });
    }
  };

  function addLocalTracks(rtcPeerConnection) {
    localStream
      .getTracks()
      .forEach((track) => rtcPeerConnection.addTrack(track, localStream));
  }

  function setRemoteStream(event) {
    remoteVideoComponent.srcObject = event.streams[0];
    remoteStream = event.stream;
    console.log(remoteVideoComponent.srcObject);
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

  //WhiteBoard
  var canvas;
  var colors;
  var context;
  var current = {
    color: "black",
  };
  var drawing = false;
  var eraser;
  var undo;
  var redo;

  let undoRedoTracker = [];
  let track = 0;
  useEffect(() => {
    canvas = document.getElementsByClassName("whiteboard")[0];
    colors = document.getElementsByClassName("color");
    context = canvas.getContext("2d");
    eraser = document.getElementsByClassName("eraser");
    undo = document.getElementsByClassName("undo");
    redo = document.getElementsByClassName("redo");

    canvas.addEventListener("mousedown", onMouseDown, false);
    canvas.addEventListener("mouseup", onMouseUp, false);
    canvas.addEventListener("mouseout", onMouseUp, false);
    canvas.addEventListener("mousemove", throttle(onMouseMove, 10), false);

    //Touch support for mobile devices
    canvas.addEventListener("touchstart", onMouseDown, false);
    canvas.addEventListener("touchend", onMouseUp, false);
    canvas.addEventListener("touchcancel", onMouseUp, false);
    canvas.addEventListener("touchmove", throttle(onMouseMove, 10), false);

    for (var i = 0; i < colors.length; i++) {
      colors[i].addEventListener("click", onColorUpdate, false);
    }

    eraser[0].addEventListener("click", activeEraser, false);
    undo[0].addEventListener("click", activeUndo, false);
    redo[0].addEventListener("click", activeRedo, false);

    window.addEventListener("resize", onResize, false);
    onResize();
  }, []);

  function drawLine(x0, y0, x1, y1, color, emit) {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    if (color === "white") {
      context.lineWidth = 10;
    } else {
      context.lineWidth = 5;
    }
    context.stroke();
    context.closePath();

    if (!emit) {
      return;
    }
    var w = canvas.width;
    var h = canvas.height;
    socketRef.current.emit("drawing", {
      data: {
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: color,
      },
    });
  }

  function onMouseDown(e) {
    drawing = true;
    current.x = e.clientX || e.touches[0].clientX;
    current.y = e.clientY || e.touches[0].clientY;
  }

  function onMouseUp(e) {
    if (!drawing) {
      return;
    }
    drawing = false;
    let url = canvas.toDataURL();
    undoRedoTracker.push(url);
    track = undoRedoTracker.length - 1;
    drawLine(
      current.x,
      current.y,
      e.clientX || e.changedTouches[0].clientX,
      e.clientY || e.changedTouches[0].clientY,
      current.color,
      true
    );
  }

  function onMouseMove(e) {
    if (!drawing) {
      return;
    }
    drawLine(
      current.x,
      current.y,
      e.clientX || e.touches[0].clientX,
      e.clientY || e.touches[0].clientY,
      current.color,
      true
    );
    current.x = e.clientX || e.touches[0].clientX;
    current.y = e.clientY || e.touches[0].clientY;
  }

  function onColorUpdate(e) {
    current.color = e.target.className.split(" ")[1];
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function () {
      var time = new Date().getTime();

      if (time - previousCall >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  // make the canvas fill its parent
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function onDrawingEvent(data) {
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }

  function activeEraser(e) {
    canvas.style.cursor = "pointer";
    current.color = "white";
  }

  function activeUndo(e) {
    if (track > -1) {
      track = track - 1;
    }

    let trackObj = {
      trackValue: track,
      undoRedoTracker: undoRedoTracker,
    };

    socketRef.current.emit("undoRedo", { roomId, trackObj });
  }

  function activeRedo(e) {
    if (track < undoRedoTracker.length - 1) {
      track++;
    }

    let trackObj = {
      trackValue: track,
      undoRedoTracker: undoRedoTracker,
    };

    socketRef.current.emit("undoRedo", { roomId, trackObj });
  }

  function activateUndoRedo(trackObj) {
    track = trackObj.trackValue;
    undoRedoTracker = trackObj.undoRedoTracker;
    let url = undoRedoTracker[track];

    let img = new Image();
    context.clearRect(0, 0, canvas.width, canvas.height);
    img.src = url;
    img.onload = (e) => {
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }

  return (
    <div className="mainWrap container-fluid mh-100 overflow-hidden">
      <div className="row">
        <div className="editor-container col-lg-9 border-3 border-end">
          <Tabs
            justify
            variant="pills"
            defaultActiveKey="tab-1"
            className="tab-container mb-1 p-0 border-bottom"
          >
            <Tab eventKey="tab-1" title="Code Editor">
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
            </Tab>
            <Tab eventKey="tab-2" title="WhiteBoard">
              <div>
                <Board
                  activeEraser={activeEraser}
                  activeUndo={activeUndo}
                  activeRedo={activeRedo}
                />
              </div>
            </Tab>
          </Tabs>
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
            localStream={localStream}
            mediaConstraints={mediaConstraints}
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
