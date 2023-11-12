const { Client, RemoteAuth, MessageMedia } = require("whatsapp-web.js");
const mongoose = require("mongoose");
const { MongoStore } = require("wwebjs-mongo");
const { whatsappResponse } = require("../functions/whatsapp-bot");
require("dotenv").config();

let clientPromise = new Promise((resolve, reject) => {
  mongoose
    .connect(process.env.DATABASE)
    .then(() => {
      console.log("Connected to MongoDB Atlas");
      const store = new MongoStore({ mongoose: mongoose });
      const client = new Client({
        ffmpeg: "./ffmpeg.exe",
        authStrategy: new RemoteAuth({
          store: store,
          backupSyncIntervalMs: 300000,
        }),
      });

      client.on("ready", () => {
        console.log("Client is ready!");
        resolve(client);
      });

      whatsappResponse(client);
      client.initialize();
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB Atlas:", error.message);
      reject(error);
    });
});

module.exports.clientPromise = clientPromise;

// Membuat schema

const UserSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: false,
  },
});

const User = mongoose.model("User", UserSchema);

module.exports.User = User;
