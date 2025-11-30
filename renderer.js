// =============================================================================
// VIDEO.JS INTEGRATION - Using Official API from Documentation
// =============================================================================

console.log('Video.js loaded. Version:', videojs.VERSION);

// =============================================================================
// GLOBAL VARIABLES
// =============================================================================

let player; // The Video.js player instance
const subtitleOverlay = document.getElementById('subtitleOverlay');
const videoFileInput = document.getElementById('videoFile');
const fileNameDisplay = document.getElementById('fileName');
const testSubtitleBtn = document.getElementById('testSubtitleBtn');
const testDiarizationBtn = document.getElementById('testDiarizationBtn');
const statusEl = document.getElementById('status');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');
const bufferedDisplay = document.getElementById('buffered');
const playStatusDisplay = document.getElementById('playStatus');
const vjsVersionDisplay = document.getElementById('vjsVersion');

// =============================================================================
// SUBTITLE DATA STORAGE
// =============================================================================

let subtitles = [];  // Will store subtitle segments with timestamps
let currentSubtitleIndex = -1;  // Track which subtitle is currently showing

// Speaker color mapping (for diarization)
const speakerColors = {
    'SPEAKER_00': '#00ff00',  // Green
    'SPEAKER_01': '#00bfff',  // Blue
    'SPEAKER_02': '#ffff00',  // Yellow
    'SPEAKER_03': '#ff69b4',  // Pink
    'SPEAKER_04': '#ff8c00',  // Orange
    'SPEAKER_05': '#9370db',  // Purple
};

// Default color if speaker not in map
const defaultColor = '#ffffff';  // White

// =============================================================================
// PLAYER INITIALIZATION
// =============================================================================

/**
 * Initialize Video.js player
 * Using the official videojs() function from documentation
 * 
 * @see https://docs.videojs.com/
 */
function initializePlayer() {
    // From docs: videojs(id, options, ready)
    player = videojs('videoPlayer', {
        // Standard options from documentation
        controls: true,              // Show playback controls
        autoplay: false,             // Don't auto-start
        preload: 'auto',            // Load video metadata automatically
        fluid: false,               // Don't use responsive sizing
        responsive: false,          // Don't use responsive breakpoints
        
        // Audio/Video options
        muted: false,
        volume: 1.0,
        
        // Control bar options
        controlBar: {
            volumePanel: { inline: false },
            children: [
                'playToggle',
                'volumePanel',
                'currentTimeDisplay',
                'timeDivider',
                'durationDisplay',
                'progressControl',
                'remainingTimeDisplay',
                'playbackRateMenuButton',
                'fullscreenToggle'
            ]
        }
    }, function onPlayerReady() {
        // This callback runs when player is ready
        console.log('✅ Player ready!');
        console.log('Player ID:', this.id());
        console.log('Tech in use:', this.techName_);
        
        // Display Video.js version
        vjsVersionDisplay.textContent = videojs.VERSION;
    });

    // Setup all event listeners
    setupPlayerEvents();
    
    console.log('Player initialized:', player);
}

// =============================================================================
// EVENT LISTENERS (From Video.js Documentation)
// =============================================================================

/**
 * Setup all Video.js event listeners
 * Using player.on() method from EventTarget documentation
 * 
 * Available events from docs:
 * - loadstart, loadedmetadata, loadeddata, canplay, canplaythrough
 * - play, pause, playing, waiting, seeking, seeked, ended
 * - timeupdate, durationchange, progress, volumechange
 * - error, abort, emptied, stalled, suspend
 */
