require('dotenv').config();

const token = process.env.TOKEN;
const dir = process.env.DIR;

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();

const bot = new TelegramBot(token, { polling: true });

const winston = require('winston');
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'log.txt', level: 'info' })
  ]
});

const dbFileName = 'file_data.db';
let db;

// Проверяем, существует ли файл базы данных
if (fs.existsSync(dbFileName)) {
  db = new sqlite3.Database(dbFileName);
} else {
  console.error(`Database file "${dbFileName}" not found.`);
  db = new sqlite3.Database(dbFileName);
}

db.serialize(() => {
  // Создаем таблицу для пользователей
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      chat_id INTEGER,
      user_id INTEGER,
      user_tel TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Создаем таблицу для файлов и действий
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY,
      chat_id INTEGER,
      user_id INTEGER,
      file_id TEXT,
      file_type TEXT,
      file_path TEXT,
      action TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

function insertUserData(chatId, userId, userTel) {
  const stmt = db.prepare('INSERT INTO users (chat_id, user_id, user_tel) VALUES (?, ?, ?)');
  stmt.run(chatId, userId, userTel);
  stmt.finalize();
}

function insertFileData(chatId, userId, fileId, fileType, filePath, action) {
  const stmt = db.prepare('INSERT INTO files (chat_id, user_id, file_id, file_type, file_path, action) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(chatId, userId, fileId, fileType, filePath, action);
  stmt.finalize();
}

const userStates = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (!userStates[chatId] || userStates[chatId] === 'start') {
    bot.sendMessage(chatId, 'Для авторизации отправьте свой номер телефона:', {
      reply_markup: {
        keyboard: [[{ text: 'Отправить номер', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });

    userStates[chatId] = 'waiting_for_number';
  } else {
    bot.sendMessage(chatId, 'Вы уже авторизованы.');
  }
});

bot.on('contact', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userTel = msg.contact.phone_number;

  if (userStates[chatId] === 'waiting_for_number') {
    bot.sendMessage(chatId, `Спасибо за предоставленный номер телефона: ${userTel}`);
    userStates[chatId] = 'start';

    // Сохраняем данные пользователя в базе данных
    insertUserData(chatId, userId, userTel);
  } else {
    bot.sendMessage(chatId, 'Что-то пошло не так. Пожалуйста, повторите попытку.');
  }
});

bot.on('photo', async msg => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;
  const fileType = 'photo';
  const fileName = `${dir}/${fileId}.jpg`;

  const fileUrl = await bot.getFileLink(fileId);
  const fileStream = fs.createWriteStream(fileName);
  https.get(fileUrl, (response) => {
    response.pipe(fileStream);

    // Сохраняем данные о файле и действии пользователя в базе данных
    insertFileData(chatId, userId, fileId, fileType, fileName, 'photo');

    bot.sendMessage(chatId, 'Файл получен. Спасибо!');
    console.log(`Received photo with file_id: ${fileId}.jpg`);
  });
});

bot.on('voice', async msg => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const fileId = msg.voice.file_id;
  bot.sendMessage(chatId, 'Файл получен. Спасибо!');  
  const fileUrl = await bot.getFileLink(fileId);
  bot.sendMessage(chatId, 'URL получен. Спасибо!');
  const fileType = 'voice';
  const fileName = `${dir}/${fileId}.ogg`;
  bot.sendMessage(chatId, 'Место зарезервированн. Спасибо!');
  const fileStream = fs.createWriteStream(fileName);
  bot.sendMessage(chatId, 'Файл сохранени. Спасибо!');
  https.get(fileUrl, (response) => {
    response.pipe(fileStream);
    insertFileData(chatId, userId, fileId, fileType, fileName, 'voice');
    bot.sendMessage(chatId, 'Пишем в лог');
    console.log(`Received photo with file_id: ${fileId}.ogg`);

  });
  console.log(`Received voice message with file_id: ${fileId}.ogg`);
});

// Аналогично обработайте события 'voice', 'video', 'video_note'

// ...
