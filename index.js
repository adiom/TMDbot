require('dotenv').config();
const token = process.env.TOKEN;

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const https = require('https');

const bot = new TelegramBot(token, { polling: true });
const dir = process.env.DIR

//console.log('Bot Start\n');

//bot.on('polling_error', err => console.log(err.data.error.message));

//bot.on('text', async msg => {

//  console.log('Пришел текст');
//  console.log(msg);

//})

//bot.on('message', msg => {
  //const chatId = msg.chat.id;
  //const messageText = msg.text;
  //console.log(msg);
  //fs.appendFileSync('log_new.txt', msg);
//});

bot.on('photo', async msg => {
  const chatId = msg.chat.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;
  const fileUrl = await bot.getFileLink(fileId);
  const fileName = `${dir}/${fileId}.jpg`;
  const fileStream = fs.createWriteStream(fileName);
  https.get(fileUrl, (response) => {
    response.pipe(fileStream);
  });
  console.log(`Received photo with file_id: ${fileId}.jpg`);
});

bot.on('voice', async msg => {
  const chatId = msg.chat.id;
  const fileId = msg.voice.file_id;
  const fileUrl = await bot.getFileLink(fileId);
  const fileName = `${dir}/${fileId}.ogg`;
  const fileStream = fs.createWriteStream(fileName);
  https.get(fileUrl, (response) => {
    response.pipe(fileStream);
  });
  console.log(`Received voice message with file_id: ${fileId}.ogg`);
});

bot.on('video', async msg => {
  const chatId = msg.chat.id;
  const fileId = msg.video.file_id;
  const fileUrl = await bot.getFileLink(fileId);
  const fileName = `${dir}/${fileId}.mp4`;
  const fileStream = fs.createWriteStream(fileName);
  https.get(fileUrl, (response) => {
    response.pipe(fileStream);
  });
  console.log(`Received video message with file_id: ${fileId}.mp4`);
});

bot.on('video_note', async (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.video_note.file_id;
  const fileUrl = await bot.getFileLink(fileId);
  const fileName = `${dir}/${fileId}.mp4`;
  const fileStream = fs.createWriteStream(fileName);
  https.get(fileUrl, (response) => {
    response.pipe(fileStream);
  });
  console.log(`Received video_note message with file_id: ${fileId}.mp4`);
});
