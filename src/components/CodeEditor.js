import React from "react";
import Editor from "@monaco-editor/react";

function CodeEditor({ language, theme, value, handleEditorChange }) {
  return (
    <div className="">
      <Editor
        height="85vh"
        width={`100%`}
        language={language}
        value={value}
        theme={theme}
        onChange={handleEditorChange}
      />
    </div>
  );
}

export default CodeEditor;
