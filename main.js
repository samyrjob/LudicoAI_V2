const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

// Load environment variables
require('dotenv').config();

// =============================================================================
// OPENAI CONFIGURATION
// =============================================================================

// TODO: Replace with your actual API key!

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
// IPC HANDLERS - Communication between renderer and main
// =============================================================================

/**
 * Handle transcription request from renderer
 * 
 * What happens:
 * 1. Renderer sends video file path
 * 2. Main process reads the file
 * 3. Main process sends to Whisper API
 * 4. Main process returns transcription to renderer
 */



// ipcMain.handle('transcribe-audio', async (event, data) => {
//     const { name, buffer } = data;

//     try {
//         console.log("🎬 Received file:", name);
//         console.log("📦 Buffer size:", (buffer.length / 1024 / 1024).toFixed(2), "MB");

//         // Create a temporary file
//         const tempPath = path.join(app.getPath('temp'), name);
//         fs.writeFileSync(tempPath, buffer);

//         const videoFile = fs.createReadStream(tempPath);

//         console.log('🎙️ Calling Whisper API...');
        
//         const transcription = await openai.audio.transcriptions.create({
//             file: videoFile,
//             model: 'whisper-1',
//             response_format: 'verbose_json',
//             timestamp_granularities: ['segment'],
//             language: 'en'
//         });

//         return {
//             success: true,
//             transcription
//         };

//     } catch (error) {
//         console.error("❌ Transcription error:", error);
//         return { success: false, error: error.message };
//     }
// });

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

ipcMain.handle('transcribe-audio', async (event, data) => {
    const { name, buffer } = data;

    try {
        console.log("🎬 Received file:", name);
        console.log("📦 Original size:", (buffer.length / 1024 / 1024).toFixed(2), "MB");

        // Create temporary paths
        const tempDir = app.getPath('temp');
        const videoPath = path.join(tempDir, name);
        const audioPath = path.join(tempDir, `audio_${Date.now()}.mp3`);

        // Write video to temp file
        fs.writeFileSync(videoPath, buffer);

        // Extract and compress audio using FFmpeg
        console.log("🎵 Extracting audio with FFmpeg...");
        
        // This command:
        // - Extracts audio from video
        // - Converts to MP3
        // - Compresses to 64kbps (good quality, small size)
        // - Single channel (mono) to reduce size further
        const ffmpegCommand = `ffmpeg -i "${videoPath}" -vn -ar 16000 -ac 1 -b:a 64k "${audioPath}" -y`;
        
        await execPromise(ffmpegCommand);

        // Check compressed file size
        const audioStats = fs.statSync(audioPath);
        const audioSizeMB = audioStats.size / 1024 / 1024;
        console.log("🎵 Compressed audio size:", audioSizeMB.toFixed(2), "MB");

        // If still too large, we need to split it
        if (audioSizeMB > 24) {
            console.error("❌ Audio file still too large after compression:", audioSizeMB, "MB");
            
            // Clean up
            fs.unlinkSync(videoPath);
            fs.unlinkSync(audioPath);
            
            return {
                success: false,
                error: `Audio file is ${audioSizeMB.toFixed(2)} MB after compression. Whisper limit is 25 MB. Please use a shorter video or implement chunking.`
            };
        }

        // Send to Whisper API
        console.log('🎙️ Calling Whisper API...');
        
        const audioFile = fs.createReadStream(audioPath);
        
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            response_format: 'verbose_json',
            timestamp_granularities: ['segment'],
            language: 'en'
        });

        // Clean up temporary files
        fs.unlinkSync(videoPath);
        fs.unlinkSync(audioPath);

        console.log("✅ Transcription successful!");
        return {
            success: true,
            transcription
        };

    } catch (error) {
        console.error("❌ Transcription error:", error);
        
        // Clean up any temp files on error
        try {
            const tempDir = app.getPath('temp');
            const videoPath = path.join(tempDir, name);
            const audioPath = path.join(tempDir, `audio_${Date.now()}.mp3`);
            
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        } catch (cleanupError) {
            console.error("Cleanup error:", cleanupError);
        }
        
        return { 
            success: false, 
            error: error.message 
        };
    }
});