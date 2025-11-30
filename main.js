// const { app, BrowserWindow, ipcMain } = require('electron');
// const path = require('path');
// const fs = require('fs');
// const OpenAI = require('openai');

// // Load environment variables
// require('dotenv').config();

// // =============================================================================
// // OPENAI CONFIGURATION
// // =============================================================================

// // TODO: Replace with your actual API key!

// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// if (!OPENAI_API_KEY) {
//     console.error('❌ ERROR: OPENAI_API_KEY not found in environment variables!');
//     console.error('Please create a .env file with your API key.');
//     app.quit();
// }

// const openai = new OpenAI({
//     apiKey: OPENAI_API_KEY
// });
// // =============================================================================
// // ELECTRON WINDOW SETUP
// // =============================================================================

// function createWindow() {
//     const win = new BrowserWindow({
//         width: 1400,
//         height: 900,
//         webPreferences: {
//             nodeIntegration: true,
//             contextIsolation: false
//         }
//     });

//     win.loadFile('index.html');
// }

// app.whenReady().then(createWindow);

// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//         app.quit();
//     }
// });

// app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) {
//         createWindow();
//     }
// });

// // =============================================================================
// // IPC HANDLERS - Communication between renderer and main
// // =============================================================================

// /**
//  * Handle transcription request from renderer
//  * 
//  * What happens:
//  * 1. Renderer sends video file path
//  * 2. Main process reads the file
//  * 3. Main process sends to Whisper API
//  * 4. Main process returns transcription to renderer
//  */




// const { exec } = require('child_process');
// const util = require('util');
// const execPromise = util.promisify(exec);

// ipcMain.handle('transcribe-audio', async (event, data) => {
//     const { name, buffer } = data;

//     try {
//         console.log("🎬 Received file:", name);
//         console.log("📦 Original size:", (buffer.length / 1024 / 1024).toFixed(2), "MB");

//         // Create temporary paths
//         const tempDir = app.getPath('temp');
//         const videoPath = path.join(tempDir, name);
//         const audioPath = path.join(tempDir, `audio_${Date.now()}.mp3`);

//         // Write video to temp file
//         fs.writeFileSync(videoPath, buffer);

//         // Extract and compress audio using FFmpeg
//         console.log("🎵 Extracting audio with FFmpeg...");
        
//         // This command:
//         // - Extracts audio from video
//         // - Converts to MP3
//         // - Compresses to 64kbps (good quality, small size)
//         // - Single channel (mono) to reduce size further
//         const ffmpegCommand = `ffmpeg -i "${videoPath}" -vn -ar 16000 -ac 1 -b:a 64k "${audioPath}" -y`;
        
//         await execPromise(ffmpegCommand);

//         // Check compressed file size
//         const audioStats = fs.statSync(audioPath);
//         const audioSizeMB = audioStats.size / 1024 / 1024;
//         console.log("🎵 Compressed audio size:", audioSizeMB.toFixed(2), "MB");

//         // If still too large, we need to split it
//         if (audioSizeMB > 24) {
//             console.error("❌ Audio file still too large after compression:", audioSizeMB, "MB");
            
//             // Clean up
//             fs.unlinkSync(videoPath);
//             fs.unlinkSync(audioPath);
            
//             return {
//                 success: false,
//                 error: `Audio file is ${audioSizeMB.toFixed(2)} MB after compression. Whisper limit is 25 MB. Please use a shorter video or implement chunking.`
//             };
//         }

//         // Send to Whisper API
//         console.log('🎙️ Calling Whisper API...');
        
//         const audioFile = fs.createReadStream(audioPath);
        
//         const transcription = await openai.audio.transcriptions.create({
//             file: audioFile,
//             model: 'whisper-1',
//             response_format: 'verbose_json',
//             timestamp_granularities: ['segment'],
//             language: 'en'
//         });

//         // Clean up temporary files
//         fs.unlinkSync(videoPath);
//         fs.unlinkSync(audioPath);

