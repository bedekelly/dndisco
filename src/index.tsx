import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { Route, Switch } from "wouter";
import AudioContextProvider from "./audio/AudioContextProvider";
// import HostUI from "./components/organisms/HostUI/HostUI";
// import GuestUI from "./components/organisms/GuestUI/GuestUI";
import TestClient from "./components/TestUI";
import TestHost from "./components/TestHost";

ReactDOM.render(
  <React.StrictMode>
    <AudioContextProvider>
      <Switch>
        <Route path={"/host"}>
          <TestHost />
        </Route>
        <Route>
          <TestClient />
        </Route>
      </Switch>
    </AudioContextProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
