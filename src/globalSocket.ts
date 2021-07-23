import client from "socket.io-client";
import { apiURL } from "./network/api";

const globalSocket = client(apiURL);

export default globalSocket;
