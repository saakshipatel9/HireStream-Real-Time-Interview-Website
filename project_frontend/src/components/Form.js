import React, { useState } from "react";
import { Tabs, Tab } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import { Toast } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  EmailShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
} from "react-share";

function Form() {
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [roomIdJoin, setRoomIdJoin] = useState("");
  const [showToast, setToast] = useState(false);
  const [toastHeader, setToastHeader] = useState("");
  const [toastBody, setToastBody] = useState("");
  const [toastColor, setToastColor] = useState("");
  const [showShare, setShare] = useState(false);

  const createNewRoom = (e) => {
    const id = uuidv4();
    setRoomId(id);
    console.log(id);
  };

  const showShareBox = (e) => {
    setShare(true);
    setTimeout(() => {
      setShare(false);
    }, 3000);
  };

  // const copyText = () => {
  //   navigator.clipboard.writeText(roomId);
  //   setToastHeader("Copied!");
  //   setToastBody(shareRef);
  //   setToastColor("green");
  //   setToast(true);
  // };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!roomIdJoin || !userName) {
      setToastHeader("Warning!");
      setToastBody("Room ID and Name is required.");
      setToastColor("red");
      setToast(true);
      return;
    }

    navigate(`/editor/${roomIdJoin}`, {
      state: {
        userName,
      },
    });
  };

  return (
    <>
      <div className="form-container rounded-1 ">
        <Tabs
          justify
          variant="pills"
          defaultActiveKey="tab-1"
          className="tab-container mb-1 p-0 border-bottom"
        >
          <Tab eventKey="tab-1" title="Create Room">
            <div className="p-2">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Click on Generate ID"
                  onChange={(e) => setRoomId(e.target.value)}
                  value={roomId}
                  readOnly
                />
                <span
                  className="input-group-text"
                  style={{ cursor: "pointer" }}
                  id="copyBtn"
                  onClick={showShareBox}
                >
                  <i className="bi bi-send-fill"></i>
                </span>
              </div>
              <button className="btn button mt-2" onClick={createNewRoom}>
                Generate ID
              </button>
              {showShare && (
                <div className="share_buttons shadow-sm">
                  <p style={{ fontWeight: "bold" }}>Share Meeting ID</p>
                  <div className=" d-flex align-items-center justify-content-between ">
                    <EmailShareButton
                      subject="HireStream:Meeting Id for your upcoming Interview"
                      body={roomId}
                    >
                      <i
                        className="bi bi-envelope share_icon"
                        style={{ color: "#EA4335" }}
                      ></i>
                    </EmailShareButton>
                    <LinkedinShareButton
                      title="HireStream:Meeting Id for your upcoming Interview"
                      summary={roomId}
                      source="HireStream"
                    >
                      <i
                        class="bi bi-linkedin share_icon"
                        style={{ color: "#0077b5" }}
                      ></i>
                    </LinkedinShareButton>
                    <WhatsappShareButton title="HireStream:Meeting Id for your upcoming Interview">
                      <i
                        class="bi bi-whatsapp share_icon"
                        style={{ color: "#25d366" }}
                      ></i>
                    </WhatsappShareButton>
                  </div>
                </div>
              )}
            </div>
          </Tab>
          <Tab eventKey="tab-2" title="Join Room">
            <form className="p-2">
              <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  onChange={(e) => setUserName(e.target.value)}
                  value={userName}
                  aria-describedby="emailHelp"
                  autoComplete="off"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="roomIdJoin" className="form-label">
                  Room Id
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="roomIdJoin"
                  onChange={(e) => setRoomIdJoin(e.target.value)}
                  value={roomIdJoin}
                  autoComplete="off"
                />
              </div>

              <button type="submit" className="btn button" onClick={joinRoom}>
                Join
              </button>
            </form>
          </Tab>
        </Tabs>
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
    </>
  );
}

export default Form;
