import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI();

const translation = await openai.audio.translations.create({
  file: fs.createReadStream("resources/nativity.mp3"),
  model: "whisper-1",
});

console.log(translation.text);