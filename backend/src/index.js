import dotenv from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import * as models from "./models/index.js";
import { initializeChatSocket } from "./sockets/chat.socket.js";
dotenv.config({
  path: "./.env",
});

connectDB()
  .then(async () => {
    await Promise.all(Object.values(models).map((model) => model.init()));
    console.log("MongoDB model indexes initialized");

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: true,
        credentials: true,
        methods: ["GET", "POST"],
      },
    });

    initializeChatSocket(io);

    httpServer.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });

/*
import express from "express"
const app = express()
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error) => {
            console.log("ERRR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()

*/
