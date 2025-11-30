import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI();

const agentRef = fs.readFileSync("short_ref.mp3").toString("base64");

const transcript = await openai.audio.transcriptions.create({
  file: fs.createReadStream("resources/transcribe_diarization_audio.mp3"),
  model: "gpt-4o-transcribe-diarize",
  response_format: "diarized_json",
  chunking_strategy: "auto",
  extra_body: {
    known_speaker_names: ["agent"],
    known_speaker_references: ["data:audio/mpeg;base64," + agentRef],
  },
});

for (const segment of transcript.segments) {
  console.log(`${segment.speaker}: ${segment.text}`, segment.start, segment.end);
}