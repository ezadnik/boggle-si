/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Local dictionary of common Boggle-friendly Slovenian words for highly accurate offline verification and startup file initialization
const SLOVENIAN_DICTIONARY = [
  "DOM", "MAMA", "DELO", "STOL", "ROKA", "VODA", "ZIMA", "SONCE", "TRAVA", "KRUH", "PISMO", 
  "KAVA", "AVTO", "MESTO", "KOLO", "LES", "SADJE", "SIR", "SVAR", "LUKA", "RIBA", "SESTRA",
  "BRAT", "DRUŽINA", "LJUBEZEN", "SNEK", "ČAJ", "ŠOLA", "ŽABA", "URA", "LUČ", "PIVO", "VINO",
  "HIŠA", "MIZA", "VRATA", "OKNO", "STENA", "STROP", "TLA", "KLJUČ", "BRAVA", "KUHA", "LONEC",
  "ŽLICA", "VILICA", "NOŽ", "KROŽNIK", "PEČ", "MLEKO", "MASLO", "JAJCE", "MOKA",
  "SLADKOR", "SOL", "KIP", "POTOK", "REKA", "JEZERO", "MORJE", "GORA", "HRIB", "DOL", "DOLEC",
  "GOZD", "DREVO", "VEJA", "LIST", "TRAVNIK", "CVET", "ROŽA", "ZEMLJA", "KAMEN", "PESEK", "GLINA",
  "KOVANEC", "ZLATO", "SREBRO", "ŽELEZO", "BAKER", "BRON", "SVINČNIK", "MAČKA", "PES", "KONJ", "KRAVA",
  "BREG", "POT", "CESTA", "STEZA", "KORAK", "TEK", "SKOK", "LET", "POTNIK", "AVTOBUS",
  "VLAK", "MOPED", "ZRAK", "VETER", "OBLAK", "DEŽ", "SNEG", "TOČA", "MEGLA", "LUNA", "ZVEZDA",
  "DAN", "NOČ", "JUTRO", "VEČER", "OPOLDNE", "SREDA", "ČETRTEK", "PETEK", "SOBOTA", "TEDEN", "MESEC",
  "LETO", "ČAS", "DEDEK", "BABICA", "OČE", "MATI", "SIN", "HČI", "STRIČEK", "TETA", "NEČAK", "VNUK",
  "SOSED", "PRIJATELJ", "MOŽ", "ŽENA", "OTROK", "FANT", "PUNCA", "DEKLE", "MOŠKI", "ŽENSKA", "LJUDJE",
  "TELO", "GLAVA", "LAS", "OBRAZ", "OČI", "UHO", "NOS", "USTA", "ZOB", "JEZIK", "VRAT", "RAME", "PRSI",
  "SRCE", "PLUČA", "TREBUH", "NOGA", "PRST", "KOŽA", "KRI", "KOST", "UM", "DUH", "VOLJA", "MOČ",
  "ZDRAVJE", "BOLEZEN", "ZDRAVNIK", "BOLNICA", "ZDRAVILO", "LEK", "LEKARNA", "RAZRED", "KLOP", "TABLA",
  "KNJIGA", "PISALNIK", "ZVEZEK", "PERO", "ČRNILO", "RAČUNALNIK", "MREŽA", "SLIKA", "IGRA", "BOGGLE",
  "KOCKA", "ČRKA", "ZNAK", "GLAS", "BESEDA", "JEZIK", "PREVOD", "MILO", "KOPEL", "PRANJE", "BRISAČA",
  "ČAKALNICA", "STANOVANJE", "BLOK", "GARAŽA", "KLET", "PODSTREŠJE", "SOBA", "KUHINJA", "SPALNICA", "KOPALNICA",
  "PISARNA", "TRG", "ULICA", "PARK", "MOST", "GRAD", "CERKEV", "HRANA", "PIJAČA", "KOLAČ", "TORTA", "MESO",
  "ZELJE", "KROMPIR", "SADJE", "JABOLKO", "HRUŠKA", "SLIVA", "GROZDJE", "KOPALNIK", "SOLATA", "PIŠČANEC", "JUHA",
  "ZAKON", "PRAVDA", "SODNIK", "ODVETNIK", "SPLOŠNO", "SLOVENSKO", "KNJIŽEVNO", "SPRAVA", "DELATI", "GRADITI",
  "STROJ", "KLEPET", "ZID", "KAMEN", "OPEKA", "MALTA", "DESKA", "TESAR", "KRAST", "SMRK", "BOR", "HRAST", "BUKVA",
  "JELKA", "LIPA", "GABER", "JASEN", "VRBA", "ČREŠNJA", "VIŠNJA", "MAH", "GOBA", "KOREN", "PŠENICA", "RŽ", "JEČMEN",
  "OVES", "KORUZA", "ČEBELA", "POLJE", "ROMAN", "SOK"
];

