import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import ACTIONS from "../actions/SocketActions";
import { useEffect, useRef } from "react";

function CodeEditor({
  onChange,
  language,
  code,
  theme,
  socketRef,
  roomId,
  onCodeChange,
}) {
  const [value, setValue] = useState(code);

  const handleEditorChange = (value) => {
    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
      roomId,
      value,
    });
    setValue(value);
    onChange("code", value);
  };

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ value }) => {
        // console.log(value);
        if (value !== null) {
          setValue(value);
          onCodeChange(value);
        }
      });
    }

    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef.current]);

  return (
    <div className="">
      <Editor
        height="85vh"
        width={`100%`}
        language={language || "javascript"}
        value={value}
        theme={theme}
        defaultValue="// some comment"
        onChange={handleEditorChange}
      />
    </div>
  );
}

export default CodeEditor;
