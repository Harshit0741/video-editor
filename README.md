# 🎬 Video Editing Platform – Frontend

## 🚀 Project Overview
This is a fully interactive web-based video editing frontend built with **Next.js App Router**, **Tailwind CSS**, **ShadCN UI**, and **Redux Toolkit**. It allows users to:

- 📤 Upload custom videos
- ✂️ Rearrange scenes and audio
- ✍️ Add subtitles and text overlays
- 🖼️ Add styled image overlays
- 🎥 Preview the edits in real time
- 📥 Export the final version (mock)

---

## 🛠 Tech Stack

- **Next.js** (App Router)
- **React.js**
- **Tailwind CSS**
- **ShadCN UI** (components)
- **Redux Toolkit** (timeline, audio, subtitles state)
- **Convex** – Used for **Authentication** and **Database**

Optional Libraries Used:
- `react-dropzone` – File drag-and-drop upload
- `@dnd-kit` – Timeline rearrangement
- `<video>` tag – Real-time preview player

---

## ⚙️ Setup Instructions

```bash
# 1. Clone the repo
$ git clone https://github.com/yourusername/video-editor-ui.git

# 2. Navigate to the project directory
$ cd video-editor-ui

# 3. Install dependencies
$ npm install

# 4. Run the development server
$ npm run dev

# App will be running at http://localhost:3000
```

---

## 🎥 Demo Video

👉 Watch the full walkthrough here: [Google Drive Demo Video](https://drive.google.com/your-link)

This video includes:
- Interface walkthrough
- Feature demonstrations
- Explanation of Convex integration and creative decisions

---

## ✅ Key Features

### 🔹 Video Upload Section
- Drag-and-drop using React Dropzone
- Simulated progress bar
- Show thumbnail of uploaded video

### 🔹 Timeline Interface
- Horizontal scene strips
- Add/remove segments
- Rearranging via drag-and-drop using `@dnd-kit`

### 🔹 Audio Management
- Static waveform view
- Rearrange/mute segments
- Add background music

### 🔹 Subtitle & Text Overlay
- Subtitle blocks with timing, position, and font
- Text overlay with size, color, animation support

### 🔹 Image Overlay
- Upload draggable/resizable images
- Styling: opacity, border, etc.

### 🔹 Preview & Export
- Real-time preview with `<video>`
- Render button with loading animation
- Simulated download link

---

## 🔒 Convex Integration
- Used **Convex** for user authentication
- Convex database used to store uploaded file metadata, timeline info, and subtitle details

---

## 🧩 Future Enhancements
- Backend integration for actual rendering
- Real-time video processing via FFmpeg/WASM
- Audio waveform visualizer based on real audio

---

> For any issues or contributions, feel free to open an issue or PR!

