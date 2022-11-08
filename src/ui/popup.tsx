import * as React from "react";
import * as ReactDOM from "react-dom";

function startScraping() {
  console.log("click START_SCRAPING");
  chrome.runtime.sendMessage({ type: "START_SCRAPING" });
}

function UglyScrapper() {
  return (
    <div className="popup-padded">
      <h1>CNBC</h1>
      <button onClick={startScraping}>Collect Data</button>
    </div>
  );
}

ReactDOM.render(<UglyScrapper />, document.getElementById("root"));
