import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI();

const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream("resources/LearningEnglishConversations-20250527-TheEnglishWeSpeakHaveInYourLocker.mp3"),
  model: "gpt-4o-transcribe",
});

console.log(transcription.text);