//         console.log("✅ Transcription successful!");
//         return {
//             success: true,
//             transcription
//         };

//     } catch (error) {
//         console.error("❌ Transcription error:", error);
        
//         // Clean up any temp files on error
//         try {
//             const tempDir = app.getPath('temp');
//             const videoPath = path.join(tempDir, name);
//             const audioPath = path.join(tempDir, `audio_${Date.now()}.mp3`);
            
//             if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
//             if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
//         } catch (cleanupError) {
//             console.error("Cleanup error:", cleanupError);
//         }
        
//         return { 
//             success: false, 
//             error: error.message 
//         };
//     }
// });

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const OpenAI = require('openai');

// Load environment variables
require('dotenv').config();

// =============================================================================
// OPENAI CONFIGURATION
// =============================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY not found in environment variables!');
    console.error('Please create a .env file with your API key.');
    app.quit();
}

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

// =============================================================================
// ELECTRON WINDOW SETUP
// =============================================================================

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get video duration using FFprobe
 * 
 * @param {string} videoPath - Path to video file
 * @returns {Promise<number>} - Duration in seconds
 */
async function getVideoDuration(videoPath) {
    try {
        const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
        const { stdout } = await execPromise(command);
        const duration = parseFloat(stdout.trim());
        return duration;
    } catch (error) {
        console.error("❌ Error getting video duration:", error);
        throw new Error("Could not determine video duration");
    }
}

/**
 * Split audio file into chunks using FFmpeg
 * 
 * @param {string} audioPath - Path to audio file
 * @param {number} chunkDuration - Duration of each chunk in seconds
 * @returns {Promise<string[]>} - Array of chunk file paths
 */
async function splitAudioIntoChunks(audioPath, chunkDuration) {
    const tempDir = app.getPath('temp');
    const chunks = [];
    
    // Get total duration
    const totalDuration = await getVideoDuration(audioPath);
    const numChunks = Math.ceil(totalDuration / chunkDuration);
    
    console.log(`📊 Splitting audio into ${numChunks} chunks of ${chunkDuration}s each...`);
    
    for (let i = 0; i < numChunks; i++) {
        const startTime = i * chunkDuration;
        const chunkPath = path.join(tempDir, `chunk_${i}_${Date.now()}.mp3`);
        
        // Extract chunk
        const command = `ffmpeg -i "${audioPath}" -ss ${startTime} -t ${chunkDuration} -vn -ar 16000 -ac 1 -b:a 64k "${chunkPath}" -y`;
        
        console.log(`  📦 Creating chunk ${i + 1}/${numChunks}...`);
        await execPromise(command);
        
        chunks.push(chunkPath);
    }
    
    console.log(`✅ Created ${chunks.length} chunks`);
    return chunks;
}

/**
 * Transcribe audio file (handles both single file and chunking)
 * 
 * @param {string} audioPath - Path to audio file
 * @param {number} duration - Duration in seconds
 * @returns {Promise<Object>} - Transcription with segments
 */
