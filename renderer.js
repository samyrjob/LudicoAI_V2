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
    player.on('timeupdate', function() {
        // From docs: player.currentTime() returns current playback position
        const currentTime = player.currentTime();
        
        // From docs: player.duration() returns total video duration
        const duration = player.duration();
        
        // From docs: player.bufferedPercent() returns buffered percentage
        const bufferedPercent = player.bufferedPercent();
        
        // Update UI
        currentTimeDisplay.textContent = currentTime.toFixed(2);
        durationDisplay.textContent = isFinite(duration) ? duration.toFixed(2) : '0.00';
        bufferedDisplay.textContent = (bufferedPercent * 100).toFixed(0) + '%';
        
        // TODO: In Step 3, we'll check subtitle timestamps here
        // Example logic:
        // checkAndDisplaySubtitle(currentTime);
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
// VIDEO FILE LOADING
// =============================================================================

/**
 * Handle video file selection
 * Using player.src() method from documentation
 */
videoFileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    // Create blob URL for the file
    const fileURL = URL.createObjectURL(file);
    
    // From Video.js docs: player.src() accepts an object or array
    // Object format: { type: 'video/mp4', src: 'url' }
    player.src({
        type: getVideoMimeType(file.name),
        src: fileURL
    });
    
    // Update UI
    fileNameDisplay.textContent = file.name;
    updateStatus(`📂 Loading: ${file.name}...`, '');
    
    console.log('📁 File selected:', file.name);
    console.log('📁 File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('📁 MIME type:', getVideoMimeType(file.name));
    console.log('📁 Blob URL:', fileURL);
});

/**
 * Get MIME type from filename
 * Based on Video.js getMimetype utility from documentation
 * 
 * @param {string} filename - The filename
 * @return {string} The MIME type
 */
function getVideoMimeType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    
    // From Video.js MimetypesKind documentation
    const mimeTypes = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'ogv': 'video/ogg',
        'mov': 'video/mp4',
        'm4v': 'video/mp4',
        'avi': 'video/x-msvideo',
        'mkv': 'video/x-matroska',
        'flv': 'video/x-flv'
    };
    
    return mimeTypes[extension] || 'video/mp4';
}

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