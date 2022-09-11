import React, { useRef, useEffect } from "react";

function Board() {
  return (
    <div className="board">
      <canvas className="whiteboard" id="whiteboard"></canvas>

      <div className="colors">
        <div className="color black"></div>
        <div className="color red"></div>
        <div className="color green"></div>
        <div className="color blue"></div>
        <div className="color yellow"></div>
      </div>
    </div>
  );
}

export default Board;