function setupPlayerEvents() {
    
    // =========================================================================
    // TIMEUPDATE - Fires while video is playing
    // This is THE MOST IMPORTANT event for subtitle synchronization!
    // =========================================================================
    // NEW timeupdate handler with subtitle synchronization:
    player.on('timeupdate', function() {
        const currentTime = player.currentTime();
        const duration = player.duration();
        const bufferedPercent = player.bufferedPercent();
        
        // Update UI displays
        currentTimeDisplay.textContent = currentTime.toFixed(2);
        durationDisplay.textContent = isFinite(duration) ? duration.toFixed(2) : '0.00';
        bufferedDisplay.textContent = (bufferedPercent * 100).toFixed(0) + '%';
        
        // =========================================================================
        // SUBTITLE SYNCHRONIZATION - THE MAGIC HAPPENS HERE!
        // =========================================================================
        
        if (subtitles.length > 0) {
            checkAndDisplaySubtitle(currentTime);
        }
    });
    
    // =========================================================================
    // LOADEDMETADATA - Fires when video metadata is loaded
    // =========================================================================
    player.on('loadedmetadata', function() {
        const duration = player.duration();
        const videoWidth = player.videoWidth();
        const videoHeight = player.videoHeight();
        
        console.log('📊 Metadata loaded:');
        console.log('  Duration:', duration, 'seconds');
        console.log('  Dimensions:', videoWidth, 'x', videoHeight);
        
        updateStatus(`✅ Video loaded: ${duration.toFixed(2)}s (${videoWidth}x${videoHeight})`, 'success');
    });
    
    // =========================================================================
    // PLAY - Fires when playback starts
    // =========================================================================
    player.on('play', function() {
        console.log('▶️ Play event fired');
        playStatusDisplay.textContent = '▶️ Playing';
        playStatusDisplay.style.color = '#90ee90';
    });
    
    // =========================================================================
    // PLAYING - Fires when playback is actually happening
    // (Different from 'play' - this fires after buffering)
    // =========================================================================
    player.on('playing', function() {
        console.log('▶️ Playing event fired (actually playing now)');
    });
    
    // =========================================================================
    // PAUSE - Fires when playback is paused
    // =========================================================================
    player.on('pause', function() {
        console.log('⏸️ Pause event fired');
        playStatusDisplay.textContent = '⏸️ Paused';
        playStatusDisplay.style.color = '#ffa500';
    });
    
    // =========================================================================
    // ENDED - Fires when video finishes
    // =========================================================================
    player.on('ended', function() {
        console.log('⏹️ Ended event fired');
        playStatusDisplay.textContent = '⏹️ Ended';
        playStatusDisplay.style.color = '#666';
        updateStatus('✅ Video playback complete', 'success');
        hideSubtitle();
    });
    
    // =========================================================================
    // SEEKING - Fires when user starts seeking
    // =========================================================================
    player.on('seeking', function() {
        console.log('⏩ Seeking to:', player.currentTime());
    });
    
    // =========================================================================
    // SEEKED - Fires when seeking completes
    // =========================================================================
    player.on('seeked', function() {
        console.log('✅ Seeked to:', player.currentTime());
    });
    
    // =========================================================================
    // DURATIONCHANGE - Fires when duration changes
    // =========================================================================
    player.on('durationchange', function() {
        const duration = player.duration();
        console.log('⏱️ Duration changed:', duration);
        durationDisplay.textContent = isFinite(duration) ? duration.toFixed(2) : '0.00';
    });
    
    // =========================================================================
    // VOLUMECHANGE - Fires when volume changes
    // =========================================================================
    player.on('volumechange', function() {
        const volume = player.volume();
        const muted = player.muted();
        console.log('🔊 Volume:', (volume * 100).toFixed(0) + '%', muted ? '(muted)' : '');
    });
    
    // =========================================================================
    // ERROR - Fires when an error occurs
    // =========================================================================
    player.on('error', function() {
        // From docs: player.error() returns MediaError object
        const error = player.error();
        
        console.error('❌ Player error:', error);
        console.error('Error code:', error ? error.code : 'unknown');
        console.error('Error message:', error ? error.message : 'unknown');
        
        updateStatus('❌ Error loading/playing video', 'error');
    });
    
    // =========================================================================
    // PROGRESS - Fires when browser is downloading
    // =========================================================================
    player.on('progress', function() {
        // From docs: player.buffered() returns TimeRanges object
        const buffered = player.buffered();
        
        if (buffered.length > 0) {
            const bufferedEnd = buffered.end(buffered.length - 1);
            console.log('📥 Download progress:', bufferedEnd.toFixed(2), 'seconds buffered');
        }
    });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get MIME type for video file based on extension
 * 
 * @param {string} filename - The video filename
 * @returns {string} - The MIME type
 */
function getVideoMimeType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    
    const mimeTypes = {
        'mp4': 'video/mp4',
        'm4v': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'ogv': 'video/ogg',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'mkv': 'video/x-matroska',
        'flv': 'video/x-flv',
        '3gp': 'video/3gpp',
        'wmv': 'video/x-ms-wmv'
    };
    
    return mimeTypes[ext] || 'video/mp4';  // Default to mp4 if unknown
}

// =============================================================================
// VIDEO FILE LOADING WITH TRANSCRIPTION
// =============================================================================

/**
 * Handle video file selection and trigger transcription
 * 
 * Flow:
 * 1. User selects video file
 * 2. Load video into player (so they can watch it)
 * 3. Send video to main process for transcription
 * 4. Receive subtitles and store them
 * 5. Subtitles will show automatically during playback (via timeupdate event)
 */
//! old version
// videoFileInput.addEventListener('change', async function(event) {
//     const file = event.target.files[0];
    
//     if (!file) {
//         return;
//     }
    