// Memory-resident comprehensive Slovenian wordlist load System with Disc Persistent fallback
const slovenskiWordlistSet = new Set<string>();
let isWordlistLoaded = false;

function initializeWordlistFile() {
  const filePath = path.join(process.cwd(), "slovenian-wordlist.txt");
  if (!fs.existsSync(filePath)) {
    console.log("Local slovenian-wordlist.txt not found. Generating from local sources...");
    const wordsSet = new Set<string>();
    
    // 1. Add words from SLOVENIAN_DICTIONARY
    SLOVENIAN_DICTIONARY.forEach(w => wordsSet.add(w.toLowerCase().trim()));
    
    // 2. Extract words from App.tsx SLOVENIAN_WORDS array if it exists
    try {
      const appTsxPath = path.join(process.cwd(), "src/App.tsx");
      if (fs.existsSync(appTsxPath)) {
        const content = fs.readFileSync(appTsxPath, "utf-8");
        const match = content.match(/const SLOVENIAN_WORDS\s*=\s*\[([\s\S]*?)\];/);
        if (match && match[1]) {
          const rawItems = match[1].split(",");
          rawItems.forEach(item => {
            const clean = item.replace(/["'\r\n\t\s]/g, "").trim().toLowerCase();
            if (clean && !clean.startsWith("//") && clean.length >= 3) {
              wordsSet.add(clean);
            }
          });
        }
      }
    } catch (e: any) {
      console.error("Failed to extract words from App.tsx:", e.message);
    }

    // 3. Extract words from Android assets/besede.txt if it exists
    try {
      const androidBesedePath = path.join(process.cwd(), "android/app/src/main/assets/besede.txt");
      if (fs.existsSync(androidBesedePath)) {
        console.log("Loading words from android assets besede.txt into slovenian-wordlist...");
        const content = fs.readFileSync(androidBesedePath, "utf-8");
        const lines = content.split(/\r?\n/);
        lines.forEach(line => {
          const clean = line.trim().toLowerCase();
          if (clean && clean.length >= 3) {
            wordsSet.add(clean);
          }
        });
      }
    } catch (e: any) {
      console.error("Failed to load words from android assets besede.txt:", e.message);
    }
    
    const wordsArray = Array.from(wordsSet).sort();
    fs.writeFileSync(filePath, wordsArray.join("\n"), "utf-8");
    console.log(`Generated local slovenian-wordlist.txt with ${wordsArray.length} words.`);
  }
}

async function loadSlovenianWordlist() {
  try {
    // Stage A: Ensure local slovenian-wordlist.txt is present
    initializeWordlistFile();

    // Stage B: Load from local disk using Node.js fs module as strictly requested
    const filePath = path.join(process.cwd(), "slovenian-wordlist.txt");
    console.log(`Loading local Slovenian wordlist from: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split(/\r?\n/);
    
    let localCount = 0;
    lines.forEach(line => {
      const clean = line.trim().toLowerCase();
      if (clean) {
        slovenskiWordlistSet.add(clean);
        localCount++;
      }
    });

    isWordlistLoaded = true;
    console.log(`TIER 1 Fast Cache loaded: ${slovenskiWordlistSet.size} unique words loaded from local disk!`);

    // Stage C: Enrich memory cache with remote words asynchronously in background
    enrichWordlistFromRemote();
  } catch (err: any) {
    console.error("Critical: Failed to load local wordlist file:", err.message);
  }
}

async function enrichWordlistFromRemote() {
  const URLs = [
    "https://raw.githubusercontent.com/comorand/slovenian-wordlist/main/slovenian-wordlist.txt",
    "https://raw.githubusercontent.com/comorand/slovenian-wordlist/master/slovenian-wordlist.txt",
    "https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/Slovenian.dic",
    "https://raw.githubusercontent.com/LibreOffice/dictionaries/master/sl_SI/sl_SI.dic",
    "https://raw.githubusercontent.com/wooorm/dictionaries/master/dictionaries/sl/index.dic"
  ];

  for (const url of URLs) {
    try {
      console.log(`Attempting to enrich background Slovenian wordlist from: ${url}`);
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const text = await res.text();
        const lines = text.split(/\r?\n/);
        let count = 0;
        
        lines.forEach((line, index) => {
          let clean = line.trim();
          if (!clean) return;
          if (index === 0 && /^\d+$/.test(clean)) return;
          if (clean.includes('/')) {
            clean = clean.split('/')[0].trim();
          }
          clean = clean.toLowerCase();
          
          if (clean.length >= 3 && /^[a-zčšž]+$/.test(clean)) {
            slovenskiWordlistSet.add(clean);
            count++;
          }
        });

        console.log(`Successfully enriched in-memory wordlist with ${count} words from ${url}. Total size: ${slovenskiWordlistSet.size}`);
        break; // Stop after first successful remote fetch to conserve resources
      }
    } catch (err: any) {
      console.warn(`Background enrichment fetch failed for ${url}:`, err.message);
    }
  }
}

// Spark background load
loadSlovenianWordlist();

// Initialize Gemini SDK lazily to prevent crashing if the key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY environment variable is not defined or is placeholder. Gemini word verification will run in fallback simulation mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Boggle score calculator
function getBogglePoints(wordLength: number): number {
  if (wordLength < 3) return 0;
  if (wordLength === 3 || wordLength === 4) return 1;
  if (wordLength === 5) return 2;
  if (wordLength === 6) return 3;
  if (wordLength === 7) return 5;
  return 11; // 8 or more
}

function isLikelySlovenianPhonetically(word: string): boolean {
  const upper = word.toUpperCase().trim();
  if (upper.length < 3 || upper.length > 15) return false;
  
  // No foreign characters
  if (/[QWXY]/.test(upper)) return false;

  // Must contain only standard Slovenian alphabet characters
  if (!/^[A-ZČŠŽ]+$/.test(upper)) return false;

  // Must contain at least one vowel/vocalic element
  if (!/[AEIOUR]/.test(upper)) return false;

  // Define non-vowels (consonants) as everything except AEIOU
  const consonants = upper.replace(/[AEIOU]/g, "").replace(/[ČŠŽ]/g, "C");
  // If it has 5 or more consecutive non-AEIOU consonants (excluding vocalic R positioning sometimes, but let's be strictly protective)
  // Let's replace non-vowels with 'C' and test for clusters
  const clusterPattern = upper.replace(/[^AEIOU]/g, "C");
  if (/C{5,}/.test(clusterPattern)) {
    return false; // Rejected as massive consonant cluster (gibberish like JRKZSUI)
  }

  // Reject strings of 3+ identical characters (e.g., "ZZZZ")
  if (/([A-ZČŠŽ])\1\1/.test(upper)) return false;

  return true;
}

// 3-Tier Robust Hybrid Word Validation System
async function validateSlovenianWordThreeTiers(word: string): Promise<{ valid: boolean; source: string; definition: string }> {
  const cleanWord = word.trim().toLowerCase();

  // TIER 1: Local Dictionary (Fast Cache)
  if (isWordlistLoaded && slovenskiWordlistSet.has(cleanWord)) {
    return {
      valid: true,
      source: "TIER 1 (Lokalni slovar - slovenian-wordlist.txt)",
      definition: "Najdeno v lokalni zbirki besed."
    };
  }

  // TIER 2: Online Fallback Search
  try {
    const normalizedWord = encodeURIComponent(cleanWord);
    const response = await fetch(`https://www.fran.si/iskanje?Query=${normalizedWord}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html"
      },
      signal: AbortSignal.timeout(4000)
    });

    if (response.ok) {
      const html = await response.text();
      const noZadetkov = html.includes("ni vrnilo zadetkov") || 
                         html.includes("Iskanje ni obrodilo") ||
                         html.includes("zadetkov ni") ||
                         html.includes("Brez zadetkov") ||
                         html.includes("Ni najdenih") ||
                         html.includes("ni mogoče najti");

      const hasEntryIndicator = html.includes('class="entry"') || 
                                html.includes('class="entry-content"') || 
                                html.includes('id="entry-') ||
                                html.includes('class="zadetek"');

      if (!noZadetkov && hasEntryIndicator) {
        // Cache immediately in local Set for future fast offline responses
        slovenskiWordlistSet.add(cleanWord);
        return {
          valid: true,
          source: "TIER 2 (Fran.si)",
          definition: "Najdeno v uradnih slovarjih na spletu."
        };
      }
    }
  } catch (e: any) {
    console.warn("TIER 2 lookup on Fran.si failed:", e.message);
  }

  // Additional Tier 2 fallback - CJVT Sloleks
  try {
    const response = await fetch(`https://sloleks.cjvt.si/iskanje?q=${encodeURIComponent(cleanWord)}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(4000)
    });
    if (response.ok) {
      const html = await response.text();
      const hasNoMatches = html.includes("ni obrodilo") || 
                           html.includes("ni zadetkov") || 
                           html.includes("Ni zadetkov") ||
                           html.includes("Ni najdenih");

      const hasLemmaLink = html.includes("/lema/") || 
                           html.includes("/msd/") ||
                           html.includes("class=\"lemma\"");

      if (!hasNoMatches && hasLemmaLink) {
        slovenskiWordlistSet.add(cleanWord);
        return {
          valid: true,
          source: "TIER 2 (Sloleks)",
          definition: "Najdeno v morfološki zbirki CJVT."
        };
      }
    }
  } catch (e: any) {
    console.warn("TIER 2 lookup on Sloleks failed:", e.message);
  }

  // TIER 3: Supreme Judge (Gemini AI API)
  const ai = getGeminiClient();
  if (ai) {
    try {
      const uppercaseWord = word.toUpperCase().trim();
      const prompt = `You are a strict validation filter for a Slovenian Boggle game. Your task is to evaluate the word '${uppercaseWord}' based on modern Slovenian standards.
Even if this word exists on the portal Fran.si, it must only be accepted if it belongs to standard, modern Slovenian.
The word is VALID (Return 'DA') only if it appears in or is a correct grammatical inflection of words from these modern dictionaries:
eSSKJ (Slovar slovenskega knjižnega jezika 21. stoletja)
SSKJ 2 (Slovar slovenskega knjižnega jezika, druga izdaja)
Pravopis 2001 (Slovenski pravopis)
The word MUST BE REJECTED (Return 'NE') if it only exists in:
Historical or obsolete dictionaries (e.g., Pleteršnik 1894, 16th-century dictionaries).
Dialectal, regional, or linguistic atlas dictionaries (SLA).
Slang, colloquial, or Serbo-Croatian loanwords (e.g., 'voža').
Random/nonsense letter combinations (e.g., 'TKVIOAM').
Respond strictly with either 'DA' or 'NE' and absolutely nothing else.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      const textOutput = response.text ? response.text.trim().toUpperCase() : "";
      const isDa = textOutput === "DA" || textOutput.startsWith("DA") || textOutput.includes("\xDA") || textOutput.includes("DA.");

      if (isDa) {
        // Cache immediately
        slovenskiWordlistSet.add(cleanWord);
        return {
          valid: true,
          source: "TIER 3 (Gemini AI)",
          definition: "Potrjeno s strani Gemini AI."
        };
      } else {
        return {
          valid: false,
          source: "TIER 3 (Gemini AI)",
          definition: "Besede ni v uradnih slovenskih slovarjih (Gemini AI zavrnitev)."
        };
      }
    } catch (geminiErr: any) {
      console.error("TIER 3 Gemini API process failed:", geminiErr.message);
    }
  }

  return {
    valid: false,
    source: "Baza & Slovarji",
    definition: "Beseda ne obstaja v slovenskih slovarjih ali pa je preverba spodletela."
  };
}

