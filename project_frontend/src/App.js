import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EditorPage from "./pages/EditorPage";
import Waiting from "./pages/Waiting";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={<Home />}></Route>
          <Route exact path="/editor/:roomId" element={<EditorPage />}></Route>
          <Route exact path="/redirecting" element={<Waiting />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
