/* ---------------------------------------------------------------------
   Thai Eye-Tracking Reader
   Dynamic loader for Thai sentence sets
   ------------------------------------------------------------------ */

   const FILE_MAP = {
    "ป1": "./data/sentences_p1.txt",
    "ป2": "./data/sentences_p2.txt",
    "ป3": "./data/sentences_p3.txt"
  };
  
  const cache = {};               // { level: string[] }
  
  /**
   * Load and return a **fresh copy** of the sentence list for the level.
   * @param  {"ป1"|"ป2"|"ป3"} level
   * @returns {Promise<string[]>}
   */
  export async function loadSentences(level) {
    if (cache[level]) {
      return [...cache[level]];   // return copy
    }
  
    const url = FILE_MAP[level];
    if (!url) throw new Error(`Unknown level: ${level}`);
  
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to load ${url} (${resp.status})`);
    }
  
    /* Split lines, trim, ignore blanks */
    const text  = await resp.text();
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
  
    cache[level] = lines;
    return [...lines];
  }
  // js/config/sentences.js

/**
 * Load a subject-specific list.
 * Expected line format:
 * Sentence<TAB>SentenceID
 *
 * Example:
 * พี่ เขียน บท กลอน\tcorrect_32
 */
export async function loadSubjectWordList(subjectId) {
  const fileName = `data/subjects/${subjectId}.txt`; // e.g. s01.txt
  const res = await fetch(fileName);

  if (!res.ok) {
    throw new Error(`Failed to load ${fileName} (${res.status})`);
  }

  const text = await res.text();

  const items = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(line => {
      // Try TAB first (TSV export). If that fails, fall back to >=2 spaces
      let parts = line.split("\t");
      if (parts.length < 2) {
        parts = line.split(/\s{2,}/); // e.g. "Sentence  SentenceID"
      }
      if (parts.length < 2) return null;

      let [sentence, id] = parts;
      sentence = sentence.trim();
      id       = id.trim();

      // Skip header row like: "Sentence<TAB>SentenceID"
      if (
        /^sentence$/i.test(sentence) &&
        /^sentenceid$/i.test(id)
      ) {
        return null;
      }

      return {
        text: sentence, // e.g. "พี่ เขียน บท กลอน"
        id   // e.g. "correct_32"
      };
    })
    .filter(Boolean);

  return items; // [{ text: "พี่ เขียน บท กลอน", id: "correct_32" }, ...]
}


  