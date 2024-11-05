import { useState, useEffect } from "react"
import { renderer } from "@/lib/renderer"
import { browser } from "webextension-polyfill-ts"

import "../../globals.css"

const containerId = "chrome-extension-boilerplate-container-id"
const containerClassName = "chrome-extension-boilerplate-container-class"
const tag = "chrome-extension-boilerplate-container"

function App() {
  // const [isActive, setIsActive] = useState(false)

  const getProductData = () => {
    const titleElement = document.querySelector("span#productTitle");
    return titleElement ? titleElement.textContent.trim() : null;
  };

  // Please remove default_popup from manifest.json
  // And you can enable this code to open to communicate with content
  useEffect(() => {

    const data = getProductData();
    if (data) {
      console.log("Sending message:", data);
      browser.runtime.sendMessage({ action: "SEND_PRODUCT_DATA", data });
    }
    // const handleListener = (message) => {
    //   setIsActive(() => !isActive);
    // };

    // browser.runtime.onMessage.addListener(handleListener);
    // return () => {
    //   browser.runtime.onMessage.removeListener(handleListener);
    // };
  }, []);

  return (
    <></>
    // <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 rounded-md p-2">
    //   Content Script {isActive ? "Active" : "Inactive"}
    // </div>
  )
}

renderer(<App />, { tag, containerId, containerClassName })
