const calibrationPoints = [
  [0.1, 0.1], [0.5, 0.1], [0.9, 0.1],
  [0.1, 0.5], [0.5, 0.5], [0.9, 0.5],
  [0.1, 0.9], [0.5, 0.9], [0.9, 0.9]
];

const totalRounds = 3;
let round = 0;
let pointIndex = 0;
const dot = document.createElement('div');
dot.className = 'calibration-dot';
document.body.appendChild(dot);

function updateInstruction() {
  document.getElementById('calibration-instruction').innerText =
    `คลิกที่จุดเพื่อสอบเทียบ (รอบ ${round + 1}/${totalRounds}, จุด ${pointIndex + 1}/9)`;
}

function showCalibrationDot() {
  const [xRatio, yRatio] = calibrationPoints[pointIndex];
  dot.style.left = `${xRatio * window.innerWidth}px`;
  dot.style.top = `${yRatio * window.innerHeight}px`;
  dot.style.opacity = '1';
  updateInstruction();
}

dot.addEventListener('click', (event) => {
  webgazer.recordScreenPosition(event.clientX, event.clientY, event);
  dot.style.opacity = '0.3';

  pointIndex++;
  if (pointIndex >= calibrationPoints.length) {
    pointIndex = 0;
    round++;
  }

  if (round >= totalRounds) {
    dot.remove();
    document.getElementById('calibration-instruction').remove();
    setTimeout(() => {
      webgazer.getCurrentPrediction().then(prediction => {
        let accuracyMsg = "Accuracy could not be determined.";
        if (prediction && prediction.x !== undefined && prediction.y !== undefined) {
          const screenCenterX = window.innerWidth / 2;
          const screenCenterY = window.innerHeight / 2;
          const dx = prediction.x - screenCenterX;
          const dy = prediction.y - screenCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = Math.sqrt(screenCenterX * screenCenterX + screenCenterY * screenCenterY);
          const accuracyPercent = Math.max(0, 100 - (distance / maxDistance) * 100).toFixed(1);
          accuracyMsg = `Calibration complete!\n\nEstimated accuracy: ${accuracyPercent}%`;
        }
        alert(accuracyMsg);
        document.getElementById('container').style.display = 'block';
      });
    }, 1000);
  } else {
    setTimeout(showCalibrationDot, 300);
  }
});

showCalibrationDot();

// Reading + gaze logic
const wordElements = document.querySelectorAll('#readingText span');
const ping = document.getElementById('pingSound');
let lastWordIndex = null;
let focusStart = null;
let pingedWords = new Set();
let recentPoints = [];
let lastHoveredWordIndex = null;
let lastUpdate = 0;

function smoothGaze(x, y) {
  recentPoints.push({ x, y });
  if (recentPoints.length > 5) recentPoints.shift();
  const avgX = recentPoints.reduce((a, b) => a + b.x, 0) / recentPoints.length;
  const avgY = recentPoints.reduce((a, b) => a + b.y, 0) / recentPoints.length;
  return { x: avgX, y: avgY };
}

function getWordUnderGaze(x, y) {
  for (let i = 0; i < wordElements.length; i++) {
    const rect = wordElements[i].getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return i;
    }
  }
  return null;
}

function updateHighlights(currentIndex) {
  if (lastHoveredWordIndex === currentIndex) return;
  wordElements.forEach(el => {
    el.classList.remove('highlighted');
    el.classList.remove('gaze-on');
  });
  if (currentIndex !== null) {
    wordElements[currentIndex].classList.add('gaze-on');
  }
  lastHoveredWordIndex = currentIndex;
}

function speakWord(word) {
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = 'th-TH';
  const voices = speechSynthesis.getVoices();
  const thaiVoice = voices.find(v => v.lang === 'th-TH');
  if (thaiVoice) utter.voice = thaiVoice;
  speechSynthesis.speak(utter);
}

window.speechSynthesis.onvoiceschanged = () => {
  speechSynthesis.getVoices();
};

webgazer.setGazeListener((data, timestamp) => {
  if (!data || timestamp - lastUpdate < 30) return;
  lastUpdate = timestamp;

  const smoothed = smoothGaze(data.x, data.y);
  const wordIndex = getWordUnderGaze(smoothed.x, smoothed.y);

  updateHighlights(wordIndex);

  if (wordIndex !== null) {
    const currentWord = wordElements[wordIndex];

    if (!pingedWords.has(wordIndex)) {
      ping.currentTime = 0;
      ping.play();
      pingedWords.add(wordIndex);
    }

    if (wordIndex === lastWordIndex) {
      if (!focusStart) focusStart = performance.now();
      const duration = performance.now() - focusStart;

      if (duration > 2000) {
        currentWord.classList.remove('gaze-on');
        currentWord.classList.add('highlighted');
        speakWord(currentWord.innerText);
        focusStart = null;
        pingedWords.delete(wordIndex);
      }
    } else {
      lastWordIndex = wordIndex;
      focusStart = performance.now();
    }
  } else {
    lastWordIndex = null;
    focusStart = null;
    pingedWords.clear();
  }
}).begin();