async function transcribeAudio(audioPath, duration) {
    const CHUNK_DURATION = 1200; // 20 minutes
    const MAX_DURATION_FOR_SINGLE_FILE = 2700; // 45 minutes
    
    // Decide: single file or chunking?
    if (duration <= MAX_DURATION_FOR_SINGLE_FILE) {
        // =====================================================================
        // SINGLE FILE TRANSCRIPTION (< 45 minutes)
        // =====================================================================
        console.log("🎙️ Using single-file transcription (video < 45 min)");
        
        const audioFile = fs.createReadStream(audioPath);
        
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            response_format: 'verbose_json',
            timestamp_granularities: ['segment'],
            language: 'en'
        });
        
        return transcription;
        
    } else {
        // =====================================================================
        // CHUNKED TRANSCRIPTION (>= 45 minutes)
        // =====================================================================
        console.log("🎙️ Using chunked transcription (video >= 45 min)");
        
        // Split into chunks
        const chunks = await splitAudioIntoChunks(audioPath, CHUNK_DURATION);
        
        // Transcribe each chunk
        const allSegments = [];
        let timeOffset = 0;
        let fullText = '';
        
        for (let i = 0; i < chunks.length; i++) {
            const chunkPath = chunks[i];
            
            console.log(`  🎙️ Transcribing chunk ${i + 1}/${chunks.length}...`);
            
            const chunkFile = fs.createReadStream(chunkPath);
            
            const transcription = await openai.audio.transcriptions.create({
                file: chunkFile,
                model: 'whisper-1',
                response_format: 'verbose_json',
                timestamp_granularities: ['segment'],
                language: 'en'
            });
            
            // Adjust timestamps for this chunk
            transcription.segments.forEach(seg => {
                allSegments.push({
                    start: seg.start + timeOffset,
                    end: seg.end + timeOffset,
                    text: seg.text,
                    id: seg.id,
                    seek: seg.seek,
                    tokens: seg.tokens,
                    temperature: seg.temperature,
                    avg_logprob: seg.avg_logprob,
                    compression_ratio: seg.compression_ratio,
                    no_speech_prob: seg.no_speech_prob
                });
            });
            
            fullText += transcription.text + ' ';
            timeOffset += CHUNK_DURATION;
            
            // Clean up chunk file
            fs.unlinkSync(chunkPath);
            
            console.log(`  ✅ Chunk ${i + 1}/${chunks.length} complete`);
        }
        
        // Return combined transcription in same format as single file
        return {
            text: fullText.trim(),
            segments: allSegments,
            language: 'en'
        };
    }
}

// =============================================================================
// IPC HANDLER - Main transcription endpoint
// =============================================================================

ipcMain.handle('transcribe-audio', async (event, data) => {
    const { name, buffer } = data;

    let videoPath = null;
    let audioPath = null;

    try {
        console.log("🎬 Received file:", name);
        console.log("📦 Original size:", (buffer.length / 1024 / 1024).toFixed(2), "MB");

        // Create temporary paths
        const tempDir = app.getPath('temp');
        videoPath = path.join(tempDir, `video_${Date.now()}_${name}`);
        audioPath = path.join(tempDir, `audio_${Date.now()}.mp3`);

        // Write video to temp file
        fs.writeFileSync(videoPath, buffer);

        // Get video duration
        console.log("⏱️ Checking video duration...");
        const duration = await getVideoDuration(videoPath);
        const durationMinutes = (duration / 60).toFixed(1);
        console.log(`⏱️ Video duration: ${durationMinutes} minutes (${duration.toFixed(1)}s)`);

        // Extract and compress audio using FFmpeg
        console.log("🎵 Extracting and compressing audio...");
        
        const ffmpegCommand = `ffmpeg -i "${videoPath}" -vn -ar 16000 -ac 1 -b:a 64k "${audioPath}" -y`;
        await execPromise(ffmpegCommand);

        // Check compressed file size
        const audioStats = fs.statSync(audioPath);
        const audioSizeMB = audioStats.size / 1024 / 1024;
        console.log("🎵 Compressed audio size:", audioSizeMB.toFixed(2), "MB");

        // Transcribe (with automatic chunking if needed)
        console.log('🎙️ Starting transcription...');
        const transcription = await transcribeAudio(audioPath, duration);

        // Clean up temporary files
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

        console.log("✅ Transcription complete!");
        console.log(`📝 Total segments: ${transcription.segments.length}`);
        
        return {
            success: true,
            transcription,
            metadata: {
                duration: duration,
                durationMinutes: durationMinutes,
                originalSizeMB: (buffer.length / 1024 / 1024).toFixed(2),
                compressedSizeMB: audioSizeMB.toFixed(2),
                wasChunked: duration > 2700
            }
        };

    } catch (error) {
        console.error("❌ Transcription error:", error);
        
        // Clean up any temp files on error
        try {
            if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
            if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        } catch (cleanupError) {
            console.error("Cleanup error:", cleanupError);
        }
        
        return { 
            success: false, 
            error: error.message 
        };
    }
});