// js/modules/calibration.js

import {
  CALIB_POINTS,
  DWELL_TIME_MS,
  SAMPLE_PERIOD_MS,
  ACC_THRESHOLD
} from "../config/constants.js";

/* ---------- DOM handles ---------------------------------------------- */
const instructions = document.getElementById("instructions");
const accuracyDiv  = document.getElementById("accuracy");
const centerDot    = document.getElementById("centerDot");

/* ---------- Event hub ------------------------------------------------ */
export const calibEvents = new EventTarget(); // emits "calibrated"

/* ---------- Internal state ------------------------------------------- */
let clickCompleted = []; // boolean flags per point
let completedDots  = 0;

/* ------------------------------------------------------------------ */
/*   Public API                                                       */
/* ------------------------------------------------------------------ */
export function startCalibration() {
  resetUI();
  buildDotGrid();
}

export const recalibrate = startCalibration;

/* ------------------------------------------------------------------ */
/*   Helpers                                                          */
/* ------------------------------------------------------------------ */
function resetUI() {
  document.querySelectorAll(".calibration").forEach(el => el.remove());
  accuracyDiv.textContent = "";
  instructions.textContent =
    "โปรดแตะและรอที่จุดสีแดงแต่ละจุดจนเปลี่ยนเป็นสีเขียวเพื่อการสอบเทียบ";
  completedDots = 0;
  clickCompleted = [];
}

function buildDotGrid() {
  CALIB_POINTS.forEach((pt, i) => {
    const dot = document.createElement("div");
    dot.className = "calibration";
    dot.style.top  = `${pt.y * 100}%`;
    dot.style.left = `${pt.x * 100}%`;
    document.body.appendChild(dot);

    clickCompleted[i] = false;

    dot.addEventListener("pointerdown", () => {
      if (clickCompleted[i]) return;
      dot.style.background = "orange";
      dot.style.pointerEvents = "none";

      const samples = [];
      const sampler = setInterval(() => {
        const g = window.lastGaze;
        if (g) samples.push({ x: g.x, y: g.y });
      }, SAMPLE_PERIOD_MS);

      setTimeout(() => {
        clearInterval(sampler);

        // Average the collected frames
        const mean = samples.reduce(
          (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
          { x: 0, y: 0 }
        );
        mean.x /= samples.length;
        mean.y /= samples.length;

        // Feed the averaged sample (weight = 1)
        webgazer.recordScreenPosition(mean.x, mean.y, "calib", 1);

        dot.style.background = "green";
        clickCompleted[i] = true;
        completedDots++;

        if (completedDots === CALIB_POINTS.length) {
          allDotsCompleted();
        }
      }, DWELL_TIME_MS);
    });
  });
}

function allDotsCompleted() {
  document.querySelectorAll(".calibration").forEach(el => el.remove());
  instructions.textContent = "กำลังคำนวณความแม่นยำ... มองที่จุดสีน้ำเงิน";
  centerDot.style.display = "block";
  measureAccuracy();
}

function measureAccuracy() {
  const samples = [];
  let ticks = 0;

  const timer = setInterval(() => {
    const g = window.lastGaze;
    if (g) samples.push({ x: g.x, y: g.y });
    if (++ticks > 30) {
      clearInterval(timer);
      centerDot.style.display = "none";

      // Compute numeric accuracy (0–100)
      const pct = calcAccuracy(samples);
      accuracyDiv.textContent = `📏 Accuracy: ${pct.toFixed(2)} %`;

      // Enforce threshold
      if (pct < ACC_THRESHOLD) {
        instructions.textContent =
          `ความแม่นยำต่ำกว่า ${ACC_THRESHOLD}% กรุณาสอบเทียบอีกครั้ง`;
        setTimeout(startCalibration, 1500);
        return; // do not dispatch "calibrated"
      }

      // Good enough → proceed
      calibEvents.dispatchEvent(
        new CustomEvent("calibrated", { detail: { accuracy: pct } })
      );
    }
  }, 100);
}

/** Returns a number 0–100 */
function calcAccuracy(data) {
  if (!data.length) return 0;

  const cx  = window.innerWidth  / 2;
  const cy  = window.innerHeight / 2;
  const max = Math.hypot(cx, cy);

  const avgErr =
    data.reduce((sum, p) => sum + Math.hypot(p.x - cx, p.y - cy), 0) /
    data.length;

  return Math.max(0, 100 - (avgErr / max) * 100);
}
