import React, { useState, useEffect, useRef, createContext } from "react";
import { initSocket } from "../socket";
import { useNavigate, useLocation } from "react-router-dom";
import ACTIONS from "../actions/SocketActions";
import { Link } from "react-router-dom";

function Waiting() {
  const location = useLocation();
  const reactNavigator = useNavigate();
  const roomId = location.state?.roomIdJoin;
  const userName = location.state?.userName;
  const [test, setTest] = useState();
  const socketRef = useRef(null);
  const [navigate, setNavigate] = useState(false);

  useEffect(() => {
    const init = async () => {
      socketRef.current.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleError(err));
      socketRef.current.on("connect_failed", (err) => handleError(err));
      function handleError(e) {
        console.log("socket error", e);
        // toast("socket connection failed try again later!");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        userName,
      });

      // socketRef.current.on(ACTIONS.NAVIGATE_USER, ({ roomId }) => {
      //   setNavigate(true);
      // });
    };
    init();
  }, []);

  useEffect(() => {
    setNavigate(true);
  },[socketRef]);

  return (
    <>
      {navigate ? (
        <Link to={{ pathname: `/editor/${roomId}`, state: { socketRef } }}>
          Hello
        </Link>
      ) : (
        "No"
      )}
    </>
  );
}

export default Waiting;
