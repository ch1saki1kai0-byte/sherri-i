const envelopeButton = document.getElementById('envelope-button');
const introScreen = document.getElementById('intro-screen');
const mainScreenContainer = document.getElementById('main-container');

/* Open intro */
if (envelopeButton && introScreen && mainScreenContainer) {
  envelopeButton.addEventListener('click', () => {
    introScreen.classList.add('hidden');
    mainScreenContainer.classList.remove('hidden');
    mainScreenContainer.classList.add('fade-in');

    setTimeout(() => {
      mainScreenContainer.classList.remove('fade-in');
    }, 500);
  });
}

/* Player elements */
const btnLoop = document.getElementById('btn-loop');
const btnPrev = document.getElementById('btn-prev');
const btnPlay = document.getElementById('btn-play');
const btnNext = document.getElementById('btn-next');
const btnVol = document.getElementById('btn-vol');
const progress = document.getElementById('progress');
const audio = document.getElementById('audio-player');
const imageHolder = document.getElementById('image-holder');
const songArtist = document.getElementById('song-artist');
const volumeControl = document.getElementById('volume-control');
const volDown = document.getElementById('vol-down');
const volUp = document.getElementById('vol-up');
const volumeRange = document.getElementById('volume-range');

const defaultImg = 'imgs/img-place.png';
const fallbackMcs = ['imgs/mc1.png', 'imgs/mc2.png', 'imgs/mc3.png'];

/* Playlist built from your audio/ folder - update entries if filenames differ */
const playlist = [
  { src: 'audio/Mac DeMarco - No Other Heart.mp3', title: 'No Other Heart', artist: 'Mac DeMarco', img: 'imgs/mc1.png' },
  { src: 'audio/IV OF SPADES - Captivated.mp3', title: 'Captivated', artist: 'IV OF SPADES', img: 'imgs/mc2.png' },
  { src: 'audio/IV OF SPADES - Kabisado.mp3', title: 'Kabisado', artist: 'IV OF SPADES', img: 'imgs/mc3.png' },
  { src: 'audio/Los Retros - Someone To Spend Time With.mp3', title: 'Someone To Spend Time With', artist: 'Los Retros', img: 'imgs/mc1.png' },
  { src: 'audio/Mac DeMarco - My Kind Of Woman .mp3', title: 'My Kind Of Woman', artist: 'Mac DeMarco', img: 'imgs/mc2.png' },
  { src: 'audio/WALTZ OF FOUR LEFT FEET- SHIREBOUND AND BUSKING.mp3', title: 'Waltz of Four Left Feet', artist: 'shirebound', img: 'imgs/mc1.png' },
  { src: 'audio/Antukin - Rico Blanco.mp3', title: 'Antukin', artist: 'Rico Blanco', img: 'imgs/mc1.png' },
  { src: 'audio/Orange & Lemons - Yakap Sa Dilim.mp3', title: 'Yakap Sa Dilim', artist: 'Orange & Lemons', img: 'imgs/mc2.png' },
  { src: 'audio/The 1975 - About You.mp3', title: 'About You', artist: 'The 1975', img: 'imgs/mc3.png' },
  { src: 'audio/pahintulot - shirebound.mp3', title: 'Pahintulot', artist: 'shirebound', img: 'imgs/mc2.png' },
  { src: 'audio/wave to earth - seasons.mp3', title: 'seasons', artist: 'wave to earth', img: 'imgs/mc3.png' }
];

// Add your recordings to audio/recordings/ and list them here.
const recordingPlaylist = [
  // { src: 'audio/recordings/your-recording.mp3', title: 'A song for you', artist: 'My recording', img: 'imgs/img-place.png' }
];

// Add photos here when you are ready; each photo needs a path and a caption.
const memoryPhotos = [
  // { src: 'imgs/memories/photo-1.jpg', caption: 'A favorite memory' }
];

let activePlaylist = playlist;
let currentIndex = 0;
let isPlaying = false;
let isLoop = false;
let slideshowInterval = null;
// simple cache to track which images are loaded or failed
const imageCache = Object.create(null);

