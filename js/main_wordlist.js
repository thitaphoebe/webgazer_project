// js/main_wordlist.js
// ---------------------------------------------------------------------
// Thai Eye-Tracking Reader – Wordlist/SentenceID Experiment Orchestrator
// Each participant reads a subject-specific list (s01.txt, ...), where
// each line has: Sentence<TAB>SentenceID
// ---------------------------------------------------------------------

import { FIX_DOT_X, FIX_PRE_TIME_MS } from "./config/constants.js";
import { loadSubjectWordList } from "./config/sentences.js";

import {
  startCalibration,
  recalibrate,
  calibEvents
} from "./modules/calibration.js";

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
  renderSentence,
  clearHighlights
} from "./modules/renderer.js";

import {
  initUI,
  uiEvents
} from "./modules/uiControls.js";

/* ---------- DOM handles ---------------------------------------------- */
const instructions = document.getElementById("instructions");
const progressDiv  = document.getElementById("progress");
const userForm     = document.getElementById("userForm");
const finalScreen  = document.getElementById("finalScreen");
const fixDot       = document.getElementById("fixDot");
const sentenceDiv  = document.getElementById("thaiSentence");
const body         = document.body;

/* ---------- Experiment state ----------------------------------------- */
let subjectId        = "";
let wordList         = [];      // [{ text, id }, ...]
let currentIndex     = -1;      // 0-based trial index
let currentSentenceId = "";     // for logging
let sessionStarted   = false;   // logging started

/* ---------- Init ------------------------------------------------------ */
function initExperiment() {
  // Hook up name form, spacebar, recal button, etc.
  initUI();

  // Position fixation dot horizontally based on FIX_DOT_X
  if (fixDot) {
    fixDot.style.left = `${FIX_DOT_X * 100}%`;
  }

  // Start gaze tracking so calibration can see window.lastGaze
   // Start gaze tracking so calibration can see window.lastGaze
   startTracking({
    getSentenceNumber: () => (currentIndex >= 0 ? currentIndex + 1 : 0),
    getSentenceId:     () => currentSentenceId,
    logSample,
    enableSpeech: false          // NEW: disable TTS for this experiment
  });


  // Initial calibration
  startCalibration();

  // Events from calibration module
  calibEvents.addEventListener("calibrated", onCalibrated);

  // Events from UI-controls module
  uiEvents.addEventListener("nameEntered", onNameEntered);
  uiEvents.addEventListener("nextSentence", onNextWordRequested);
  uiEvents.addEventListener("recalibrate", onRecalibrate);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initExperiment);
} else {
  initExperiment();
}

/* ---------- Event handlers ------------------------------------------- */

function onCalibrated(e) {
  const acc = e.detail?.accuracy ?? 0;

  instructions.textContent =
    `การสอบเทียบเสร็จสมบูรณ์ (Accuracy ≈ ${acc.toFixed(1)}%)\n` +
    `กรุณากรอกรหัสผู้เข้าร่วม (เช่น s01 หรือ sub01) ด้านล่าง`;

  // NEW: hide the red gaze dot now that calibration is done
  const tracker = document.getElementById("tracker");
  if (tracker) tracker.style.display = "none";

  if (userForm) {
    userForm.style.display = "block";
  }
}


function onNameEntered(ev) {
  const name = ev.detail?.name?.trim();
  if (!name) return;

  subjectId = name;
  loadWordListForSubject();
}

async function loadWordListForSubject() {
  try {
    instructions.textContent = "กำลังโหลดรายการประโยคสำหรับผู้เข้าร่วม...";

    wordList = await loadSubjectWordList(subjectId); // [{text,id},...]

    if (!wordList.length) {
      instructions.textContent =
        "ไม่พบข้อมูลในไฟล์ของผู้เข้าร่วม โปรดตรวจสอบไฟล์ในโฟลเดอร์ data/subjects/";
      if (userForm) userForm.style.display = "block";
      return;
    }

    // Start logging session with a fixed "WORDLIST" label
    beginSession(subjectId, "WORDLIST");
    currentIndex      = -1;
    currentSentenceId = "";
    sessionStarted    = false;

    // Mark this as wordlist mode for CSS overrides (e.g. no visible green)
    body.classList.add("wordlist-mode");
    body.classList.add("hide-cursor");

    instructions.textContent =
      "โปรดจ้องที่จุดสีดำ เมื่อประโยคปรากฏขึ้นให้ลองอ่านตามปกติ";

    showNextTrial();
  } catch (err) {
    console.error(err);
    instructions.textContent =
      "เกิดข้อผิดพลาดในการโหลดไฟล์ โปรดตรวจสอบชื่อไฟล์และลองใหม่อีกครั้ง";
    if (userForm) userForm.style.display = "block";
  }
}

function onNextWordRequested() {
  showNextTrial();
}

function onRecalibrate() {
  instructions.textContent =
    "กำลังสอบเทียบใหม่ โปรดแตะจุดสีแดงบนหน้าจอแต่ละจุด";
  recalibrate();
}

/* ---------- Trial loop ----------------------------------------------- */

function showNextTrial() {
  currentIndex++;

  // Finished all items
  if (currentIndex >= wordList.length) {
    endSession();
    return;
  }

  // Reset gaze-driven state
  resetSpanCounters();
  clearHighlights();

  const item = wordList[currentIndex];
  currentSentenceId = item.id || "";

  // Update progress label: "ประโยคที่ X / N"
  if (progressDiv) {
    progressDiv.textContent =
      `ประโยคที่ ${currentIndex + 1} / ${wordList.length}`;
  }

  // Show fixation dot first
  if (fixDot) {
    fixDot.style.display = "block";
  }
  if (sentenceDiv) {
    sentenceDiv.style.display = "none";
  }

  // After FIX_PRE_TIME_MS, hide dot and show sentence
  setTimeout(() => {
    if (fixDot) {
      fixDot.style.display = "none";
    }

    // Use a level that does NOT trigger extra per-word margin in renderer.js
    renderSentence(item.text, "WL");   // <-- changed from "ป1" to "WL"

    if (sentenceDiv) {
      sentenceDiv.style.display = "block";
    }

    // Start logging at the moment the first stimulus appears
    if (!sessionStarted) {
      const start = performance.now();
      setLogging(true, start);
      sessionStarted = true;
    }
  }, FIX_PRE_TIME_MS);
}

/* ---------- Session end ---------------------------------------------- */

function endSession() {
  setLogging(false);

  if (sentenceDiv) {
    sentenceDiv.style.display = "none";
  }
  body.classList.remove("hide-cursor");
  body.classList.remove("wordlist-mode");

  instructions.textContent = "การทดลองเสร็จสิ้นแล้ว";
  if (progressDiv) progressDiv.textContent = "";

  // Download CSV with gaze log
  downloadCSV();

  // Show final overlay
  if (finalScreen) {
    finalScreen.style.display = "block";
  }
}