// DFS check if word exists on 5x5 grid
function checkWordOnGrid(grid: string[][], word: string): boolean {
  const R = grid.length;
  const C = grid[0].length;
  const cleanedWord = word.toUpperCase().trim();
  if (cleanedWord.length < 3) return false;

  const visited: boolean[][] = Array.from({ length: R }, () => Array(C).fill(false));

  function dfs(r: number, c: number, wordIdx: number): boolean {
    if (wordIdx === cleanedWord.length) return true;
    if (
      r < 0 || r >= R || c < 0 || c >= C || 
      visited[r][c] || 
      grid[r][c].toUpperCase() !== cleanedWord[wordIdx]
    ) {
      return false;
    }

    visited[r][c] = true;
    // 8-directional search
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        if (dfs(r + dr, c + dc, wordIdx + 1)) return true;
      }
    }
    visited[r][c] = false;
    return false;
  }

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (dfs(r, c, 0)) return true;
    }
  }
  return false;
}

// Endpoint implementation for verify-word
app.post("/api/verify-word", async (req, res) => {
  try {
    const { word, grid } = req.body;

    if (!word || typeof word !== "string") {
      return res.status(400).json({ error: "Manjkajoča ali neveljavna beseda." });
    }

    const uppercaseWord = word.toUpperCase().trim();

    if (uppercaseWord.length < 3) {
      return res.json({
        word: uppercaseWord,
        isValid: false,
        valid: false,
        points: 0,
        canBeFormedOnBoard: false,
        definition: "Beseda je prekratka. Biti mora dolga vsaj 3 črke."
      });
    }

    // First check if it is formable on the board
    let canBeFormed = true;
    if (grid && Array.isArray(grid)) {
      canBeFormed = checkWordOnGrid(grid as string[][], uppercaseWord);
    }

    if (!canBeFormed) {
      return res.json({
        word: uppercaseWord,
        isValid: false,
        valid: false,
        points: 0,
        canBeFormedOnBoard: false,
        definition: "Te besede ni mogoče sestaviti na trenutni plošči s sosednjimi polji."
      });
    }

    const result = await validateSlovenianWordThreeTiers(uppercaseWord);
    return res.json({
      word: uppercaseWord,
      isValid: result.valid,
      valid: result.valid,
      points: result.valid ? getBogglePoints(uppercaseWord.length) : 0,
      canBeFormedOnBoard: true,
      definition: `${result.definition} [Vir: ${result.source}]`
    });

  } catch (err: any) {
    console.error("Internal Verify Word error:", err);
    res.status(500).json({ error: "Napaka pri preverjanju besede." });
  }
});

