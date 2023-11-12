// Module
const { default: axios } = require("axios");
const fs = require("fs");
const path = require("path");
const converter = require("lottie-converter");
const tgs2lottie = require("tgs2lottie");
const { rejects } = require("assert");
const NusantaraValid = require("nusantara-valid");

// Mongoose
const { User } = require("../config/key");

const { get } = require("http");

const imagesFolder = path.join(path.dirname(require.main.filename), "images");
let jsonFile, result;

const getFileFromUrl = async (url, responseType) => {
  try {
    const response = await axios({
      method: "get",
      url: url,
      responseType,
    });
    return response.data;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const convertToJson = (filePath, ctx) => {
  return new Promise((resolve, reject) => {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath).split(".")[0];
      jsonFile = path.join(path.dirname(filePath), fileName) + ".json";

      fs.writeFile(
        jsonFile,
        tgs2lottie.convert(fileBuffer),
        "utf-8",
        async (err) => {
          if (err) {
            console.log(`Data ${path.basename(jsonFile)} gagal dibuat`);
            reject(err);
          }

          ctx.telegram.sendMessage(
            ctx.message.chat.id,
            "<i>Proses 2 berhasil...</i>",
            { parse_mode: "HTML" }
          );
          removeFile(filePath);
          resolve({ jsonFile });
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};

const convertToGif = (filePath, ctx) => {
  return new Promise(async (resolve, reject) => {
    try {
      const fileName = path.basename(filePath).split(".")[0];
      const gifFile = path.join(path.dirname(filePath), fileName) + ".webm";

      let config = {
        format: "webm",
        filename: path.basename(gifFile),
      };

      let converted = await converter({
        file: fs.readFileSync(filePath),
        ...config,
      });

      fs.writeFile(gifFile, converted, "base64", (err) => {
        if (err) {
          console.log(`Data ${path.basename(filePath)} gagal dibuat`);
          reject(err);
        }

        ctx.telegram.sendMessage(
          ctx.message.chat.id,
          "<i>Proses 3 berhasil...</i>",
          { parse_mode: "HTML" }
        );
        removeFile(filePath);
        resolve({ gifFile });
      });
    } catch (err) {
      reject(err);
    }
  });
};

const checkFoler = () => {
  if (!fs.existsSync(imagesFolder)) {
    fs.mkdirSync(imagesFolder);
  }
};

const removeFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.log(`Data ${path.basename(filePath)} gagal dihapus`);
      return;
    }
    console.log(`Data ${path.basename(filePath)} berhasil dihapus`);
  });
};

const addNumberPhone = async (id, number) => {
  let getData = await User.find({ userId: id });
  if (getData[0].phoneNumber || getData[0].phoneNumber == null) {
    getData[0].phoneNumber = number;
    await getData[0].save();

    return true;
  }
};

module.exports.downloadImage = (url, typeFile, ctx) => {
  return new Promise(async (resolve) => {
    const fileName = ctx.message.chat.id + +new Date();

    ctx.telegram.sendMessage(
      ctx.message.chat.id,
      `<i>Proses 1 berhasil...</i>`,
      { parse_mode: "HTML" }
    );
    checkFoler();
    try {
      if (typeFile === "tgs") {
        const response = await getFileFromUrl(url, "stream");
        const filePath = path.join(imagesFolder, fileName + ".tgs");

        const writer = fs.createWriteStream(filePath);
        response.pipe(writer);
        writer.on("finish", async () => {
          try {
            const jsonResult = await convertToJson(filePath, ctx);
            const gifResult = await convertToGif(jsonResult.jsonFile, ctx);
            result = { filePath: gifResult.gifFile, type: "webm" };
          } catch (err) {
            rejects(err);
          }
          resolve(result);
        });
      } else if (typeFile === "webp" || typeFile === "webm") {
        let filePath;
        const fileBuffer = await getFileFromUrl(url, "arraybuffer");

        if (typeFile === "webp") {
          filePath = path.join(imagesFolder, fileName + ".webp");
        } else {
          filePath = path.join(imagesFolder, fileName + ".webm");
        }

        fs.writeFile(filePath, fileBuffer, "binary", (err) => {
          if (err) {
            console.log(`Data ${path.basename(filePath)} gagal dihapus`, err);
          }
          result = { filePath: filePath, type: "webp" };
          resolve(result);
        });
      }
    } catch (err) {
      rejects(err);
    }
  });
};

module.exports.checkUserId = async (id) => {
  const getData = await User.find({ userId: id });
  if (getData.length === 0) {
    const data = await User({
      userId: id,
      phoneNumber: null,
    });

    data.save();
    return data;
  }
};

module.exports.checkPhoneNumber = async (id) => {
  const getData = await User.find({ userId: id });
  if (getData.length > 0) {
    if (getData[0].phoneNumber == null) {
      return false;
    } else {
      return true;
    }
  }
};

module.exports.checkMessage = async (id, phoneNumber) => {
  let number = NusantaraValid.getDataCellularNumber(phoneNumber);

  if (number.provider) {
    number =
      NusantaraValid.formatCellularNumber(phoneNumber, true).replace(
        /[-+]/g,
        ""
      ) + "@c.us";

    addNumberPhone(id, number);
    return true;
  }
};

module.exports.getPhoneNumber = async (id) => {
  const getData = await User.find({ userId: id });

  if (getData.length > 0) {
    return getData[0].phoneNumber;
  }
};

module.exports.filterPhoneNumber = async (phoneNumber) => {
  if (phoneNumber.startsWith("62")) {
    phoneNumber = phoneNumber.substring(2);
  }

  if (phoneNumber.endsWith("@c.us")) {
    phoneNumber = "0" + phoneNumber.slice(0, -5);
  }
  return phoneNumber;
};

module.exports.removeFile = removeFile;
