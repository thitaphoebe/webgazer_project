/* ---------------------------------------------------------------------
   UI-controls module – handles name & level forms, progress display,
   Space-bar navigation, and the re-calibration button.  Communicates
   with the rest of the app through an EventTarget.
   ------------------------------------------------------------------ */

import { MAX_SENTENCES } from "../config/constants.js";

export const uiEvents = new EventTarget(); // 'nameEntered', 'levelChosen', 'nextSentence', 'recalibrate'

/* ---------- DOM handles ---------------------------------------------- */
const userForm     = document.getElementById("userForm");
const nameInput    = document.getElementById("userName");
const submitBtn    = document.getElementById("submitNameBtn");

const levelSelect  = document.getElementById("levelSelect");
const progressDiv  = document.getElementById("progress");
const recalBtn     = document.getElementById("recalBtn");
const sentenceDiv  = document.getElementById("thaiSentence");

/* ---------- Init ------------------------------------------------------ */
export function initUI() {
  /* --- participant name form --- */
  submitBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) return;
    userForm.style.display = "none";

    uiEvents.dispatchEvent(
      new CustomEvent("nameEntered", { detail: { name } })
    );

    levelSelect.style.display = "block";
  });

  /* --- level buttons --- */
  levelSelect.querySelectorAll("button").forEach(btn =>
    btn.addEventListener("click", () => {
      const level = btn.dataset.level;
      levelSelect.style.display = "none";
      recalBtn.style.display    = "block";

      uiEvents.dispatchEvent(
        new CustomEvent("levelChosen", { detail: { level } })
      );
    })
  );

  /* --- Spacebar advances sentences --- */
  document.addEventListener("keydown", e => {
    if (
      e.code === "Space" &&
      sentenceDiv.style.display !== "none"
    ) {
      e.preventDefault(); // stop page scroll
      uiEvents.dispatchEvent(new Event("nextSentence"));
    }
  });

  /* --- Re-calibration button --- */
  recalBtn.addEventListener("click", () =>
    uiEvents.dispatchEvent(new Event("recalibrate"))
  );
}

/* ---------- Progress helper ------------------------------------------ */
export function updateProgress(current /* 1-indexed */) {
  if (current > MAX_SENTENCES) {
    progressDiv.textContent = "";
  } else {
    progressDiv.textContent = `ประโยคที่ ${current} / ${MAX_SENTENCES}`;
  }
}
