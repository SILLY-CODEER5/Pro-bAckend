// connecting to Database .....
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import express from "express";
import { app } from "./app.js";
dotenv.config({
    path: "./env",
});

connectDB()
    .then((req, res) => {
        app.on("Error", (error) => {
            console.log("Error", error);
            throw error;
        });
        app.listen(process.env.PORT || 8000);
        console.log(`Server is running at Port :`, process.env.PORT || 8000);
    })
    .catch((err) => {
        console.log("Error during Connection with DB, error :", err);
    });

// import mongoose from "mongoose";
// import { DB_NAME } from "./constant";
// import express from "express";
// const app = express();
// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("Error", (error) => {
//             console.log("Error", error);
//             throw error;
//         });
//         app.listen(process.env.PORT, () => {
//             console.log("App is listening on port :", process.env.PORT);
//         });
//     } catch (error) {
//         console.error("ERROR :", error);
//         throw error;
//     }
// })();