function preloadImages() {
  const seen = new Set();
  (playlist || []).forEach((t) => {
    const src = (t && t.img) ? t.img : defaultImg;
    if (seen.has(src)) return;
    seen.add(src);
    const img = new Image();
    img.onload = () => { imageCache[src] = true; };
    img.onerror = () => { imageCache[src] = false; };
    img.src = encodeURI(src);
  });
  // also preload the mc fallback images
  fallbackMcs.forEach((m) => {
    if (seen.has(m)) return;
    seen.add(m);
    const im = new Image();
    im.onload = () => { imageCache[m] = true; };
    im.onerror = () => { imageCache[m] = false; };
    im.src = encodeURI(m);
  });
}

// start preloading right away
preloadImages();

function loadTrack(index) {
  const track = activePlaylist[index];
  if (!track) return;
  audio.src = encodeURI(track.src);
  // show preloaded image immediately when available, otherwise use
  // the safe loader which will fall back to the placeholder on error
  // prefer track's image when valid; otherwise use a rotating mc fallback
  const trackImg = track.img;
  const mcFallback = fallbackMcs[index % fallbackMcs.length];
    if (trackImg && imageCache[trackImg] === true) {
    if (imageHolder) imageHolder.src = trackImg;
  } else if (trackImg && imageCache[trackImg] === false) {
    // track image is known-bad -> use mc fallback
    if (imageHolder) imageHolder.src = (imageCache[mcFallback] === true) ? mcFallback : defaultImg;
  } else if (trackImg) {
    // unknown status for track image: try it, but fall back to mc on error
    if (imageHolder) safeSetImage(trackImg, mcFallback);
    // ensure mc fallback is preloaded/shown if trackImg fails asynchronously
    // safeSetImage will handle fallback to defaultImg; so also start preloading mcFallback
    if (!imageCache[mcFallback]) {
      const p = new Image();
      p.onload = () => { imageCache[mcFallback] = true; };
      p.onerror = () => { imageCache[mcFallback] = false; };
      p.src = encodeURI(mcFallback);
    }
  } else {
    // no track image: show mc fallback (or default if mc missing)
    if (imageHolder) imageHolder.src = (imageCache[mcFallback] === true) ? mcFallback : defaultImg;
  }
  songArtist.textContent = `${track.title} - ${track.artist}`;
  progress.value = 0;
}

/* Safely set image with onerror fallback to placeholder */
function safeSetImage(src) {
  if (!imageHolder) return;
  const tester = new Image();
  const fallback = arguments.length > 1 ? arguments[1] : defaultImg;
  tester.onload = () => { imageHolder.src = src; };
  tester.onerror = () => {
    console.warn('Image failed to load:', src, ' — falling back to', fallback);
    imageHolder.src = fallback;
  };
  tester.src = encodeURI(src);
}

function playTrack() {
  if (!activePlaylist[currentIndex]) return;
  audio.play();
  isPlaying = true;
  btnPlay.classList.add('playing');
  if (btnPlay) btnPlay.src = 'imgs/btn-pause.png';
}

function pauseTrack() {
  audio.pause();
  isPlaying = false;
  btnPlay.classList.remove('playing');
  if (btnPlay) btnPlay.src = 'imgs/btn-play.png';
}

function togglePlay() {
  if (!audio.src) loadTrack(currentIndex);
  if (audio.paused) playTrack(); else pauseTrack();
}

function nextTrack() {
  if (!activePlaylist.length) return;
  currentIndex = (currentIndex + 1) % activePlaylist.length;
  loadTrack(currentIndex);
  if (isPlaying) playTrack();
}

function prevTrack() {
  if (!activePlaylist.length) return;
  currentIndex = (currentIndex - 1 + activePlaylist.length) % activePlaylist.length;
  loadTrack(currentIndex);
  if (isPlaying) playTrack();
}

