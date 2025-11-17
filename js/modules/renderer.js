/* ---------------------------------------------------------------------
   Renderer module – draws the current sentence and adapts the font size
   until the whole line fits the viewport.
   ------------------------------------------------------------------ */

import {
  HIGHLIGHT_YELLOW,
  HIGHLIGHT_GREEN,
  FIX_DOT_X
} from "../config/constants.js";

/* ---------- DOM handle ------------------------------------------------- */
const sentenceDiv = document.getElementById("thaiSentence");
const END_MARK = "#";               // or "♦"

/* ------------------------------------------------------------------ */
/*   Public API                                                       */
/* ------------------------------------------------------------------ */

/**
 * Render one sentence to the centre of the screen.
 * @param {string} sentence  – words must be separated by spaces
 * @param {string} level     – "ป1" | "ป2" | "ป3" (affects word spacing)
 */
export function renderSentence(sentence, level) {
  sentenceDiv.style.position = "fixed";
  sentenceDiv.style.top  = "50%";          // same vertical mid-point
  sentenceDiv.style.left = `calc(${FIX_DOT_X * 100}% + 24px)`; // 24 px gap
  sentenceDiv.style.transform = "translateY(-50%)";            // only Y
  
 sentenceDiv.innerHTML = "";

 // 1. regular words
 sentence.trim().split(" ").forEach(word => {
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = word;

    /* Younger grades get wider spacing for readability. */
    if (level === "ป1") {
      span.style.margin = "0 20px";
    }

    sentenceDiv.appendChild(span);
  });
  
 // 2. add end-marker span
 const end = document.createElement("span");
 end.className = "word end-marker";   // extra class for tracker
 end.textContent = END_MARK;
 sentenceDiv.appendChild(end);

  /* Make sure everything fits in one line. */
  shrinkToFit();
  sentenceDiv.style.display = "block";
}

/**
 * Return a live NodeList of all word `<span>` elements.
 * (Used by the gaze-tracking module.)
 */
export function getWordSpans() {
  return sentenceDiv.querySelectorAll(".word");
}

/* ------------------------------------------------------------------ */
/*   Helpers                                                          */
/* ------------------------------------------------------------------ */

/* Decrease font size until the line fits within 90 % of viewport width. */
function shrinkToFit() {
  let size = 100;
  sentenceDiv.style.fontSize = size + "px";

  while (sentenceDiv.scrollWidth > window.innerWidth * 0.9 && size > 10) {
    size -= 2;
    sentenceDiv.style.fontSize = size + "px";
  }
}

/* Utility to clear highlight classes (invoked when moving to next sentence). */
export function clearHighlights() {
  getWordSpans().forEach(span =>
    span.classList.remove(HIGHLIGHT_YELLOW, HIGHLIGHT_GREEN)
  );
}