// Endpoint implementation for check-word (exactly as requested by prompt)
app.post("/api/check-word", async (req, res) => {
  try {
    const { word, grid } = req.body;

    if (!word || typeof word !== "string") {
      return res.status(400).json({ error: "Manjkajoča ali neveljavna beseda." });
    }

    const uppercaseWord = word.toUpperCase().trim();

    if (uppercaseWord.length < 3) {
      return res.json({
        word: uppercaseWord,
        isValid: false,
        valid: false,
        points: 0,
        canBeFormedOnBoard: false,
        definition: "Beseda je prekratka. Biti mora dolga vsaj 3 črke."
      });
    }

    // Allow grid checking if passed in payload
    let canBeFormed = true;
    if (grid && Array.isArray(grid)) {
      canBeFormed = checkWordOnGrid(grid as string[][], uppercaseWord);
    }

    if (!canBeFormed) {
      return res.json({
        word: uppercaseWord,
        isValid: false,
        valid: false,
        points: 0,
        canBeFormedOnBoard: false,
        definition: "Te besede ni mogoče sestaviti na trenutni plošči s sosednjimi polji."
      });
    }

    const result = await validateSlovenianWordThreeTiers(uppercaseWord);
    return res.json({
      word: uppercaseWord,
      isValid: result.valid,
      valid: result.valid,
      points: result.valid ? getBogglePoints(uppercaseWord.length) : 0,
      canBeFormedOnBoard: true,
      definition: `${result.definition} [Vir: ${result.source}]`
    });

  } catch (err: any) {
    console.error("Internal Check Word error:", err);
    res.status(500).json({ error: "Napaka pri preverjanju besede." });
  }
});

