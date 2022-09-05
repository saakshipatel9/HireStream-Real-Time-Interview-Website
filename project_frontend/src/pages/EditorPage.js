import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import EditorComponent from "../components/EditorComponent";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { initSocket } from "../socket";
import ACTIONS from "../actions/SocketActions";
import ReactDOM from "react-dom";

function EditorPage() {
  const location = useLocation();
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const reactNavigator = useNavigate();
  const { roomId } = useParams();
  const [clients, setClients] = useState([]);
  const [joined, setJoined] = useState(false);

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
          socketRef.current.emit("start_call", roomId);

          //sync code on first load
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            socketId,
            code: codeRef.current,
          });
        }
      );

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
    };
  }, [location.state?.userName, reactNavigator, roomId]);

  return (
    <div className="mainWrap container-fluid mh-100 overflow-hidden">
      <div className="row">
        <div className="editor-container col-lg-9 border-3 border-end">
          <EditorComponent
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              codeRef.current = code;
              console.log("code change", code);
            }}
          />
        </div>
        <div className="aside min-vh-100 col-lg-3">
          <Sidebar
            clients={clients}
            location={location}
            reactNavigator={reactNavigator}
            joined={joined}
          />
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
