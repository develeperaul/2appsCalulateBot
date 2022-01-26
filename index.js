const TelegramBot = require('node-telegram-bot-api')
const token = '5091648941:AAHwJIg8ADsME3ad1sQcEmU0IR1BhxmrdsE'

const bot = new TelegramBot(token, {polling: true})