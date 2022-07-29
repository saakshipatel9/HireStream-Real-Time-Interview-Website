import React, { useState } from "react";
import Client from "../components/Client";
import { useLocation, Navigate } from "react-router-dom";

function Sidebar() {
  const location = useLocation();
  const [clients, setClients] = useState([
    { socketId: 1, userName: "Jay V" },
    { socketId: 2, userName: "Peter P" },
  ]);

  if (!location.state) {
    return <Navigate to />;
  }

  return (
    <>
      <div className="asideInner">
        <p style={{ fontWeight: "bold" }}>Connected</p>
        <div className="clientList">
          {clients.map((client) => {
            return <Client key={client.socketId} username={client.userName} />;
          })}
        </div>
      </div>
      <button className="btn button copyBtn">Copy Room ID</button>
      <button className="btn button leaveBtn">Leave</button>
    </>
  );
}

export default Sidebar;
