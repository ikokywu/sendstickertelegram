// Telegram bot
const { Telegraf } = require("telegraf");
require("dotenv").config();

const token = process.env.TOKEN;
const bot = new Telegraf(token);

module.exports = { bot };
