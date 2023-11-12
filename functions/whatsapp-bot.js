// WhatsApp bot
const qrcode = require("qrcode-terminal");

const whatsappResponse = (client) => {
  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
  });

  client.on("remote_session_saved", () => {
    console.log("Data tersimpan");
  });
  client.on("message", (message) => {
    if (message.body === "!ping") {
      message.reply("pong");
    }
  });
  client.on("message", async (message) => {
    if (message.body === ".s") {
      if (message.hasMedia === true) {
        const media = await message.downloadMedia();

        message.react("🫡");
        message
          .reply("_Pembuatan sticker sedang diproses, Tuan.._")
          .then(() => {
            message.reply(media, undefined, {
              sendMediaAsSticker: true,
              stickerAuthor: "Created by Tumbuhan",
              stickerName: "Sticker",
              stickerCategories: ["Th"],
            });
          });
      }
    }
  });
};
module.exports = { whatsappResponse };
