import React, { useState, useEffect, useRef } from "react";
import { Tabs, Tab } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import { Toast } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import {
  EmailShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  FacebookShareButton,
} from "react-share";
import {
  EmailIcon,
  LinkedinIcon,
  WhatsappIcon,
  FacebookIcon,
} from "react-share";
function Form() {
  const reactNavigator = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [roomIdJoin, setRoomIdJoin] = useState("");
  const [showToast, setToast] = useState(false);
  const [toastHeader, setToastHeader] = useState("");
  const [toastBody, setToastBody] = useState("");
  const [toastColor, setToastColor] = useState("");
  const [showShare, setShare] = useState(false);
  const [email, setEmail] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [isInitiator, setIsInitiator] = useState(false);

  const GenerateId = (e) => {
    const id = uuidv4();
    setRoomId(id);
    console.log(id);
  };

  const CreateRoom = async (e) => {
    try {
      const response = await fetch(
        process.env.REACT_APP_HOST_URL + "/createRoom",
        {
          method: "POST",
          body: JSON.stringify({
            roomId: roomId,
            roomCreator: email,
          }),
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error! status: ${response.status}`);
      }

      const result = await response.json();

      setToastHeader("Create Room");
      setToastBody("Room is created!");
      setToastColor("green");
      setToast(true);

      console.log("result is: ", result);
    } catch (err) {
      console.log(err.message);
    }
  };

  const showShareBox = (e) => {
    setShare(true);
    setTimeout(() => {
      setShare(false);
    }, 8000);
  };

  const copyText = () => {
    navigator.clipboard.writeText(roomId);
    setToastHeader("Copied!");
    setToastBody("Room Id is copied to clipboard");
    setToastColor("green");
    setToast(true);
  };

  const checkIsInitiator = async (JoinRoomId, email) => {
    try {
      const response = await fetch(
        process.env.REACT_APP_HOST_URL + `/checkCreator/${JoinRoomId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result[0].roomCreator === email) {
        reactNavigator(`editor/${roomIdJoin}`, {
          state: {
            roomIdJoin,
            userName,
            isInitiator: true,
          },
        });
      } else {
        reactNavigator("redirecting", {
          state: {
            roomIdJoin,
            userName,
            joinEmail,
            isInitiator: false,
          },
        });
      }
    } catch (err) {
      console.log(err.message);
      setToastHeader("Warning!");
      setToastBody("This room id is neither create by you or any other user.");
      setToastColor("red");
      setToast(true);
      return;
    }
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!roomIdJoin || !userName || !joinEmail) {
      setToastHeader("Warning!");
      setToastBody("Room ID, Email and Name is required.");
      setToastColor("red");
      setToast(true);
      return;
    }

    if (typeof roomIdJoin !== "string" && roomIdJoin.trim().length() === 0) {
      setToastHeader("Warning!");
      setToastBody("Room ID, Email and Name is required.");
      setToastColor("red");
      setToast(true);
      return;
    }

    checkIsInitiator(roomIdJoin, joinEmail);
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
                  type="email"
                  className="form-control"
                  placeholder="Insert email"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
              </div>
              <div className="input-group mt-2">
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
              <div className="d-flex align-items-center d-flex justify-content-between">
                <button className="btn button mt-2" onClick={GenerateId}>
                  Generate ID
                </button>
                <button className="btn button mt-2" onClick={CreateRoom}>
                  Create Room
                </button>
              </div>
              {showShare && (
                <div className="share_buttons shadow-sm">
                  <p style={{ fontWeight: "bold" }}>Share Meeting ID</p>
                  <div className=" d-flex align-items-center justify-content-between ">
                    <button
                      className="btn button"
                      style={{ borderRadius: "50px" }}
                      onClick={copyText}
                    >
                      <i
                        className="bi bi-files"
                        style={{
                          fontWeight: "bold",
                          fontSize: "22px",
                        }}
                      ></i>
                    </button>
                    <EmailShareButton
                      subject="HireStream:Meeting Id for your upcoming Interview"
                      body={"Meeting id:" + roomId.trim()}
                      seperator=" "
                    >
                      {/* <i
                        className="bi bi-envelope share_icon"
                        style={{ color: "#EA4335" }}
                      ></i> */}
                      <EmailIcon size={42} round={true} />
                    </EmailShareButton>
                    {/* <LinkedinShareButton
                      title="HireStream:Meeting Id for your upcoming Interview"
                      summary={roomId}
                      source="HireStream"
                    >
                      <LinkedinIcon size={42} round={true} />
                    </LinkedinShareButton>
                    <WhatsappShareButton title="HireStream:Meeting Id for your upcoming Interview">
                      <WhatsappIcon size={42} round={true} />
                    </WhatsappShareButton> */}
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
                <label htmlFor="name" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  onChange={(e) => setJoinEmail(e.target.value)}
                  value={joinEmail}
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

              <button type="" className="btn button" onClick={joinRoom}>
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
