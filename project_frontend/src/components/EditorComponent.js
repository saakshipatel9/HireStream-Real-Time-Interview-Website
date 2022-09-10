import React, { useState, useEffect, useRef } from "react";
import CodeEditor from "./CodeEditor";
import OutputWindow from "./OutputWindow";
import LanguageDropDown from "./LanguageDropDown";
import ThemeDropDown from "./ThemeDropDown";
import useKeyPress from "../hooks/useKeyPress";
import InputWindow from "./InputWindow";
import OutputDetail from "./OutputDetail";
import ACTIONS from "../actions/SocketActions";

function EditorComponent({
  socketRef,
  roomId,
  value,
  handleEditorChange,
  onSelectChange,
  handleThemeChange,
  handleCompile,
  btnDisable,
  processing,
  code,
  onChange,
  language,
  theme,
  outputDetails,
  customInput,
  setCustomInput,
  selectedOption,
}) {
  const [themeCode, setThemeCode] = useState("");
  useEffect(() => {
    // console.log("________________", theme);
    setThemeCode(theme?.value);
  }, [theme]);
  return (
    <div className="">
      <div className="d-flex flex-row">
        <div className="px-2 py-2">
          <LanguageDropDown
            onSelectChange={onSelectChange}
            selectedOption={selectedOption}
          />
        </div>
        <div className="px-2 py-2">
          <ThemeDropDown handleThemeChange={handleThemeChange} theme={theme} />
        </div>
        <div className="px-2 py-2">
          {/* <button className="btn button" onClick={handleCompile}>
            Run
          </button> */}
          <button
            className="btn button"
            onClick={handleCompile}
            disabled={btnDisable}
          >
            {processing ? "Processing..." : "Compile and Execute"}
          </button>
        </div>
      </div>
      <div className="px-2 py-2">
        <div className="w-100">
          <CodeEditor
            language={language?.value}
            theme={themeCode}
            value={value}
            handleEditorChange={handleEditorChange}
          />
        </div>
        <div id="io-window" className="container-fluid h-100">
          <div className="row">
            <div className="col-lg-6">
              <OutputWindow outputDetails={outputDetails} />
            </div>
            <div className="col-lg-6">
              <InputWindow
                customInput={customInput}
                setCustomInput={setCustomInput}
              />
            </div>
            {outputDetails && <OutputDetail outputDetails={outputDetails} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorComponent;
