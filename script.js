import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

// --- DOM Elements ---
const video       = document.getElementById("webcam");
const catVideo    = document.getElementById("cat-video");
const canvas      = document.getElementById("sticker-canvas");
const ctx         = canvas.getContext("2d", { willReadFrequently: true });
const statusBadge = document.getElementById("status-badge");
const startOverlay = document.getElementById("start-overlay");

// Offscreen canvas untuk memproses green screen
const offscreenCanvas = document.createElement("canvas");
const offCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true });

// --- State ---
let handLandmarker;
let lastVideoTime    = -1;
let isStickerVisible = false;
let animationFrameId = null;
let cats             = [];

// --- Sticker (Cat) Spawn ---
function spawnCat() {
  cats.push({
    x:       Math.random() * (canvas.width  * 0.8),
    y:       Math.random() * (canvas.height * 0.8),
    vx:      (Math.random() - 0.5) * 0.5, // Slight horizontal drift
    vy:      -0.3 - Math.random() * 0.5,   // Constant upward drift
    baseScale: 0.2 + Math.random() * 0.3,
    scale:   0, // Start from 0 for pop-in effect
    opacity: 0,
    state:   "fadingIn",
    timer:   0,
    maxTime: 60 + Math.random() * 40 // Random lifespan
  });
}

// --- Green Screen + Multi-Cat Renderer ---
function processGreenScreen() {
  if (catVideo.paused || catVideo.ended || catVideo.readyState < 2) {
    animationFrameId = requestAnimationFrame(processGreenScreen);
    return;
  }

  // Sync canvas size dengan webcam (pastikan selalu sinkron)
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    syncCanvasSize();
  }

  // Sync offscreen canvas size dengan cat video
  if (offscreenCanvas.width !== catVideo.videoWidth && catVideo.videoWidth > 0) {
    offscreenCanvas.width  = catVideo.videoWidth;
    offscreenCanvas.height = catVideo.videoHeight;
  }

  // Gambar frame cat video ke offscreen canvas
  offCtx.drawImage(catVideo, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

  // Hapus pixel hijau (green screen)
  const frame = offCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  const l = frame.data.length / 4;
  for (let i = 0; i < l; i++) {
    const r = frame.data[i * 4];
    const g = frame.data[i * 4 + 1];
    const b = frame.data[i * 4 + 2];
    if (g > 100 && r < g - 30 && b < g - 30) {
      frame.data[i * 4 + 3] = 0; // transparan
    }
  }
  offCtx.putImageData(frame, 0, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Spawn kucing baru secara acak
  if (isStickerVisible && Math.random() < 0.08 && cats.length < 12) {
    spawnCat();
  }

  // Update & gambar semua kucing
  for (let i = cats.length - 1; i >= 0; i--) {
    const c = cats[i];

    // Update position (Drift)
    c.x += c.vx;
    c.y += c.vy;

    // Update animation state
    if (c.state === "fadingIn") {
      c.opacity += 0.05;
      c.scale += (c.baseScale - c.scale) * 0.1; // Smooth scaling
      if (c.opacity >= 1) { 
        c.opacity = 1; 
        c.scale = c.baseScale;
        c.state = "visible"; 
      }
    } else if (c.state === "visible") {
      c.timer++;
      if (c.timer > c.maxTime) { c.state = "fadingOut"; }
    } else if (c.state === "fadingOut") {
      c.opacity -= 0.03;
      c.scale *= 0.98; // Shrink slightly
      if (c.opacity <= 0) { cats.splice(i, 1); continue; }
    }

    ctx.globalAlpha = c.opacity;
    const drawW = offscreenCanvas.width * c.scale;
    const drawH = offscreenCanvas.height * c.scale;
    
    // Draw with slight shadow for "premium" look
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    
    ctx.drawImage(
      offscreenCanvas,
      c.x, c.y,
      drawW, drawH
    );
    
    ctx.shadowBlur = 0; // Reset shadow
  }
  ctx.globalAlpha = 1.0;

  if (isStickerVisible || cats.length > 0) {
    animationFrameId = requestAnimationFrame(processGreenScreen);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    animationFrameId = null;
  }
}

catVideo.addEventListener("play", () => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(processGreenScreen);
});

// --- Inisialisasi MediaPipe (tanpa GPU delegate agar kompatibel semua platform) ---
async function initializeModels() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
        // delegate sengaja DIHAPUS — "GPU" bisa gagal di banyak hosting/browser
      },
      runningMode: "VIDEO",
      numHands: 2
    });

    statusBadge.innerHTML = `<div class="spinner"></div> Menyalakan Kamera...`;
    startCamera();
  } catch (error) {
    statusBadge.innerHTML = `⚠️ Error Memuat AI`;
    console.error("MediaPipe init error:", error);
  }
}

// --- Akses Webcam ---
async function startCamera() {
  try {
    // Gunakan constraints yang lebih fleksibel
    const constraints = {
      video: {
        facingMode: "user",
        width: { ideal: 1920 }, // Minta kualitas tinggi jika tersedia
        height: { ideal: 1080 }
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    
    video.addEventListener("loadeddata", () => {
      syncCanvasSize();
      predictWebcam();
    });
  } catch (err) {
    statusBadge.innerHTML = `⚠️ Akses Kamera Ditolak`;
    console.error("Camera error:", err);
  }
}

function syncCanvasSize() {
  // Ambil ukuran asli dari feed video kamera
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  
  if (videoWidth > 0) {
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // Update aspek rasio kontainer agar sesuai dengan kamera asli device
    const container = document.querySelector('.video-container');
    container.style.aspectRatio = `${videoWidth} / ${videoHeight}`;
  }
}

// Pantau jika layar diputar atau di-resize
window.addEventListener("resize", syncCanvasSize);
window.addEventListener("orientationchange", () => {
  setTimeout(syncCanvasSize, 500); // Tunggu sebentar sampai rotasi selesai
});

// --- Loop Deteksi Tangan ---
function predictWebcam() {
  if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
    lastVideoTime = video.currentTime;

    const handResults = handLandmarker.detectForVideo(video, performance.now());
    const hasHand = handResults.landmarks.length > 0;

    if (hasHand) {
      if (!isStickerVisible) {
        // Mulai video kucing (suara sudah ada di dalam video)
        catVideo.play().catch(e => console.warn("Video play prevented:", e));
        canvas.classList.add("active");
        isStickerVisible = true;
        spawnCat();
      }
      statusBadge.innerHTML = `Terdeteksi: Tangan 🖐️`;
      statusBadge.classList.add("detected");
    } else {
      if (isStickerVisible) {
        // Hentikan animasi
        isStickerVisible = false;
        cats = [];
        catVideo.pause();
        canvas.classList.remove("active");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      statusBadge.innerHTML = `<div class="spinner"></div> Memindai Tangan...`;
      statusBadge.classList.remove("detected");
    }
  }

  window.requestAnimationFrame(predictWebcam);
}

// --- Start Overlay: klik pertama untuk unlock autoplay ---
startOverlay.addEventListener("click", () => {
  startOverlay.classList.add("hidden");
  initializeModels();
}, { once: true });
