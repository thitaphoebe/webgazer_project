/* ---------------------------------------------------------------------
   Thai Eye-Tracking Reader
   Centralised tweakable constants
   ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Calibration: 13-point pattern covering corners and horizontal mid-line
 * ------------------------------------------------------------------ */
export const CALIB_POINTS = [
  { x: 0.05, y: 0.05 }, { x: 0.35, y: 0.05 },
  { x: 0.65, y: 0.05 }, { x: 0.95, y: 0.05 },

  { x: 0.05, y: 0.50 }, { x: 0.25, y: 0.50 },
  { x: 0.50, y: 0.50 }, { x: 0.75, y: 0.50 },
  { x: 0.95, y: 0.50 },

  { x: 0.05, y: 0.95 }, { x: 0.35, y: 0.95 },
  { x: 0.65, y: 0.95 }, { x: 0.95, y: 0.95 }
];

/* ------------------------------------------------------------------ *
 * Dwell-time sampling parameters
 * ------------------------------------------------------------------ */
export const DWELL_TIME_MS    = 600;  // ms to collect gaze samples per dot
export const SAMPLE_PERIOD_MS = 50;   // ms between samples during dwell

/* ------------------------------------------------------------------ *
 * Gaze-tracking stability
 * ------------------------------------------------------------------ */
export const SAMPLE_INTERVAL  = 66;   // ms – process gaze ≈15 Hz
export const REQUIRED_SAMPLES = 5;    // consecutive hits before “green” highlight

/* ------------------------------------------------------------------ *
 * Session logic
 * ------------------------------------------------------------------ */
export const MAX_SENTENCES    = 10;   // total sentences per session

/* ------------------------------------------------------------------ *
 * CSS class names (for word highlights)
 * ------------------------------------------------------------------ */
export const HIGHLIGHT_YELLOW = "highlight-yellow";
export const HIGHLIGHT_GREEN  = "highlight-green";

/* ------------------------------------------------------------------ *
 * Speech-synthesis language tag
 * ------------------------------------------------------------------ */
export const SPEECH_LANG      = "th-TH";

/* Minimum acceptable calibration accuracy (%) */
export const ACC_THRESHOLD    = 40;

/* ------------------------------------------------------------------ *
 * Fixation dot
 * ------------------------------------------------------------------ */
export const FIX_DOT_X          = 0.15;   // location of fixation dot from the left edge of screen
export const FIX_PRE_TIME_MS    = 1000;   // dot shown 1 s before sentence

