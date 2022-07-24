import React from "react";

function InputWindow({ customInput, setCustomInput }) {
  return (
    <div className="flex flex-column">
      <h5 className="mt-2 fw-bold">Custom Input</h5>
      <div className="input-container rounded">
        <textarea
          className="form-control"
          id="customInput"
          onChange={(e) => setCustomInput(e.target.value)}
          value={customInput}
        ></textarea>
      </div>
    </div>
  );
}

export default InputWindow;
