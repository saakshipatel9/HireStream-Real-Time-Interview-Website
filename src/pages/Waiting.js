import React, { useState, useEffect, useRef, createContext } from "react";
import { initSocket } from "../socket";
import { useNavigate, useLocation } from "react-router-dom";
import ACTIONS from "../actions/SocketActions";
import { Link } from "react-router-dom";
import Wait_GIF from "../waiting_gif.gif";
import { Toast } from "react-bootstrap";

function Waiting() {
  const location = useLocation();
  const reactNavigator = useNavigate();
  const roomId = location.state?.roomIdJoin;
  const userName = location.state?.userName;
  const email = location.state?.joinEmail;
  const isInitiator = false;
  const [test, setTest] = useState();
  const [navigate, setNavigate] = useState(false);
  const socketRef = useRef(null);
  const [showToast, setToast] = useState(false);
  const [toastHeader, setToastHeader] = useState("");
  const [toastBody, setToastBody] = useState("");
  const [toastColor, setToastColor] = useState("");

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

      socketRef.current.emit("asking_to_join", {
        roomId,
        userName,
        email,
        isInitiator,
      });

      socketRef.current.on("permitted_to_join", () => {
        reactNavigator(`/editor/${roomId}`, {
          state: {
            roomId,
            userName,
            isInitiator,
          },
          replace: true,
        });
      });

      socketRef.current.on("not_permitted_to_join", () => {
        setToastHeader("Can't Join!");
        setToastBody("Admin refuse your request to join the meeting.");
        setToastColor("red");
        setToast(true);

        setTimeout(() => {
          reactNavigator("/", {
            state: {
              not_permitted: true,
            },
          });
        }, 4000);
      });
    };
    init();
  }, []);

  return (
    <div className="container-fluid min-vw-100 homePageWrapper d-flex flex-column align-items-center justify-content-center">
      <div className="wait-container border border-1 rounded-1 w-25 shadow text-center">
        <img src={Wait_GIF} alt="" style={{ width: "250px" }} />
        <h4 style={{ fontWeight: "bold" }}>Waiting for admin to let you in!</h4>
        <p>You will be redirected to the meeting if admin will allow.</p>
      </div>
      <div className="p-2">
        <Toast
          onClose={() => setToast(false)}
          autohide
          show={showToast}
          delay={2200}
          style={{ background: toastColor, color: "#ffffff" }}
        >
          <Toast.Header>
            <strong className="mr-auto">{toastHeader}</strong>
          </Toast.Header>
          <Toast.Body>{toastBody}</Toast.Body>
        </Toast>
      </div>
    </div>
  );
}

export default Waiting;
