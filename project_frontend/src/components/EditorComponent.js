import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import CodeEditor from "./CodeEditor";
import OutputWindow from "./OutputWindow";
import LanguageDropDown from "./LanguageDropDown";
import ThemeDropDown from "./ThemeDropDown";
import { defineThemes } from "../lib/defineThemes";
import useKeyPress from "../hooks/useKeyPress";
import { languageOptions } from "../constants/languageOptions";
import InputWindow from "./InputWindow";
import OutputDetail from "./OutputDetail";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { initSocket } from "../socket";
import ACTIONS from "../actions/SocketActions";

const javascriptDefault = `// some comment`;

function EditorComponent() {
  const ref = useRef(null);
  const socketRef = useRef(null);
  const location = useLocation();
  const reactNavigator = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleError(err));
      socketRef.current.on("connect_failed", (err) => handleError(err));

      function handleError(e) {
        console.log("socket error", e);
        //toast("socket connection failed try again later!");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.userName,
      });
    };
    init();
  }, []);

  const [code, setCode] = useState(javascriptDefault);
  const [customInput, setCustomInput] = useState("");
  const [theme, setTheme] = useState("cobalt");
  const [processing, setProcessing] = useState(null);
  const [outputDetails, setOutputDetails] = useState(null);
  const [language, setLanguage] = useState(languageOptions[0]);
  const [btnDisable, setBtnDisable] = useState(false);

  const onSelectChange = (sl) => {
    setLanguage(sl);
  };

  const onChange = (action, data) => {
    switch (action) {
      case "code": {
        setCode(data);
        break;
      }
      default: {
        console.warn("case not handled!", action, data);
      }
    }
  };

  const handleCompile = () => {
    setBtnDisable(true);
    setProcessing(true);
    const formData = {
      language_id: language.id,
      // encode source code in base64
      source_code: btoa(code),
      stdin: btoa(customInput),
    };
    const options = {
      method: "POST",
      url: "https://judge0-ce.p.rapidapi.com/submissions",
      params: { base64_encoded: "true", fields: "*" },
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        "X-RapidAPI-Key": "cea12a80dbmsh55888b4f56ba4d7p1b0a5ejsn61028cc9bc41",
      },
      data: formData,
    };

    axios
      .request(options)
      .then(function (response) {
        console.log("res.data", response.data);
        const token = response.data.token;
        checkStatus(token);
      })
      .catch((err) => {
        let error = err.response ? err.response.data : err;
        setProcessing(false);
        console.log(error);
      });
  };

  const checkStatus = async (token) => {
    const options = {
      method: "GET",
      url: "https://judge0-ce.p.rapidapi.com/submissions" + "/" + token,
      params: { base64_encoded: "true", fields: "*" },
      headers: {
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        "X-RapidAPI-Key": "cea12a80dbmsh55888b4f56ba4d7p1b0a5ejsn61028cc9bc41",
      },
    };
    try {
      let response = await axios.request(options);
      let statusId = response.data.status?.id;

      // Processed - we have a result
      if (statusId === 1 || statusId === 2) {
        // still processing
        setTimeout(() => {
          checkStatus(token);
        }, 2000);
        return;
      } else {
        setProcessing(false);
        setOutputDetails(response.data);
        // showSuccessToast(`Compiled Successfully!`)
        console.log("response.data", response.data);
        ref.current?.scrollIntoView({ behavior: "smooth" });
        setBtnDisable(false);
        return;
      }
    } catch (err) {
      console.log("err", err);
      setProcessing(false);
      // showErrorToast();
    }
  };

  function handleThemeChange(th) {
    const theme = th;
    console.log("theme...", theme);

    if (["light", "vs-dark"].includes(theme.value)) {
      setTheme(theme);
    } else {
      defineThemes(theme.value).then((_) => setTheme(theme));
    }
  }

  useEffect(() => {
    defineThemes("oceanic-next").then((_) =>
      setTheme({ value: "oceanic-next", label: "Oceanic Next" })
    );
  }, []);

  return (
    <div className="">
      <div className="d-flex flex-row">
        <div className="px-2 py-2">
          <LanguageDropDown onSelectChange={onSelectChange} />
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
            code={code}
            onChange={onChange}
            language={language?.value}
            theme={theme.value}
          />
        </div>
        <div ref={ref} className="container-fluid h-100">
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