// API endpoint to solve the 5x5 board
app.post("/api/solve-board", async (req, res) => {
  try {
    const { grid } = req.body;
    if (!grid || !Array.isArray(grid)) {
      return res.status(400).json({ error: "Neveljaven ali manjkajoč format plošče." });
    }

    const flatLetterString = (grid as string[][]).map(row => row.join(" ")).join("\n");

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback solver with preset interesting words based on board letters
      // To create a fun offline experience, let's extract all letters and find matching mini words
      const lettersInGrid = new Set((grid as string[][]).flat().map(l => l.toUpperCase().trim()));
      
      const commonSloWords = [
        "DOM", "MAMA", "DELO", "STOL", "ROKA", "VODA", "ZIMA", "SONCE", "TRAVA", "KRUH", "PISMO", 
        "KAVA", "AVTO", "MESTO", "KOLO", "LES", "SADJE", "SIR", "SVAR","LUKA", "RIBA", "SESTRA",
        "BRAT", "DRUŽINA", "LJUBEZEN", "SNEK", "ČAJ", "ŠOLA", "ŽABA", "URA", "LUČ", "PIVO", "VINO"
      ];

      const foundFallbackWords = commonSloWords.filter(w => {
        // Can it theoretically be spelled with letters present?
        const canSpell = [...w].every(char => lettersInGrid.has(char));
        if (!canSpell) return false;
        // Verify path
        return checkWordOnGrid(grid as string[][], w);
      }).map(w => ({
        word: w,
        points: getBogglePoints(w.length),
        definition: "Slovenska beseda, najdena na plošči."
      }));

      return res.json({
        words: foundFallbackWords.slice(0, 15)
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Tukaj je 5x5 Boggle mreža črk v slovenščini (vrstica po vrstici):\n${flatLetterString}\n\nNajdi med 15 in 25 veljavnih slovenskih besed dolžine vsaj 3 črke, ki jih je dejansko mogoče sestaviti iz sosednjih črk na plošči (polja se lahko povezujejo vodoravno, navpično ali diagonalno, isto polje se ne sme uporabiti več kot enkrat v posamezni besedi). Uporabi le slovenske besede. Vrni rezultate v obliki JSON s seznamom najdenih besed z razlago in točkami.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              words: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING, description: "Beseda v slovenščini z velikimi črkami." },
                    definition: { type: Type.STRING, description: "Kratka definicija pomena v slovenščini." },
                    points: { type: Type.INTEGER, description: "Točke (3-4 črke = 1t, 5 črk = 2t, 6 črk = 3t, 7 črk = 5t, 8+ črk = 11t)" }
                  },
                  required: ["word", "definition", "points"]
                }
              }
            },
            required: ["words"]
          }
        }
      });

      const parsed = JSON.parse(response.text?.trim() || "{\"words\":[]}");
      
      // Let's filter out words that actually can't be formed on the board via strict DFS,
      // just to be incredibly accurate, keeping only actual matches!
      const finalWords = (parsed.words || []).filter((wObj: any) => {
        if (!wObj.word) return false;
        const wUppercase = wObj.word.toUpperCase().trim();
        return checkWordOnGrid(grid as string[][], wUppercase);
      });

      return res.json({ words: finalWords });

    } catch (apiErr) {
      console.error("Gemini API error during solving:", apiErr);
      return res.json({ words: [] });
    }

  } catch (err) {
    console.error("Internal Solver Error:", err);
    res.status(500).json({ error: "Napaka pri odkrivanju rešitev na plošči." });
  }
});

// Endpoint to return the size of the loaded dictionary dynamically
app.get("/api/dictionary-size", (req, res) => {
  try {
    const size = isWordlistLoaded ? slovenskiWordlistSet.size : SLOVENIAN_DICTIONARY.length;
    res.json({ size });
  } catch (err) {
    console.error("Failed to get dictionary size:", err);
    res.status(500).json({ error: "Napaka pri branju velikosti slovarja." });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Boggle SI Server running on http://localhost:${PORT}`);
  });
}

startServer();
