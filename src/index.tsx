import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { Route, Switch } from "wouter";
import AudioContextProvider from "./audio/AudioContextProvider";
import HostUI from "./components/pages/HostUI/HostUI";
import GuestUI from "./components/pages/GuestUI/GuestUI";
import CreateSessionUI from "./components/pages/CreateSession";

ReactDOM.render(
  <React.StrictMode>
    <AudioContextProvider>
      <Switch>
        <Route path="/host/:sessionID" component={HostUI} />
        <Route path="/guest/:sessionID" component={GuestUI} />
        <Route>
          <CreateSessionUI />
        </Route>
      </Switch>
    </AudioContextProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
