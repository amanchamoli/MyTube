import dns from "node:dns";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config({
    path: './.env'
});

connectDB()
.then( () => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server running on port ${process.env.PORT || 8000}`);
    })
})
.catch((err)=> {
    console.log("MONGO DB connection failed !!!", err);
})