//     // Create blob URL for the file
//     const fileURL = URL.createObjectURL(file);
    
//     // Set the video source using Video.js
//     player.src({
//         type: getVideoMimeType(file.name),
//         src: fileURL
//     });
    
//     // Update UI
//     fileNameDisplay.textContent = file.name;
//     updateStatus(`📂 Video loaded. Starting transcription...`, 'success');
    
//     console.log('📁 File selected:', file.name);
//     console.log('📁 File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
//     console.log('📁 File path:', file.path);
    
//     // Start transcription in the background
//     try {
//         updateStatus(`🎙️ Transcribing audio... This may take a minute.`, '');
        
//         // Use Electron's IPC to call main process
//         const { ipcRenderer } = require('electron');


//         //! critical change, replace file path by buffer of file object (which is already mine)
//         const arrayBuffer = await file.arrayBuffer();
//         const buffer = Buffer.from(arrayBuffer);

//         const result = await ipcRenderer.invoke('transcribe-audio', {
//             name: file.name,
//             buffer: buffer
//         });
                
        
//         if (result.success) {
//             console.log('✅ Transcription successful!');
//             console.log('📝 Full text:', result.transcription.text);
//             console.log('📊 Segments:', result.transcription.segments);
            
//             // Process and store subtitles
//             processTranscription(result.transcription);
            
//             updateStatus(`✅ Transcription complete! ${subtitles.length} subtitles generated.`, 'success');
//         } else {
//             console.error('❌ Transcription failed:', result.error);
//             updateStatus(`❌ Transcription failed: ${result.error}`, 'error');
//         }
        
