import { useState } from "react";
import { useLocation } from "wouter";
import { apiURL } from "../../network/api";
import ScreenCenter from "../atoms/ScreenCenter";
import TextLoader from "../atoms/TextLoader";

function getSessionID() {
  return fetch(`${apiURL}/session`, { method: "POST" })
    .then((response) => response.json())
    .then((response) => response.sessionID);
}

export default function CreateSession() {
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  async function createSession() {
    if (loading) return;
    setLoading(true);
    const sessionID = await getSessionID();
    setLocation(`/host/${sessionID}`);
  }

  return (
    <ScreenCenter>
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold">Create a Session</h1>
        <button
          onClick={createSession}
          className="border border-1 py-2 text-lg border-gray-300 mt-5 rounded-md bg-none hover:bg-red-50 transition-all"
        >
          <span className="inline-block w-3 h-3 mr-2 bg-red-600 rounded-full" />
          Go Live!
          {loading && <TextLoader />}
        </button>
      </div>
    </ScreenCenter>
  );
}
