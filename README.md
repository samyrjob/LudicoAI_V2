# LudicoAI_V2 🎬

> Advanced Video Transcription Tool with AI-Powered Subtitles using OpenAI Whisper API

A desktop application built with Electron that transforms video content into accurate, time-synchronized subtitles with intelligent caching and speaker diarization visualization.

---

## ✨ Key Features

- 🎙️ **AI-Powered Transcription** - Uses OpenAI Whisper API for high-accuracy speech-to-text
- ⚡ **Smart Caching System** - Cache transcriptions locally to save API credits on repeat processing
- 📹 **Long Video Support** - Automatic chunking for videos over 45 minutes (20-minute chunks)
- 🎯 **Real-time Subtitle Sync** - Precise timing synchronization with Video.js player
- 👥 **Speaker Diarization** - Visual speaker identification with color-coded subtitles
- 🎮 **Interactive Video Player** - Full-featured video player with standard controls
- 💾 **Efficient Audio Processing** - FFmpeg-powered audio extraction and compression
- 🔧 **Cross-Platform** - Works on Windows, macOS, and Linux

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Main Process  │    │   OpenAI API    │
│   (Video.js)    │◄──►│   (Electron)    │◄──►│   (Whisper)     │
│   - Video Player│    │   - Transcription│    │   - Speech-to-  │
│   - Subtitle UI │    │   - Caching     │    │     Text        │
└─────────────────┘    │   - Audio Proc. │    └─────────────────┘
                       └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   FFmpeg        │
                       │   - Extract     │
                       │   - Compress    │
                       │   - Chunk       │
                       └─────────────────┘
```

---

## 📋 Prerequisites

Before installation, ensure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **FFmpeg** - Required for audio processing
  - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH
  - **macOS**: `brew install ffmpeg`
  - **Linux**: `sudo apt install ffmpeg` (Ubuntu/Debian)
- **OpenAI API Key** - Get from [OpenAI Platform](https://platform.openai.com/api-keys)

---

## 🚀 Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/LudicoAI_V2.git
   cd LudicoAI_V2
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Verify FFmpeg Installation**
   ```bash
   ffmpeg -version
   ```
   If this fails, please install FFmpeg and add it to your system PATH.

---

## 🎯 Usage

1. **Start the Application**
   ```bash
   npm start
   ```

2. **Load a Video**
   - Click "Choose Video File" button
   - Select your video file (.mp4, .mov, .avi, .webm, etc.)
   - The video will load immediately for playback

3. **Automatic Transcription**
   - Transcription starts automatically after video selection
   - First-time processing: Uses OpenAI API credits
   - Subsequent loads: Uses cached version (0 credits used!)

4. **Watch with Subtitles**
   - Play the video using standard controls
   - Subtitles appear automatically with speaker identification
   - Different speakers shown in different colors

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | Your OpenAI API key for Whisper access |

### Video Processing Settings

```javascript
// Configurable in main.js
const CHUNK_DURATION = 1200; // 20 minutes per chunk
const MAX_DURATION_FOR_SINGLE_FILE = 2700; // 45 minutes threshold
```

### Speaker Colors

```javascript
// Customizable in renderer.js
const speakerColors = {
    'SPEAKER_00': '#00ff00',  // Green
    'SPEAKER_01': '#00bfff',  // Blue
    'SPEAKER_02': '#ffff00',  // Yellow
    // Add more colors as needed
};
```

---

## 🔥 Features Breakdown

### 💰 Smart Caching System

The application implements SHA256-based file hashing to identify identical videos:

```javascript
// Automatic cache check
const fileHash = calculateFileHash(buffer);
const cachedResult = getCachedTranscription(fileHash);

