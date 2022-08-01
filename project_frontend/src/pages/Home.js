import React from "react";
import Form from "../components/Form";
import Logo from "../image-removebg-preview.png";

function Home() {
  return (
    <div className="container-fluid min-vw-100 homePageWrapper d-flex flex-column align-items-center justify-content-center">
      <div className="logo">
        <img src={Logo} alt="" style={{ width: "754px" }} />
      </div>
      <div className="border border-1 rounded-1 w-25 shadow">
        <Form />
      </div>
    </div>
  );
}

export default Home;
