/* ---------------------------------------------------------------------
   Logger module – keeps gaze samples and exports them as CSV (with BOM)
   Filename: [participant]_[level]_[YYYYMMDD].csv
   ------------------------------------------------------------------ */

   let gazeLog     = [];
   let participant = { name: "", level: "" };
   
   /** Kick off a new session */
   export function beginSession(userName, userLevel) {
     participant = { name: userName, level: userLevel };
     gazeLog     = [];
   }
   
   /** Store one gaze sample */
   export function logSample(obj) {
     gazeLog.push(obj);
   }
   
   /** Build the CSV, trigger download with date in filename */
   export function downloadCSV() {
     const header = [
       "x",
       "y",
       "sentenceNumber",
       "sentenceID",  // NEW
       "highlight",
       "word",
       "timeSec"
     ];
     const rows = gazeLog.map(r =>
       [
         r.x,
         r.y,
         r.sentenceNumber,
         r.sentenceId || "",      // NEW (property from gazeTracker)
         r.highlight,
         r.word,
         r.timeSec
       ].join(",")
     );
     const csvText = header.join(",") + "\n" + rows.join("\n");
   
     // Prepend UTF-8 BOM so Excel reads Thai correctly
     const BOM = "\uFEFF";
     const blob = new Blob([BOM + csvText], {
       type: "text/csv;charset=utf-8;"
     });
   
     // Build filename with YYYYMMDD date
     const now = new Date();
     const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
   
     const filename = `${participant.name}_${participant.level}_${dateStr}.csv`;
   
     const a = document.createElement("a");
     a.href = URL.createObjectURL(blob);
     a.download = filename;
     document.body.appendChild(a);
     a.click();
     a.remove();
   }
   