if (cachedResult) {
    console.log("✅ FOUND IN CACHE! Using cached transcription (0 API credits used!)");
}
```

**Benefits:**
- Zero API costs for re-processed videos
- Instant loading of previously transcribed content
- Persistent cache across application restarts

### ✂️ Intelligent Video Chunking

For videos longer than 45 minutes:

1. **Automatic Detection** - Duration analysis triggers chunking
2. **20-Minute Segments** - Optimal size for API processing
3. **Seamless Reconstruction** - Timestamps automatically adjusted
4. **Progress Tracking** - Real-time chunk processing updates

### 🎭 Speaker Diarization Visualization

While Whisper API doesn't provide speaker separation, the app simulates this feature:

- **Color-Coded Speakers** - Each speaker gets a unique color
- **Visual Identification** - `👤 SPEAKER_XX:` prefix
- **Smooth Transitions** - Real-time speaker switching during playback

### 🎮 Advanced Video Player

Built on Video.js with custom enhancements:

```javascript
// Real-time subtitle synchronization
player.on('timeupdate', function() {
    const currentTime = player.currentTime();
    if (subtitles.length > 0) {
        checkAndDisplaySubtitle(currentTime);
    }
});
```

---

## 🛠️ Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | ![Electron](https://img.shields.io/badge/Electron-47848F?style=flat&logo=electron&logoColor=white) | Latest | Desktop app framework |
| **Video Player** | ![Video.js](https://img.shields.io/badge/Video.js-000000?style=flat&logo=javascript&logoColor=white) | Latest | Video playback and controls |
| **AI Service** | ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white) | Whisper-1 | Speech-to-text transcription |
| **Audio Processing** | ![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=flat&logo=ffmpeg&logoColor=white) | Latest | Audio extraction/compression |
| **Runtime** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white) | 16+ | JavaScript runtime |

---

## 📁 File Structure

```
LudicoAI_V2/
├── 📄 main.js              # Main Electron process (transcription logic)
├── 📄 renderer.js          # Frontend logic (Video.js integration)
├── 📄 index.html           # Application UI structure
├── 📄 package.json         # Dependencies and scripts
├── 📄 .env                 # Environment variables (create this)
├── 📁 transcription-cache/ # Auto-generated cache directory
│   └── cache.json         # Transcription cache storage
└── 📁 node_modules/       # Dependencies
```

### Key Files Explained

- **`main.js`** - Handles video processing, API calls, caching, and IPC communication
- **`renderer.js`** - Manages Video.js player, subtitle display, and user interactions
- **`index.html`** - Application interface with video player and controls

---

## 🔧 Troubleshooting

### Common Issues

**❌ "OPENAI_API_KEY not found"**
```bash
# Solution: Create .env file with your API key
echo "OPENAI_API_KEY=your_key_here" > .env
```

**❌ "FFmpeg command not found"**
```bash
# Windows: Download FFmpeg and add to PATH
# macOS: brew install ffmpeg
# Linux: sudo apt install ffmpeg
```

**❌ Video won't load**
- Ensure video format is supported (.mp4, .mov, .avi, .webm)
- Check file isn't corrupted
- Try a different video file

**❌ Transcription fails**
- Verify OpenAI API key is valid and has credits
- Check internet connection
- Ensure video has clear audio

### Performance Optimization

**For Large Videos (>1GB):**
- Close other applications to free RAM
- Ensure sufficient disk space for temporary files
- Consider splitting very long videos externally

**For Better Accuracy:**
- Use videos with clear audio
- Minimize background noise
- English language works best (configurable in code)

---

## 🚧 Future Enhancements

Based on the codebase analysis, planned improvements include:

- **🎯 Real Speaker Diarization** - Integration with specialized diarization APIs
- **🌍 Multi-Language Support** - Beyond English transcription
- **📤 Export Options** - SRT, VTT, and other subtitle formats
- **🎨 Customizable Themes** - Player and subtitle styling options
- **⚡ Batch Processing** - Multiple video processing queue
- **📊 Analytics Dashboard** - Usage statistics and accuracy metrics

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the Repository**
2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open Pull Request**

### Development Guidelines

- Follow existing code style and patterns
- Add console logging for debugging
- Test with various video formats
- Update documentation for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙋‍♂️ Support

Having issues? Here's how to get help:

- **📚 Documentation** - Check this README first
- **🐛 Bug Reports** - Open a GitHub issue
- **💡 Feature Requests** - Open a GitHub discussion
- **❓ Questions** - Check existing issues or create new ones

---

<div align="center">

**Made with ❤️ using Electron + Video.js + OpenAI Whisper**

⭐ Star this repo if you find it useful!

</div>

---

*🤖 This README was automatically generated by AI on 2025-11-30T23:00:36.373Z*
