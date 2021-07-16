import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { Route, Switch } from "wouter";
import AudioContextProvider from "./audio/AudioContextProvider";
import HostUI from "./components/organisms/HostUI/HostUI";
import GuestUI from "./components/organisms/GuestUI/GuestUI";

ReactDOM.render(
  <React.StrictMode>
    <AudioContextProvider>
      <Switch>
        <Route path="/host">
          <HostUI />
        </Route>
        <Route path="/guest">
          <GuestUI />
        </Route>
        <Route>hello 404</Route>
      </Switch>
    </AudioContextProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
