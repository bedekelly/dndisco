import express, { Express } from "express";
import { v4 as uuid } from "uuid";
import fs from "fs-extra";
import { getSession } from "./sessions";
import { randomUUID } from "crypto";

export default function setupAPI(
  app: Express,
  updateClientsAndHost: (sessionID: string) => void
) {
  /**
   * Serve all uploaded files (with UUID filenames) as static files.
   * Set them as being immutable — i.e. they'll never be edited — and
   * set their max-age to something really long.
   */
  app.use(
    "/files",
    express.static("files", {
      immutable: true,
      maxAge: 30 * 1000,
    })
  );

  /**
   * The host should be able to upload audio files. These files
   * should have a UUID generated for them, which will be used
   * to look them up in the filesystem and over the network.
   * The browser also calculates the duration of the file in ms.
   */
  app.post("/upload-audio/:sessionID", (request, response) => {
    request.pipe(request.busboy);
    const { sessionID } = request.params;
    const session = getSession(sessionID);
    const soundID = uuid();

    request.busboy.on("field", (fieldName: string, fieldValue: string) => {
      if (fieldName !== "duration") {
        console.warn("Unknown fieldname specified:", fieldName);
      }
      let durationMS = parseInt(fieldValue, 10);
      session.durations[soundID] = durationMS;
    });

    request.busboy.on("file", (_fieldname, file, filename) => {
      console.log("Uploading", filename, "as", soundID);
      const fileStream = fs.createWriteStream("files/" + soundID);
      file.pipe(fileStream);

      fileStream.on("close", async () => {
        // Future implementation: this *must* be synchronous.
        session.files.push(soundID);
        updateClientsAndHost(sessionID);
        response.send({ soundID });
        console.log("Completed upload of", filename, "as", soundID);
      });
    });
  });

  app.post("/session", (_request, response) => {
    const sessionID = randomUUID();
    getSession(sessionID);
    response.send({ sessionID });
  });
}