function selectMusicCategory(category) {
  const categoryNote = document.getElementById('category-note');
  const selectedPlaylist = category === 'recordings' ? recordingPlaylist : playlist;
  if (!selectedPlaylist.length) {
    categoryNote.textContent = 'No recordings have been added yet. Your current song will keep playing.';
    return;
  }

  if (selectedPlaylist === activePlaylist) {
    categoryNote.textContent = '';
    document.querySelectorAll('.category-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });
    return;
  }

  const wasPlaying = !audio.paused;
  activePlaylist = selectedPlaylist;
  currentIndex = 0;
  document.querySelectorAll('.category-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.category === category);
  });

  categoryNote.textContent = '';
  loadTrack(currentIndex);
  if (wasPlaying) playTrack();
}

document.querySelectorAll('.category-tab').forEach((tab) => {
  tab.addEventListener('click', () => selectMusicCategory(tab.dataset.category));
});

document.querySelectorAll('.section-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.section-tab').forEach((sectionTab) => {
      sectionTab.classList.toggle('active', sectionTab === tab);
    });
    document.querySelectorAll('.page-section').forEach((section) => {
      section.classList.toggle('hidden', section.id !== tab.dataset.section);
    });
  });
});

const photoGallery = document.getElementById('photo-gallery');
const photoPlaceholder = document.getElementById('photo-placeholder');
if (photoGallery && memoryPhotos.length) {
  memoryPhotos.forEach((photo) => {
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    const caption = document.createElement('figcaption');

    image.src = encodeURI(photo.src);
    image.alt = photo.caption;
    caption.textContent = photo.caption;
    figure.append(image, caption);
    photoGallery.append(figure);
  });
  photoPlaceholder.classList.add('hidden');
}

const letterToggle = document.getElementById('letter-toggle');
const letterClose = document.getElementById('letter-close');
const letterContent = document.getElementById('letter-content');
const letterReveal = document.getElementById('letter-reveal');
const letterSection = document.getElementById('letter-section');
let letterCloseTimer;
function finishLetterClose() {
  clearTimeout(letterCloseTimer);
  letterContent.classList.add('hidden');
  letterContent.classList.remove('closing');
  letterReveal.classList.remove('is-open');
  letterSection.classList.remove('is-open');
  letterClose.disabled = false;
}

function closeLetter() {
  letterToggle.setAttribute('aria-expanded', 'false');
  letterClose.disabled = true;
  letterContent.classList.add('closing');
  letterCloseTimer = setTimeout(() => {
    if (letterContent.classList.contains('closing')) {
      finishLetterClose();
    }
  }, 320);
}

if (letterToggle && letterClose && letterContent && letterReveal && letterSection) {
  letterToggle.addEventListener('click', () => {
    clearTimeout(letterCloseTimer);
    letterContent.classList.remove('closing', 'hidden');
    letterClose.disabled = false;
    letterReveal.classList.add('is-open');
    letterSection.classList.add('is-open');
    letterToggle.setAttribute('aria-expanded', 'true');
  });
  letterClose.addEventListener('click', closeLetter);
  letterContent.addEventListener('animationend', (event) => {
    if (event.target === letterContent && event.animationName === 'letterClose') {
      finishLetterClose();
    }
  });
}

const birthdayVideo = document.getElementById('birthday-video');
const videoPlaceholder = document.getElementById('video-placeholder');
if (birthdayVideo && videoPlaceholder) {
  birthdayVideo.addEventListener('loadedmetadata', () => {
    birthdayVideo.classList.remove('hidden');
    videoPlaceholder.classList.add('hidden');
  });
  birthdayVideo.addEventListener('error', () => {
    birthdayVideo.classList.add('hidden');
    videoPlaceholder.classList.remove('hidden');
  });
}

function toggleLoop() {
  isLoop = !isLoop;
  audio.loop = isLoop;
  if (btnLoop) btnLoop.classList.toggle('active', isLoop);
}

function toggleMute() {
  // old mute behavior retained for backward compatibility
  audio.muted = !audio.muted;
  if (btnVol) btnVol.classList.toggle('muted', audio.muted);
}

/* Volume control behavior (increase/decrease and range) */
function showVolumeControl() {
  if (!volumeControl) return;
  volumeControl.classList.toggle('hidden');
}

