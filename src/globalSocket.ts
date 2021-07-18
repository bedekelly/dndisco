import client from "socket.io-client";
import { apiURL } from "./components/pages/CreateSession";

const globalSocket = client(apiURL);

export default globalSocket;
