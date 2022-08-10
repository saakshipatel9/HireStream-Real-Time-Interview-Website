import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import EditorComponent from "../components/EditorComponent";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { initSocket } from "../socket";
import ACTIONS from "../actions/SocketActions";

function EditorPage() {
  const location = useLocation();
  const socketRef = useRef(null);
  const reactNavigator = useNavigate();
  const { roomId } = useParams();
  const [clients, setClients] = useState([]);

  useEffect(() => {
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
        }
      );
    };
    init();
  }, []);

  return (
    <div className="mainWrap container-fluid mh-100 overflow-hidden">
      <div className="row">
        <div className="editor-container col-lg-9 border-3 border-end">
          <EditorComponent />
        </div>
        <div className="aside min-vh-100 col-lg-3">
          <Sidebar clients={clients} location={location} />
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
