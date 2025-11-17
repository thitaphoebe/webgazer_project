// js/main.js  – tracker dot hidden during reading + fixation dot timing

/* ------------------------------------------------------------------ *
 * Imports                                                            *
 * ------------------------------------------------------------------ */
import { loadSentences } from "./config/sentences.js";
import {
  MAX_SENTENCES,
  FIX_DOT_X,
  FIX_PRE_TIME_MS
} from "./config/constants.js";

import {
  startCalibration,
  recalibrate,
  calibEvents
} from "./modules/calibration.js";

import { renderSentence } from "./modules/renderer.js";

import {
  startTracking,
  setLogging,
  resetSpanCounters
} from "./modules/gazeTracker.js";

import {
  beginSession,
  logSample,
  downloadCSV
} from "./modules/logger.js";

import {
  initUI,
  uiEvents,
  updateProgress
} from "./modules/uiControls.js";

/* ------------------------------------------------------------------ *
 * DOM handles                                                        *
 * ------------------------------------------------------------------ */
const instructions = document.getElementById("instructions");
const sentenceDiv  = document.getElementById("thaiSentence");
const finalScreen  = document.getElementById("finalScreen");
const recalBtn     = document.getElementById("recalBtn");
const userForm     = document.getElementById("userForm");
const trackerDot   = document.getElementById("tracker");  // our red dot
const fixDot       = document.getElementById("fixDot");   // NEW

/* ------------------------------------------------------------------ *
 * Global state                                                       *
 * ------------------------------------------------------------------ */
let participantName   = "";
let level             = "";
let sentencePool      = [];
let currentSentenceNo = 0;  // 1-based
let inRecalibration   = false;

/* Provide current sentence number to gazeTracker */
const getSentenceNumber = () => currentSentenceNo;

/* ------------------------------------------------------------------ *
 * Boot sequence                                                      *
 * ------------------------------------------------------------------ */
startTracking({ getSentenceNumber, logSample });
initUI();
window.addEventListener("load", startCalibration);

/* ------------------------------------------------------------------ *
 * Calibration finished                                               *
 * ------------------------------------------------------------------ */
calibEvents.addEventListener("calibrated", () => {
  if (inRecalibration) {
    // Return from re-calibration → resume reading
    sentenceDiv.style.display  = "block";
    recalBtn.style.display     = "block";
    document.body.classList.add("hide-cursor");
    trackerDot.classList.add("hidden");
    fixDot.style.display       = "none";
    inRecalibration            = false;
    setLogging(true, performance.now());
  } else {
    // First-time calibration done
    instructions.textContent = "กรุณากรอกชื่อแล้วเลือกระดับเพื่อเริ่ม";
    userForm.style.display   = "block";
    document.getElementById("userName").focus();
  }
});

/* ------------------------------------------------------------------ *
 * UI event wiring                                                    *
 * ------------------------------------------------------------------ */
uiEvents.addEventListener("nameEntered", e => {
  participantName = e.detail.name;
});

uiEvents.addEventListener("levelChosen", async e => {
  level = e.detail.level;

  try {
    sentencePool = await loadSentences(level);
  } catch (err) {
    alert("โหลดไฟล์ประโยคไม่สำเร็จ: " + err.message);
    return;
  }

  currentSentenceNo = 1;
  beginSession(participantName, level);
  setLogging(true, performance.now());

  // Reading-mode UI tweaks
  document.body.classList.add("hide-cursor");
  trackerDot.classList.add("hidden");

  presentNextSentence();
});

uiEvents.addEventListener("nextSentence", () => {
  speechSynthesis.cancel();
  fixDot.style.display = "none";       // hide old fixation
  resetSpanCounters();

  currentSentenceNo++;
  if (currentSentenceNo > MAX_SENTENCES) {
    endSession();
  } else {
    presentNextSentence();
  }
});

uiEvents.addEventListener("recalibrate", () => {
  // Pause logging, show pointer & our red dot for calibration
  setLogging(false);
  document.body.classList.remove("hide-cursor");
  trackerDot.classList.remove("hidden");
  fixDot.style.display = "none";

  sentenceDiv.style.display = "none";
  recalBtn.style.display    = "none";
  inRecalibration           = true;
  recalibrate();
});

/* ------------------------------------------------------------------ *
 * Helper functions                                                   *
 * ------------------------------------------------------------------ */
async function presentNextSentence() {
  updateProgress(currentSentenceNo);

  if (sentencePool.length === 0) {
    sentencePool = await loadSentences(level);
  }

  // 1) pick sentence
  const idx      = Math.floor(Math.random() * sentencePool.length);
  const sentence = sentencePool.splice(idx, 1)[0];

  // 2) show fixation dot 1/5 across screen, hide sentence
  fixDot.style.left  = `${FIX_DOT_X * 100}%`;
  fixDot.style.display = "block";
  sentenceDiv.style.display = "none";

  // 3) after 1 s, render sentence; dot stays until Space
  setTimeout(() => {
    renderSentence(sentence, level);
    sentenceDiv.style.display = "block";
  }, FIX_PRE_TIME_MS);
}

function endSession() {
  setLogging(false);

  // UI: closing overlay
  document.body.classList.remove("hide-cursor");
  trackerDot.classList.add("hidden");
  fixDot.style.display       = "none";
  instructions.style.display = "none";
  sentenceDiv.style.display  = "none";
  recalBtn.style.display     = "none";
  finalScreen.style.display  = "block";

  // Save CSV
  downloadCSV();
}
