/* ---------------------------------------------------------------------
   Gaze-tracking module  (X-axis hit-test version)
   ------------------------------------------------------------------ */

   import {
    SAMPLE_INTERVAL,
    REQUIRED_SAMPLES,
    HIGHLIGHT_YELLOW,
    HIGHLIGHT_GREEN,
    SPEECH_LANG
  } from "../config/constants.js";
  import { getWordSpans, clearHighlights } from "./renderer.js";
  import { uiEvents } from "./uiControls.js";
  
  /* ---------- DOM / TTS helpers --------------------------------------- */
  const trackerDot = document.getElementById("tracker");
  
  function pickThaiVoice() {
    const voices = speechSynthesis.getVoices();
    return voices.find(v => v.lang.toLowerCase().startsWith("th"));
  }
  let thaiVoice = pickThaiVoice();
  if (!thaiVoice) {
    speechSynthesis.onvoiceschanged = () => (thaiVoice = pickThaiVoice());
  }
  
  /* ---------- State --------------------------------------------------- */
  const spanCounters = new Map();
  let lastProcess    = 0;
  let loggingEnabled = false;
  let getSentenceNum = () => 0;
  let getSentenceId  = () => "";
  let logger         = () => {};
  let sessionStart   = null;
  let speakEnabled   = true;   // NEW: control TTS per experiment
  
  /* ---------- Public API ---------------------------------------------- */
  export function startTracking(opts = {}) {
    if (opts.getSentenceNumber) getSentenceNum = opts.getSentenceNumber;
    if (opts.getSentenceId)     getSentenceId  = opts.getSentenceId;
    if (opts.logSample)         logger         = opts.logSample;
  
    // NEW: allow experiments to disable speech
    if (typeof opts.enableSpeech === "boolean") {
      speakEnabled = opts.enableSpeech;
    } else {
      speakEnabled = true; // default for main app
    }
  
    /* Disable WebGazer’s built-in red prediction dot */
    webgazer.showPredictionPoints(false);
    webgazer.setGazeListener(onGaze).begin();
  }
  
  export function setLogging(state, startMillis = null) {
    loggingEnabled = state;
    if (state && startMillis !== null) sessionStart = startMillis;
  }
  
  export function resetSpanCounters() {
    spanCounters.clear();
    clearHighlights();
    speechSynthesis.cancel();
  }
  
  /* ---------- Core listener ------------------------------------------- */
  function onGaze(data) {
    if (!data) return;
    window.lastGaze = data; // for calibration
  
    /* move dot */
    trackerDot.style.left = `${data.x - 10}px`;
    trackerDot.style.top  = `${data.y - 10}px`;
  
    if (!loggingEnabled) return;
  
    /* throttle */
    const now = performance.now();
    if (now - lastProcess < SAMPLE_INTERVAL) return;
    lastProcess = now;
  
    /* -------- X-axis hit-test -------- */
    let lookedSpan = null;
    getWordSpans().forEach(span => {
      const r = span.getBoundingClientRect();
  
      /* ONLY check horizontal overlap */
      const inside = data.x >= r.left && data.x <= r.right;
  
      let cnt = spanCounters.get(span) || 0;
  
      if (inside) {
        lookedSpan = span;
        cnt++;
        spanCounters.set(span, cnt);
  
        if (!span.classList.contains(HIGHLIGHT_YELLOW)) {
          span.classList.add(HIGHLIGHT_YELLOW);
  
          // Auto-trigger next sentence if it's the end marker
          if (span.classList.contains("end-marker")) {
            uiEvents.dispatchEvent(new Event("nextSentence"));
            return;
          }
        }
  
        if (
          cnt >= REQUIRED_SAMPLES &&
          !span.classList.contains(HIGHLIGHT_GREEN)
        ) {
          span.classList.replace(HIGHLIGHT_YELLOW, HIGHLIGHT_GREEN);
  
          /* If this span is the sentence-end marker, auto-advance */
          if (span.classList.contains("end-marker")) {
            uiEvents.dispatchEvent(new Event("nextSentence"));
          }
  
          /* Speak the word (marker will just say “#”, which is harmless) */
          if (speakEnabled) {                     // NEW: guard TTS
            const utter = new SpeechSynthesisUtterance(span.textContent);
            utter.lang  = SPEECH_LANG;
            if (thaiVoice) utter.voice = thaiVoice;
            speechSynthesis.speak(utter);
          }
        }
      } else {
        spanCounters.set(span, 0);
        span.classList.remove(HIGHLIGHT_YELLOW, HIGHLIGHT_GREEN);
      }
    });
  
    /* log */
    logger({
      x: data.x.toFixed(2),
      y: data.y.toFixed(2),
      sentenceNumber: getSentenceNum(),
      sentenceId: getSentenceId(),
      word: lookedSpan ? lookedSpan.textContent : "",
      highlight: lookedSpan
        ? lookedSpan.classList.contains(HIGHLIGHT_GREEN)
          ? "เขียว"
          : lookedSpan.classList.contains(HIGHLIGHT_YELLOW)
          ? "เหลือง"
          : ""
        : "",
      timeSec: ((now - sessionStart) / 1000).toFixed(2)
    });
  }
  