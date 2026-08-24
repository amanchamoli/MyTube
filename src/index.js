import dns from "node:dns";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config({
    path: './.env'
});

connectDB()