function setVolume(v) {
  const normalized = Math.max(0, Math.min(1, v));
  audio.volume = normalized;
  if (normalized > 0 && audio.muted) {
    audio.muted = false;
    if (btnVol) btnVol.classList.remove('muted');
  }
  if (volumeRange) volumeRange.value = normalized;
}

function changeVolume(delta) {
  setVolume(audio.volume + delta);
}

if (btnVol) btnVol.addEventListener('click', showVolumeControl);
if (volDown) volDown.addEventListener('click', () => changeVolume(-0.1));
if (volUp) volUp.addEventListener('click', () => changeVolume(0.1));
if (volumeRange) volumeRange.addEventListener('input', (e) => { setVolume(parseFloat(e.target.value)); });

[
  [btnLoop, toggleLoop],
  [btnPrev, prevTrack],
  [btnPlay, togglePlay],
  [btnNext, nextTrack],
  [btnVol, showVolumeControl]
].forEach(([button, action]) => {
  if (!button) return;
  button.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  });
});

/* Update progress UI */
function updateProgress() {
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  progress.value = percent;
}

/* Slideshow of mc1/mc2/mc3 while playing */
function startSlideshow() {
  stopSlideshow();
  // only slideshow for first three images
  const imgs = ['imgs/mc1.png','imgs/mc2.png','imgs/mc3.png'];
  let i = 0;
  slideshowInterval = setInterval(() => {
    // try load, fallback handled by safeSetImage
    safeSetImage(imgs[i % imgs.length], defaultImg);
    i++;
  }, 1500);
}

function stopSlideshow() {
  if (slideshowInterval) { clearInterval(slideshowInterval); slideshowInterval = null; }
  // restore current track art
  const t = activePlaylist[currentIndex];
  if (!t) return;
  const mcFallback = fallbackMcs[currentIndex % fallbackMcs.length];
  safeSetImage((t && t.img) ? t.img : mcFallback, mcFallback);
}

function seekTo(value) {
  if (!audio.duration) return;
  audio.currentTime = (value / 100) * audio.duration;
}

/* Event listeners */
if (btnPlay) btnPlay.addEventListener('click', togglePlay);
if (btnNext) btnNext.addEventListener('click', nextTrack);
if (btnPrev) btnPrev.addEventListener('click', prevTrack);
if (btnLoop) btnLoop.addEventListener('click', toggleLoop);

if (progress) {
  // allow dragging to seek
  progress.addEventListener('input', (e) => {
    seekTo(e.target.value);
  });
  // clicking / pointerup also seeks
  progress.addEventListener('change', (e) => {
    seekTo(e.target.value);
  });
}

if (audio) {
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('error', (ev) => {
    console.error('Audio failed to load/play:', audio.currentSrc || audio.src, ev);
    // show user-friendly console hint with network state
    console.error('NetworkState:', audio.networkState, 'ReadyState:', audio.readyState);
  });
  audio.addEventListener('ended', () => {
    if (!audio.loop) {
      // advance to next track and ensure playback continues
      nextTrack();
      // Some browsers dispatch a 'pause' before 'ended', which can
      // set `isPlaying` false — force a play to continue the queue.
      try {
        playTrack();
      } catch (e) {
        // play() might return a promise that rejects in some contexts;
        // swallowing errors keeps behavior graceful in deployments.
        console.warn('Auto-play of next track failed:', e);
      }
    }
  });
  audio.addEventListener('play', () => { 
    if (btnPlay) btnPlay.classList.add('playing'); 
    if (btnPlay) btnPlay.src = 'imgs/btn-pause.png';
    isPlaying = true; 
    startSlideshow(); 
  });
  audio.addEventListener('pause', () => { 
    if (btnPlay) btnPlay.classList.remove('playing'); 
    if (btnPlay) btnPlay.src = 'imgs/btn-play.png';
    isPlaying = false; 
    stopSlideshow(); 
  });
}

/* Initialize first track (does not auto-play) */
loadTrack(currentIndex);

/* Helpful note in console where to replace album placeholder image */
console.log('To replace album placeholder image, edit imgs/img-place.png or change playlist[i].img in script.js');