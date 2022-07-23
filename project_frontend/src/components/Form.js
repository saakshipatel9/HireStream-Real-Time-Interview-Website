import React from "react";
import { Tabs, Tab } from "react-bootstrap";

function Form() {
  return (
    <div className="form-container rounded-1">
      <Tabs
        justify
        variant="pills"
        defaultActiveKey="tab-1"
        className="tab-container mb-1 p-0 border-bottom "
      >
        <Tab eventKey="tab-1" title="Create Room">
          <div className="input-group p-2">
            <input type="text" class="form-control" />
            <span
              class="input-group-text"
              style={{ cursor: "pointer" }}
              id="copyBtn"
            >
              <i class="bi bi-files"></i>
            </span>
          </div>
        </Tab>
        <Tab eventKey="tab-2" title="Join Room">
          <form className="p-2">
            <div className="mb-3">
              <label for="name" className="form-label">
                Name
              </label>
              <input
                type="text"
                className="form-control"
                id="name"
                aria-describedby="emailHelp"
              />
            </div>
            <div className="mb-3">
              <label for="roomId" className="form-label">
                Room Id
              </label>
              <input type="text" className="form-control" id="roomId" />
            </div>

            <button type="submit" className="btn button">
              Submit
            </button>
          </form>
        </Tab>
      </Tabs>
    </div>
  );
}

export default Form;
