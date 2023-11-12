const path = require("path");

const { MessageMedia } = require("whatsapp-web.js");
const { clientPromise } = require("./config/key");
const { bot } = require("./functions/telegram-bot");
const file = require("./functions/functions");

let client = null;
clientPromise
  .then((result) => {
    client = result;
  })
  .catch((error) => {
    console.error(error);
  });

// Bot telegram berjalan
bot.start(async (ctx) => {
  // Cek id telegram dan simpan
  await file.checkUserId(ctx.message.chat.id);
  await ctx.reply("<i>Selamat datang!</i>", { parse_mode: "HTML" });
  await ctx.reply(
    "<i>Silahkan masukan nomer Whatsapp Anda! 📝\n\nContoh: 085732893483</i>",
    { parse_mode: "HTML" }
  );
});

bot.command("about", (ctx) => {
  ctx.reply(
    "Bot ini dibuat menggunakan Bahasa Pemrograman Javascript(Node.js). Tujuannya agar memungkinkan pengguna untuk mengirimkan stiker dari Telegram ke Whatsapp \n\nDevelop by @YourKey92 🌱"
  );
});

// Bot telegram mengirim pesan
bot.on("message", async (ctx) => {
  await file.checkUserId(ctx.message.chat.id);

  // Menambahkan nomer WhatsApp
  const addPhoneNumber = await file.checkMessage(
    ctx.message.chat.id,
    ctx.message.text
  );
  if (addPhoneNumber) {
    await ctx.telegram.sendMessage(
      ctx.message.chat.id,
      "<i>Nomer telpon berhasil tersimpan! 📙</i>",
      { parse_mode: "HTML" }
    );
    await ctx.telegram.sendMessage(
      ctx.message.chat.id,
      "<i>Kirim sticker!</i>",
      { parse_mode: "HTML" }
    );
    return;
  }

  // Cek nomer WhatsApp
  let phoneNumber = await file.checkPhoneNumber(ctx.message.chat.id);
  if (!phoneNumber) {
    ctx.telegram.sendMessage(
      ctx.message.chat.id,
      "<i>Nomor tujuan belum ada 🤔\nSilahkan masukan nomer Whatsapp Anda!\n\nContoh: 085732893483</i>",
      { parse_mode: "HTML" }
    );
    return;
  }

  // Jika yang dikirim bukan sticker
  if (!ctx.message.sticker) {
    ctx.telegram.sendMessage(ctx.message.chat.id, "<i>Kirim sticker!</i>", {
      parse_mode: "HTML",
    });
    return;
  }

  phoneNumber = await file.getPhoneNumber(ctx.message.chat.id);
  await ctx.telegram.sendMessage(
    ctx.message.chat.id,
    `<i>Stiker Anda sedang dikirim ke nomor WhatsApp 🫡\n\nPenerima: ${await file.filterPhoneNumber(
      phoneNumber
    )}</i>`,
    { parse_mode: "HTML" }
  );

  ctx.telegram.sendSticker(ctx.message.chat.id, ctx.message.sticker.file_id);

  const fileLink = await ctx.telegram.getFileLink(ctx.message.sticker.file_id);
  const typeFile = fileLink.pathname.split(".")[1];

  const result = await file.downloadImage(fileLink.href, typeFile, ctx);
  sendFileSticker(result.filePath, ctx);
});

// Mengirim stiker
const sendFileSticker = async (filePath, ctx) => {
  try {
    const phoneNumber = await file.getPhoneNumber(ctx.message.chat.id);
    await sendAutoMessage(phoneNumber, filePath, ctx);
  } catch (err) {
    ctx.telegram.sendMessage(
      ctx.message.chat.id,
      "<i>Terjadi error!\n\n@YourKey92</i>",
      { parse_mode: "HTML" }
    );
    console.log(err);
  }
};

const sendAutoMessage = async (phone, filePath, ctx) => {
  const media = await MessageMedia.fromFilePath(filePath);
  await client.sendMessage(phone, media, {
    sendMediaAsSticker: true,
    stickerAuthor: "Created by Tumbuhan",
    stickerName: "Sticker",
    stickerCategories: ["Th"],
  });

  await client.sendMessage(
    phone,
    `Paket sticker dari Telegram 🫠\n\nPengirim: @${ctx.message.chat.username}\nId Pengirim: ${ctx.message.chat.id}`
  );

  file.removeFile(filePath);
  ctx.telegram.sendMessage(
    ctx.message.chat.id,
    "<i>Pengiriman Berhasil ✅</i>",
    { parse_mode: "HTML" }
  );
};

bot.launch();