//     } catch (error) {
//         console.error('❌ Error during transcription:', error);
//         updateStatus(`❌ Error: ${error.message}`, 'error');
//     }
// });
videoFileInput.addEventListener('change', async function(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    // Create blob URL for the file
    const fileURL = URL.createObjectURL(file);
    
    // Set the video source using Video.js
    player.src({
        type: getVideoMimeType(file.name),
        src: fileURL
    });
    
    // Update UI
    fileNameDisplay.textContent = file.name;
    updateStatus(`📂 Video loaded. Starting transcription...`, 'success');
    
    console.log('📁 File selected:', file.name);
    console.log('📁 File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('📁 File path:', file.path);
    
    // Start transcription in the background
    try {
        updateStatus(`🎙️ Transcribing audio... This may take a few minutes.`, '');
        
        // Use Electron's IPC to call main process
        const { ipcRenderer } = require('electron');

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await ipcRenderer.invoke('transcribe-audio', {
            name: file.name,
            buffer: buffer
        });
        
        if (result.success) {
            console.log('✅ Transcription successful!');
            console.log('📝 Full text:', result.transcription.text);
            console.log('📊 Segments:', result.transcription.segments);
            
            // =========================================================================
            // SHOW METADATA - NEW!
            // =========================================================================
            if (result.metadata) {
                console.log('⏱️ Duration:', result.metadata.durationMinutes, 'minutes');
                console.log('📦 Original size:', result.metadata.originalSizeMB, 'MB');
                console.log('🎵 Compressed audio size:', result.metadata.compressedSizeMB, 'MB');
                console.log('✂️ Used chunking:', result.metadata.wasChunked ? 'Yes' : 'No');
                
                // Show user-friendly message
                if (result.metadata.wasChunked) {
                    console.log('🎬 This was a long video, so it was processed in 20-minute chunks');
                }
            }
            
            // Process and store subtitles
            processTranscription(result.transcription);
            
            // =========================================================================
            // ENHANCED STATUS MESSAGE - NEW!
            // =========================================================================
            const statusMsg = result.metadata?.wasChunked 
                ? `✅ Transcription complete! ${subtitles.length} subtitles (${result.metadata.durationMinutes} min video, processed in chunks)`
                : `✅ Transcription complete! ${subtitles.length} subtitles generated (${result.metadata?.durationMinutes || '?'} min video)`;
            
            updateStatus(statusMsg, 'success');
            
        } else {
            console.error('❌ Transcription failed:', result.error);
            updateStatus(`❌ Transcription failed: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error('❌ Error during transcription:', error);
        updateStatus(`❌ Error: ${error.message}`, 'error');
    }
});









// =============================================================================
// SUBTITLE DISPLAY FUNCTIONS
// =============================================================================

/**
 * Show subtitle with color
 * 
 * @param {string} text - Subtitle text
 * @param {string} color - Text color (hex)
 */
function showSubtitle(text, color = '#ffffff') {
    subtitleOverlay.textContent = text;
    subtitleOverlay.style.color = color;
    subtitleOverlay.style.display = 'block';
    
    console.log('💬 Showing subtitle:', text);
    console.log('💬 Color:', color);
}

/**
 * Hide subtitle
 */
function hideSubtitle() {
    subtitleOverlay.style.display = 'none';
}

/**
 * Update status message
 * 
 * @param {string} message - Status message
 * @param {string} type - Status type ('success', 'error', or '')
 */
function updateStatus(message, type = '') {
    statusEl.textContent = message;
    statusEl.className = 'status';
    if (type) {
        statusEl.classList.add(type);
    }
}

// =============================================================================
// TEST BUTTONS
// =============================================================================

/**
 * Test single subtitle
 */
testSubtitleBtn.addEventListener('click', function() {
    showSubtitle('This is a test subtitle with Video.js! 🎉', '#00ff00');
    
    setTimeout(function() {
        hideSubtitle();
    }, 3000);
});

/**
 * Test diarization (multiple speakers with different colors)
 */
testDiarizationBtn.addEventListener('click', function() {
    // Speaker 1 (Green)
    showSubtitle('👤 Speaker 1: Hello, how are you doing today?', '#00ff00');
    
    setTimeout(function() {
        // Speaker 2 (Blue)
        showSubtitle('👤 Speaker 2: I\'m doing great! Thanks for asking!', '#00bfff');
    }, 3000);
    
    setTimeout(function() {
        // Speaker 3 (Yellow)
        showSubtitle('👤 Speaker 3: That\'s wonderful to hear!', '#ffff00');
    }, 6000);
    
    setTimeout(function() {
        hideSubtitle();
    }, 9000);
});

// =============================================================================
// INITIALIZE ON PAGE LOAD
// =============================================================================

window.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing Video.js player...');
    initializePlayer();
});

console.log('✅ Renderer script loaded successfully!');


// =============================================================================
// TRANSCRIPTION PROCESSING
// =============================================================================

/**
 * Process transcription from Whisper API
 * Convert segments into subtitle format we can use
 * 
 * @param {Object} transcription - The transcription object from Whisper
 */
function processTranscription(transcription) {
    // Clear any existing subtitles
    subtitles = [];
    currentSubtitleIndex = -1;
    
    if (!transcription.segments || transcription.segments.length === 0) {
        console.warn('⚠️ No segments in transcription');
        return;
    }
    
    // Convert Whisper segments to our subtitle format
    transcription.segments.forEach((segment, index) => {
        // Simulate speaker detection (Whisper API doesn't provide this yet in basic version)
        // In a real implementation, you'd use a diarization service
        // For now, we'll alternate speakers every few segments for demo purposes
        const speakerIndex = Math.floor(index / 2) % 6;  // Rotate through 6 speakers
        const speaker = `SPEAKER_0${speakerIndex}`;
        
        subtitles.push({
            start: segment.start,
            end: segment.end,
            text: segment.text.trim(),
            speaker: speaker,
            color: speakerColors[speaker] || defaultColor
        });
        
        console.log(`💬 Subtitle ${index + 1}:`, {
            time: `${segment.start.toFixed(1)}s - ${segment.end.toFixed(1)}s`,
            speaker: speaker,
            text: segment.text.trim()
        });
    });
    
    console.log(`✅ Processed ${subtitles.length} subtitles!`);
}

// =============================================================================
// SUBTITLE SYNCHRONIZATION
// =============================================================================

/**
 * Check if we should display a subtitle at the current time
 * This is called many times per second by the timeupdate event
 * 
 * @param {number} currentTime - Current video time in seconds
 */
function checkAndDisplaySubtitle(currentTime) {
    // Find the subtitle that should be shown at this time
    let foundSubtitle = null;
    let foundIndex = -1;
    
    for (let i = 0; i < subtitles.length; i++) {
        const subtitle = subtitles[i];
        
        // Check if current time is within this subtitle's time range
        if (currentTime >= subtitle.start && currentTime <= subtitle.end) {
            foundSubtitle = subtitle;
            foundIndex = i;
            break;
        }
    }
    
    // If we found a subtitle and it's different from the current one
    if (foundSubtitle && foundIndex !== currentSubtitleIndex) {
        currentSubtitleIndex = foundIndex;
        showSubtitle(`👤 ${foundSubtitle.speaker}: ${foundSubtitle.text}`, foundSubtitle.color);
        
        console.log(`💬 Showing subtitle ${foundIndex + 1}:`, foundSubtitle.text);
    }
    // If no subtitle found and we were showing one, hide it
    else if (!foundSubtitle && currentSubtitleIndex !== -1) {
        currentSubtitleIndex = -1;
        hideSubtitle();
    }
}