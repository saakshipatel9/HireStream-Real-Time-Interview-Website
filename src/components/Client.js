import React from "react";
import Avatar from "react-avatar";

function Client({ username, video }) {
  let id = `video-${username}`;
  return (
    <div className="client" id={username}>
      {/* {video ? ( */}
      <video
        id={id}
        width="300px"
        autoPlay={true}
        style={{ borderRadius: "10px" }}
      ></video>
      {/* ) : ( */}
      {video ? null : <Avatar name={username} size={150} round="14px" />}

      {/* )} */}
      <span className="userName">{username}</span>
    </div>
  );
}

export default Client;
