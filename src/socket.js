import { io } from "socket.io-client";

export const initSocket = async () => {
  // window.location.origin.replace(/^https/, "ws");

  var HOST = window.location.origin.replace(/^https/, "ws");
  console.log("HOST", HOST);
  const options = {
    "force new connection": true,
    reconnectionAttempt: "Infinity",
    timeout: 10000,
    transports: ["websocket"],
  };

  return io(HOST, options);
};
