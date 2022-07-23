import React from "react";
import Form from "../components/Form";

function Home() {
  return (
    <div className="container-fluid min-vw-100 min-vh-100 homePageWrapper d-flex align-items-center justify-content-center">
      <div className="border border-1 rounded-1 w-25">
        <Form />
      </div>
    </div>
  );
}

export default Home;
