import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import EditorComponent from "../components/EditorComponent";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { initSocket } from "../socket";
import ACTIONS from "../actions/SocketActions";
import ReactDOM from "react-dom";
import axios from "axios";
import { defineThemes } from "../lib/defineThemes";
import { languageOptions } from "../constants/languageOptions";

const javascriptDefault = `// some comment`;

function EditorPage() {
  const location = useLocation();
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const reactNavigator = useNavigate();
  const { roomId } = useParams();
  const [clients, setClients] = useState([]);
  const [joined, setJoined] = useState(false);
  let isRoomCreator;
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
    console.log("Hello");

    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleError(err));
      socketRef.current.on("connect_failed", (err) => handleError(err));
      function handleError(e) {
        console.log("socket error", e);
        //toast("socket connection failed try again later!");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.userName,
      });

      //Listening for join event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.userName) {
            //Notify all users using toast notification
            console.log(`${username} joined the room.`);
          }
          setClients(clients);
          setJoined(true);
          isRoomCreator = true;
          socketRef.current.emit("start_call", roomId);

          //sync code on first load
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            socketId,
            code: codeRef.current,
          });
        }
      );

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
        console.log("sl", sl);
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
    };
    init();

    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
  }, [location.state?.userName, reactNavigator, roomId]);

  //EditorComponent---------------------
  const ref = useRef(null);
  // const editorRef = useRef(null);

  const [code, setCode] = useState(javascriptDefault);
  const [customInput, setCustomInput] = useState("");
  const [theme, setTheme] = useState("cobalt");
  const [processing, setProcessing] = useState(null);
  const [outputDetails, setOutputDetails] = useState(null);
  const [language, setLanguage] = useState(languageOptions[0]);
  const [btnDisable, setBtnDisable] = useState(false);

  // useEffect(() => {
  //   editorRef.current = CodeEditor;
  //   editorRef.current.on("change", (instance, changes) => {
  //     console.log("changes", changes);
  //   });
  // }, []);

  const onSelectChange = (sl) => {
    setLanguage(sl);
    socketRef.current.emit(ACTIONS.CODING_LANGUAGE_CHANGE, { roomId, sl });
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

  useEffect(() => {
    defineThemes("oceanic-next").then((_) =>
      setTheme({ value: "oceanic-next", label: "Oceanic Next" })
    );
  }, []);

  //Code Editor component of EditorComponent
  const [value, setValue] = useState(code);

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
          />
        </div>
        <div className="aside min-vh-100 col-lg-3">
          <Sidebar
            clients={clients}
            location={location}
            reactNavigator={reactNavigator}
            joined={joined}
            socketRef={socketRef}
            isRoomCreator={isRoomCreator}
            roomId={roomId}
            iceServers={iceServers}
          />
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
