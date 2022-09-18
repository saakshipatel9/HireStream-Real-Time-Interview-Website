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

      <div className="controls">
        <div className="control eraser">
          <i className="bi bi-eraser-fill"></i>
        </div>
        <div className="control undo">
          <i className="bi bi-arrow-counterclockwise"></i>
        </div>
        <div className="control redo">
          <i className="bi bi-arrow-clockwise"></i>
        </div>
      </div>
    </div>
  );
}

export default Board;
