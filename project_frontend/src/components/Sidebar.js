import React, { useState, useEffect, useRef } from "react";
import Client from "../components/Client";
import { Navigate } from "react-router-dom";

function Sidebar({ clients, location }) {
  if (!location.state) {
    return <Navigate to />;
  }

  return (
    <>
      <div className="asideInner">
        <p style={{ fontWeight: "bold" }}>Connected</p>
        <div className="clientList">
          {clients.map((client) => {
            return <Client key={client.socketId} username={client.username} />;
          })}
        </div>
      </div>
      <button className="btn button copyBtn">Copy Room ID</button>
      <button className="btn button leaveBtn">Leave</button>
    </>
  );
}

export default Sidebar;
