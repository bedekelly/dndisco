import client from "socket.io-client";
import { apiURL } from "./api";

const globalSocket = client(apiURL);

export default globalSocket;
