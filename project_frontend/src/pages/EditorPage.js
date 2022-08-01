import React from "react";
import Sidebar from "../components/Sidebar";
// import EditorComponent from "../components/EditorComponent";

function EditorPage() {
  return (
    <div className="mainWrap container-fluid mh-100 overflow-hidden">
      <div className="row">
        <div className="editor-container col-lg-9 border-3 border-end">
          {/* <EditorComponent /> */}
        </div>
        <div className="aside min-vh-100 col-lg-3">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
