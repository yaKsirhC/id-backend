import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { Server } from "socket.io";
import * as http from "http";
import { setupRouter } from "./routes/index.js";
import { setupListener } from "./utils/databaseListener.utils.js";
import { connectDatabase } from "./utils/database.utils.js";
import { handleSocket, handleSocketMessage } from "./utils/socket.utils.js";
const app = express();
app.set("port", process.env.PORT || 4001);
app.use(cors({
    origin: "https://cliq.live",
    allowCredentials: true
}));
app.use(helmet());
//app.use(limiter)
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(mongoSanitize());
setupListener();
connectDatabase().then(()=>{
    setupRouter(app);
    const server = http.createServer(app);
    global.io = new Server(server, {
        cors: {
            origin: "*"
        }
    });
    global.io.sockets.on("connection", function(socket) {
        handleSocket(socket);
        socket.on("data", function(message) {
            handleSocketMessage(message);
        });
    });
    server.listen(process.env.PORT || 4001);
    server.on("listening", ()=>console.log("App running"));
}).catch(()=>{
    console.log("Not possible to start server.");
});
