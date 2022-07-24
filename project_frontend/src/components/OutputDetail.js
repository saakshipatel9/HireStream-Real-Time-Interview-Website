import React from "react";

function OutputDetail({ outputDetails }) {
  return (
    <div className="metrics-container mt-4 d-flex flex-column">
      <p className="fs-6">
        Status:{" "}
        <span className="fw-semibold px-2 py-1 rounded-md bg-gray-100">
          {outputDetails?.status?.description}
        </span>
      </p>
      <p className="fs-6">
        Memory:{" "}
        <span className="fw-semibold px-2 py-1 rounded-md bg-gray-100">
          {outputDetails?.memory}
        </span>
      </p>
      <p className="fs-6">
        Time:{" "}
        <span className="fw-semibold px-2 py-1 rounded-md bg-gray-100">
          {outputDetails?.time}
        </span>
      </p>
    </div>
  );
}

export default OutputDetail;
