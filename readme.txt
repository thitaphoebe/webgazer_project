Thai Eye-Tracking Reader — README
A webcam-based tool for word-level gaze logging, pronunciation feedback and instant CSV export

Overview
Thai Eye-Tracking Reader is a pure-HTML / vanilla-JS single-page app for testing or teaching beginning Thai readers.

WebGazer.js tracks gaze with an ordinary webcam.

A fixation dot appears 1 s before each sentence (dot at 20 % of screen width).

Words the reader looks at turn yellow → green; a Thai TTS voice pronounces the green word.

A # end-marker after every sentence advances the experiment automatically when gazed at.

All gaze samples (~15 Hz) are logged to a BOM-encoded CSV named
Name_Grade_YYYYMMDD.csv.

🎬 Live demo
(add GIF / screenshot here)

✨ Key features
Category	Details
Calibration	13-point grid (600 ms dwell, multi-frame average). Forces re-cal if accuracy < 80 %.
Fixation	Black dot appears for 1 s at 20 % screen width, stays during sentence.
Sentence layout	Line starts 24 px to the right of the dot; font auto-shrinks to fit 90 % width.
Highlight logic	X-axis hit-test only.
Yellow on first hit → green after 5 consecutive hits (~330 ms).
End marker	# span appended; as soon as it turns yellow the "nextSentence" event fires automatically.
Feedback	Green word spoken with native Thai voice (falls back gracefully).
Logging	Every processed gaze sample stored: x,y,word,highlight,sentence#,time.
Export	UTF-8 CSV with BOM → Excel shows Thai; file auto-downloads on completion.
UX	Tracker dot & mouse cursor hidden during reading; 🔄 button or auto-prompt triggers re-cal; centred “Data saved — ขอบคุณ” overlay at finish.
Zero deps	No build tools; runs from any static HTTP server.

📁 Folder structure
arduino
Copy
Edit
eye-tracker/
│
├─ index.html
├─ css/
│   └─ style.css
├─ data/
│   ├─ sentences_p1.txt    # one sentence per line (UTF-8)
│   ├─ sentences_p2.txt
│   └─ sentences_p3.txt
├─ js/
│   ├─ config/
│   │   ├─ constants.js      # thresholds, grid, fixation timing
│   │   └─ sentences.js      # async TXT loader + cache
│   ├─ modules/
│   │   ├─ calibration.js
│   │   ├─ renderer.js       # draws sentence + end marker
│   │   ├─ gazeTracker.js    # X-axis hit test, TTS, auto-advance
│   │   ├─ logger.js
│   │   └─ uiControls.js
│   └─ main.js               # orchestration
├─ libs/
│   └─ webgazer.min.js
└─ README.md
⚡ Quick-start
bash
Copy
Edit
git clone https://github.com/yourname/eye-tracker.git
cd eye-tracker
python -m http.server 5500     # or use VS-Code Live Server
Open http://localhost:5500.
(file:// won’t work because WebGazer needs getUserMedia.)

🛠️ Detailed setup
Step	Notes
Allow webcam	Browser prompt on first load.
Thai voice	Chrome/Edge include Google ไทย / Microsoft ไทย. If you hear English accent, install a Thai TTS voice in OS settings.
Lighting	User ~50–70 cm from screen, frontal light.
Stimuli	Edit data/sentences_pX.txt (UTF-8). One line = one sentence; words separated by spaces.

🔄 Workflow
Calibration

Click-hold each red dot (0.6 s).

If measured accuracy < 80 % → auto-retry.

Participant info

Enter Name → choose Grade (ป.1–ป.3).

Trial loop (10 sentences)

Fixation dot appears → 1 s later sentence shows.

Look at words → yellow → green + audio.

When gaze reaches # the next sentence loads automatically.

Finish

CSV downloads automatically.

Closing overlay: “Data saved – Thank you!”

⚙️ Configuration (edit js/config/constants.js)
Const	Default	Description
CALIB_POINTS	13-pt array	Change layout / add points.
DWELL_TIME_MS	600	Hold on each dot.
ACC_THRESHOLD	80	Minimum accuracy %.
FIX_DOT_X	0.20	Fixation dot horizontal position (0–1).
FIX_PRE_TIME_MS	1000	Dot-only time before sentence (ms).
REQUIRED_SAMPLES	5	Green threshold.
MAX_SENTENCES	10	Trials per session.

📈 Data format
Column	Example	Meaning
x,y	734.12	Pixel coords
sentenceNumber	3	1-based
word	น้อง	Thai word; # for end marker
highlight	เหลือง / เขียว / blank	
timeSec	12.34	Seconds since first sentence start

CSV begins with UTF-8 BOM so Excel renders Thai correctly.

🩺 Troubleshooting
Symptom	Fix
Blank webcam / error	Refresh, allow camera, close Zoom/Teams.
“ไม่สามารถคำนวณได้” accuracy	Ensure window.lastGaze updates; add light.
Jittery red dot	Re-calibrate; steady head; try applyKalmanFilter(true).
Garbled Thai in CSV	Check BOM line in logger.js.
Western TTS accent	Install Thai voice, reload page.

🚧 Road-map
Multi-line paragraph mode (vertical gaze).

Calibration heat-map diagnostics.

Web-Bluetooth live stream to phone.

React/Vite rewrite with code-split.

Real-time LSL stream for PsychoPy.

📜 License
Original code MIT.
webgazer.js is GPL-3.0 — see header in libs/webgazer.min.js.

ขอให้สนุกกับการทดลอง!