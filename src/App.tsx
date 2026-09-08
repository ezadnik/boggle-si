/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  BoardGrid, 
  PlayerWord, 
  GameStatus, 
  GameSettings, 
  Coordinates 
} from './types';
import { BoggleBoard } from './components/BoggleBoard';
import { HourglassTimer } from './components/HourglassTimer';
import { WebAudioSynth } from './components/AudioController';
import { AndroidReference } from './components/AndroidReference';
import { 
  Volume2, 
  VolumeX, 
  Settings, 
  RotateCcw, 
  Sparkles, 
  Trophy, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  Languages,
  BookOpen,
  Info,
  Layers,
  Sparkle
} from 'lucide-react';

// Slovenian 4x4 Boggle Dice combinations (no foreign characters Q, W, X, Y)
const SLOVENIAN_DICE_4X4 = [
  "AAAFRS", "AAEEEE", "AAFIRS", "ADENNN", "AEEEEM",
  "AEGMNN", "AFIRST", "BJKČŠŽ", "CCENST", "CEILPT",
  "DDHNOT", "DHLNOR", "DLNOTV", "EIIITT", "ENSSSU",
  "FIPRST"
];

// Slovenian 5x5 Boggle Dice combinations (no foreign characters Q, W, X, Y)
const SLOVENIAN_DICE_5X5 = [
  "AAAFRS", "AAEEEE", "AAFIRS", "ADENNN", "AEEEEM",
  "AEEGMU", "AEGMNN", "AFIRST", "BJKČŠŽ", "CCENST",
  "CEIILT", "CEILPT", "CEIPST", "DDHNOT", "DHHLOR",
  "DHLNOR", "DLNOTV", "EIIITT", "EMOTTT", "ENSSSU",
  "FIPRST", "GORRVZ", "HIPRRL", "NOOTUV", "OOOTTE"
];

// Offline comprehensive dictionary of common Boggle-friendly Slovenian words (3 to 8+ characters)
const SLOVENIAN_WORDS = [
  // User requested exact common words
  "nit", "biser", "pot", "sit", "mreža", "karta", "okno", "hiša", "voda", "trava", "sonce", "roka", "noga",

  // 3-letter words
  "lep", "les", "pes", "sir", "vod", "rok", "dom", "čaj", "luk", "beg", "boj", "rek", "ded", "sin", "hči", "ura", "luč", "kip", "dan", "noč", "trg", "več", "dva", "tri", "pet", "bot", "kos", "miš", "jaz", "vol", "med", "sad", "sok", "zid", "vrt", "jas", "bor", "mah", "lek", "rž", "rak", "zub", "kit", "bik", "lov", "cev", "nov", "pol", "bel", "čep", "las", "nos", "uho", "zob", "kri", "ost", "tat", "val", "vir", "žar", "mir", "tir", "uha", "pij", "jej", "daj", "naj", "kam", "tam", "kod", "pod", "nad", "pre", "pri", "pro", "red", "reš", "sek", "sod", "šib", "šiv", "tok", "top", "tuj", "vaz", "vle", "voz", "vrv", "vse", "vti", "vzp", "žak", "žel", "žep", "živ", "žol",
  // 4-letter words
  "mama", "delo", "stol", "zima", "kava", "avto", "kolo", "lesa", "riba", "brat", "šola", "žaba", "pivo", "vino", "miza", "tila", "moka", "sola", "hrib", "veja", "list", "cvet", "roža", "kost", "srce", "prst", "koža", "mlad", "star", "luka", "snek", "breg", "vlak", "zrak", "mrak", "veter", "sneg", "toča", "luna", "mož", "fant", "telo", "glav", "vrat", "rame", "prsi", "bogg", "znak", "glas", "milo", "klet", "soba", "park", "most", "grad", "torta", "meso", "goba", "lipa", "vrba", "roman", "polje", "klop", "lepa", "bosa", "črna", "bela", "rdeč", "riva", "more", "gora", "prah", "luči", "igra", "pari", "slap", "plan", "klik", "koko", "konj", "kuri", "vasi", "kralj", "vodi", "babe", "strm", "skok", "smrk", "udar", "utes", "uzda", "vaja", "valj", "vaza", "vdov", "veja", "vaje", "veza", "vica", "vile", "vilo", "vnos", "voje", "volk", "vosek", "vrat", "vrba", "vpis", "vrst", "vrtu", "vrve", "vsak", "vaza", "vžig", "zago", "zajc", "zala", "zale", "zgod", "zgon", "zmaj", "zmen", "baza", "cona", "čast", "čela", "čelo", "čepa", "člen", "čudo", "dlan", "doba", "doza", "drog", "dvoj", "etap", "fara", "film", "fizi", "fraza", "gajb", "gama", "gaza", "glas", "glog", "gnoj", "gost", "grah", "grob", "grot", "gumb", "gust", "idil", "igla", "ikon", "izid", "izba", "jams", "jara", "jare", "jark", "jato", "jedi", "jaha", "jova", "kaca", "kadi", "kaša", "kaše", "kila", "kino", "kivi", "klan", "kleč", "klin", "klop", "ključ", "kmet", "kned", "knof", "koza", "kože", "kapa", "kral", "krap", "kras", "kril", "krog", "kron", "kruh", "krut", "kuha", "kula", "kupa", "kura", "kure", "kuža", "laje", "laka", "lame", "last", "laži", "leha", "lepa", "lepo", "leta", "leto", "lice", "liga", "liha", "liho", "limo", "lipe", "lira", "lisa", "lise", "list", "loga", "loje", "loka", "lomi", "lopa", "lopu", "loza", "luna", "luža", "maca", "maha", "maja", "malo", "mapa", "mare", "maro", "masa", "mase", "maslo", "mast", "mata", "maza", "meča", "medo", "medu", "meja", "meje", "mera", "mere", "mesa", "meta", "mete", "milo", "mina", "mine", "miro", "moda", "mode", "moka", "moke", "mora", "more", "most", "moža", "mraka", "mrav", "mraz", "mrva", "muha", "muhe", "mula", "mura", "must", "nada", "napa", "nase", "nasi", "navo", "nebo", "nega", "nege", "neko", "nemi", "nemo", "nepa", "niti", "nivo", "noga", "noge", "nora", "nore", "nori", "noro", "note", "nova", "nove", "novi", "novo", "noža",
  // 5-letter words
  "okras", "kroma", "pismo", "mesto", "sadje", "tetka", "škrat", "koren", "sliva", "juška", "drevo", "glina", "zlato", "bronz", "moped", "veter", "megla", "sreda", "letoe", "dedek", "nečak", "sosed", "otrok", "punca", "dekle", "obraz", "trebu", "volja", "tabla", "slika", "kocka", "črkao", "jezik", "pranj", "celec", "učeci", "garaž", "salon", "kolač", "zelje", "solat", "tesar", "opeka", "malta", "deska", "jasen", "gaber", "jelka", "barka", "bazen", "beden", "bedro", "bogat", "borba", "boren", "božič", "brada", "brana", "brvno", "bučka", "bučke", "ceker", "cepin", "cesta", "cigra", "citat", "civil", "cokla", "copat", "čanka", "čaplja", "čebel", "čedar", "čelna", "čelno", "čepica", "čerka", "česma", "česen", "čigav", "čisto", "čital", "članek", "človek", "čmrlj", "čoln", "črtica", "čudež", "čustvo", "dalje", "danes", "daska", "datum", "davki", "deblo", "dečko", "delec", "delno", "deset", "deska", "detel", "devet", "dieta", "divji", "dlaka", "dlani", "dobro", "dokaz", "dolar", "domet", "dopis", "dosti", "dotik", "dovec", "dovka", "dovoz", "draga", "dragi", "drago", "drama", "drava", "drča", "drget", "drobi", "drobno", "duplo", "duša", "dvoje", "dvora", "dvom", "ekipa", "ekran", "elita", "epika", "etapa", "fajfa", "fanti", "farov", "favor", "faza", "fešta", "films", "firma", "fižol", "flaga", "flaša", "fokus", "forma", "forum", "foter", "fraza", "front", "gajba", "gajbe", "galeb", "galop", "gamba", "gasil", "gavez", "gavra", "gazda", "giban", "ginek", "glasi", "glava", "glave", "glavi", "glina", "gline", "glive", "gloga", "gnoja", "golaž", "golec", "goliš", "golob", "gomil", "gora", "gorak", "gorje", "gosen", "gospa", "gostu", "gozda", "gozdu", "grabe", "gruda", "graha", "grana", "grbav", "grbča", "grdae", "grdav", "grdob", "greda", "grive", "grlic", "groba", "groza", "groze", "gruda", "guba", "gube", "harem", "harfa", "hlapi", "hkrati", "hmelj", "hobot", "hokej", "hotel", "hrana", "hrane", "hrast", "hust", "hrbte", "huška", "hvala", "hvale", "hvali", "idila", "idilo", "igral", "igran", "igre", "igro", "iguan", "ihana", "imena", "imeti", "imeta", "indij", "iskra", "iskre", "islam", "istov", "itaka", "izrek", "izvor", "izbira", "izced", "izhod", "izjava", "izkaz", "izkop", "izkup", "izlet", "izliv", "izmed", "izmer", "izpad", "izpit", "jadra", "jadro", "jahač", "jahal", "jahta", "jajca", "jajce", "jama", "jame", "jarek", "jarem", "jasen", "jasli", "jastog", "javen", "javno", "javor", "jedec", "jeder", "jedro", "jelen", "jelka", "jelke", "jemal", "jemati", "jenja", "jeres", "jesen", "jetra", "jezde", "jezen", "jezič", "jezika", "jeziku", "jezne", "jezni", "jezno", "jodla", "joga", "jopica", "joški", "južno", "kader", "kadet", "kafra", "kajak", "kajne", "kajti", "kakav", "kakor", "kamen", "kamini", "kamra", "kanal", "kanon", "kanja", "kapa", "kape", "kapel", "kapla", "kaplja", "kaput", "karat", "karda", "karel", "kavel", "kavka", "kazal", "kazan", "kazen", "kelih", "kemic", "kiber", "kipar", "kipca", "kipci", "kipec", "kipov", "kisik", "kisel", "kitar", "kitra", "kivi", "klada", "klade", "klana", "kleče", "kleti", "kleto", "klica", "klice", "klici", "klima", "klime", "klini", "klipa", "klips", "kluba", "klube", "ključ", "kobra", "kobre", "kocin", "kocka", "kocke", "kocki", "kočna", "kodre", "kofer", "kojal", "koles", "koleg", "koler", "koles", "kolca", "kolka", "kolko", "kolo", "kolon", "kolos", "kolpa", "komad", "komaj", "kombi", "komet", "komol", "komu", "konec", "konja", "konje", "kopač", "kopal", "kopec", "koper", "kopit", "kopja", "kopje", "kopni", "kopra", "korak", "koren", "korit", "koruz", "kosec", "kosmi", "kosov", "kosti", "košar", "kotec", "kotel", "koten", "kotla", "kotle", "kovač", "kovan", "kovec", "kovid", "kovin", "kozar", "kozca", "kozce", "kozec", "kozel", "kozja", "kozje", "kozji", "kozjo", "kozla", "kozle", "kozli", "kozlo", "koža", "kože", "koži", "kožna", "kožne", "kožni", "kožno", "kožuh", "krač", "kračo", "kraja", "kraje", "kraju", "krajc", "krake", "kralj", "krame", "kramp", "krasa", "krasi", "krast", "krati", "krava", "krave", "kravi", "krema", "kreme", "krhka", "krhke", "krhki", "krhko", "krice", "kriča", "krila", "krilo", "krimi", "krina", "križa", "križe", "križi", "kriva", "krive", "krivi", "krivo", "kriza", "krize", "krmel", "krmil", "krogu", "kroja", "kroji", "kroju", "krola", "kroma", "krova", "krove", "krovi", "krovu", "krpan", "krpica", "krpice", "krsta", "krste", "krsti", "kruha", "kruhu", "kruna", "kruta", "krute", "kruto", "krvav", "krvec", "krven", "krzna", "krzno", "kubik", "kubus", "kučak", "kučica", "kučka", "kufer", "kugan", "kuhar", "kuhaš", "kuhat", "kuhna", "kuhne", "kuhnj", "kuhov", "kukal", "kukav", "mraza", "mrznj",
  // 6-letter words
  "beseda", "sestra", "družina", "gozdec", "kovanec", "srebro", "železo", "petece", "sobota", "babica", "očetki", "moškie", "ženska", "ljudje", "bolnic", "knjiga", "zvezek", "črnilo", "kopeli", "pisarn", "cerkev", "pijača", "hruška", "salate", "višnja", "črešnj", "gaberč", "pšenic", "ječmen", "koruza", "čebela", "poljec", "vodica", "stolči", "rokica", "kartica", "bifeji", "bifeja", "bivanje", "bivati", "bivša", "bivše", "bival", "blazina", "blisk", "bolnik", "bolnica", "boriti", "brajda", "branje", "brati", "breza", "breze", "brezo", "brezu", "brodar", "budilka", "bujna", "bujno", "buren", "butan", "butara", "butila", "celica", "celice", "celo", "cement", "center", "centra", "centri", "centru", "cepin", "cerada", "cesar", "cesta", "ceste", "cesto", "cestni", "cigan", "cigara", "citat", "citati", "citro", "civil", "cmoki", "cokla", "cokle", "copat", "copati", "cunja", "cunje", "cveti", "cvetja", "cvetje", "cvetni", "cvetoč", "cvilit", "čakati", "čaplja", "čepica", "čepice", "češnja", "češnje", "čezdan", "čigar", "čistil", "čistilo", "čistoč", "čitalec", "članek", "članki", "človek", "čmrlji", "čofat", "čoln", "čolni", "čolnov", "čuden", "čudi", "čudno", "čustva", "čuti", "čutil", "čutilo", "čreva", "črevo", "črna", "črne", "črni", "črno", "črtica", "črtice", "dalje", "danes", "daska", "datum", "datumi", "debel", "debelo", "deblo", "debla", "deček", "dečki", "dečko", "dedek", "dedki", "dedi", "delati", "delavec", "delavka", "delec", "delci", "deliti", "deljen", "delno", "delov", "deset", "deseta", "deseti", "deska", "deske", "desko", "desna", "desne", "desni", "desno", "detel", "detela", "devet", "deveta", "deveti", "dežela", "dežele", "deželo", "dežev", "dežnik", "divjak", "divji", "dlaka", "dlake", "dlani", "dlanjo", "dnevna", "dnevne", "dnevni", "dnevno", "dobra", "dobre", "dobri", "dobro", "dodati", "dogodek", "dojiti", "dokaz", "dokazi", "dolar", "dolari", "dolžan", "dolžina", "dolžine", "dolžni", "dolžno", "domača", "domače", "domači", "domačo", "domena", "domet", "domov", "dopust", "dopis", "dopisi", "doslej", "dosti", "dotik", "dotiki", "dovec", "dovoz", "doživi", "draga", "dragi", "drago", "drama", "drava", "drčati", "dreves", "drevo", "drget", "drobec", "drobci", "drobno", "drug", "druga", "druge", "drugi", "drugo", "drva", "drvar", "dupla", "duplo", "duša", "duše", "duši", "dušo", "dvoma", "dvor", "dvora", "dvore", "dvori", "dvig", "dvog", "ekipa", "ekipe", "ekipo", "ekran", "ekrani", "elita", "elite", "fajfa", "fantom", "fantič", "fanti", "farov", "favor", "faza", "faze", "fazo", "festa", "fešta", "fešte", "figura", "film", "filmi", "films", "fina", "fine", "fini", "fino", "fizika", "fižol", "fižoli", "flaga", "flaše", "flašo", "flavta", "flora", "fluid", "fokus", "forma", "forme", "formo", "forum", "forumi", "foter", "fotra", "fotri", "frajer", "fraze", "frazo", "frizur", "front", "fronte", "fronto", "fural", "gajba", "gajbe", "gajbo", "galeb", "galebi", "galop", "gamba", "gasil", "gavez", "gavra", "gazda", "gazda", "gazele", "giban", "gibati", "gibanjski", "glas", "glasi", "glasba", "glasbe", "glasbo", "glasbi", "glasek", "glasov", "glava", "glave", "glavi", "glavo", "gline", "glivi", "gloga", "gnoji", "gnoja", "goli", "golaž", "golob", "golobi", "gomila", "gomile", "gora", "gorenje", "gorje", "gospe", "gospod", "gost", "gostu", "gozda", "gozdi", "gozdu", "grabe", "gruda", "graha", "grbav", "greda", "grive", "grlic", "groba", "groza", "groze", "gruda", "guba", "gube", "harem", "harfa", "hlapi", "hkrati", "hmelj", "hobot", "hokej", "hotel", "hrana", "hrane", "hrast", "hriby", "hrošč", "hrust", "hrbte", "huška", "hvala", "hvale", "hvali", "idila", "idilo", "igral", "igran", "igre", "igro", "imena", "imeti", "imeta", "indij", "iskra", "iskre", "islam", "istov", "itaka", "izrek", "izvor", "izbira", "izced", "izhod", "izjava", "izkaz", "izkop", "izkup", "izlet", "izliv", "izmed", "izmer", "izpad", "izpit", "jabolk", "jadra", "jadro", "jahač", "jahal", "jahta", "jajca", "jajce", "jama", "jame", "jarek", "jarem", "jasen", "jasli", "jastog", "javen", "javno", "javor", "jedec", "jeder", "jedro", "jelen", "jelka", "jelke", "jemal", "jemati", "jenja", "jeres", "jesen", "jetra", "jezde", "jezen", "jezič", "jezika", "jeziku", "jezne", "jezni", "jezno", "jodla", "joga", "jopica", "joški", "južno",
  // 7+ črkovne besede
  "ljubezen", "računalnik", "zdravje", "bolezen", "zdravnik", "zdravilo", "lekarna", "razred", "pisalnik", "kopanje", "brisača", "stanovanje", "kuhinja", "spalnica", "kopalnica", "čakalnica", "podstrešje", "pisarna", "kolaček", "piščanec", "odvetnik", "splošno", "slovensko", "književno", "pravda", "sodnik", "delati", "graditi", "pšenica", "čebelec", "romanči", "čebelar", "čebelarstvo"
];

// Default grids of blank nodes before initial roll
const INITIAL_BLANK_GRID_4X4: BoardGrid = Array.from({ length: 4 }, (_, r) =>
  Array.from({ length: 4 }, (_, c) => ({
    row: r,
    col: c,
    letter: ['A', 'E', 'I', 'O', 'N', 'R', 'S', 'T', 'M', 'V', 'K', 'D', 'P', 'Z', 'Č', 'Š'][r * 4 + c],
  }))
);

const INITIAL_BLANK_GRID_5X5: BoardGrid = Array.from({ length: 5 }, (_, r) =>
  Array.from({ length: 5 }, (_, c) => ({
    row: r,
    col: c,
    letter: ['A', 'E', 'I', 'O', 'N', 'R', 'S', 'T', 'G', 'L', 'M', 'V', 'K', 'D', 'P', 'J', 'U', 'B', 'Z', 'Č', 'C', 'Š', 'H', 'Ž', 'F'][r * 5 + c],
  }))
);

// Seeded PRNG for deterministic multiplayer board matching
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  // Mulberry32
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }
}

function adjustSlovenianBoardLetters(letters: string[], randomFn: () => number): string[] {
  const result = [...letters];
  const SlovenianVowels = ["A", "E", "I", "O", "U"];
  
  // High-frequency Slovenian consonants
  const HighFreqConsonants = ["R", "S", "T", "L", "N", "M", "D", "V"];
  // Rare consonants in Slovenian language
  const RareConsonants = ["F", "G", "H", "P", "B"];
  // Moderate frequency consonants
  const ModerateConsonants = ["C", "Č", "J", "K", "Š", "Z", "Ž"];
  
  // Custom pool to draw high-frequency consonants from
  const HighFreqPool = [
    "R", "R", "S", "S", "T", "T", "L", "L", "N", "N", "M", "M", "D", "V"
  ];

  // 1. Upgrade rare consonants with 50% probability to high-frequency ones for smarter frequencies
  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    if (RareConsonants.includes(char)) {
      if (randomFn() < 0.5) {
        result[i] = HighFreqPool[Math.floor(randomFn() * HighFreqPool.length)];
      }
    }
  }

  const AllSlovenianLetters = [...SlovenianVowels, ...HighFreqConsonants, ...ModerateConsonants, ...RareConsonants];

  let attempts = 0;
  while (attempts < 15) {
    const counts: { [key: string]: number } = {};
    AllSlovenianLetters.forEach(l => { counts[l] = 0; });
    result.forEach(l => {
      counts[l] = (counts[l] || 0) + 1;
    });

    const excessIndices: number[] = [];
    const tracker: { [key: string]: number } = {};
    
    result.forEach((l, idx) => {
      tracker[l] = (tracker[l] || 0) + 1;
      // Allow max 1 of each rare consonant on the board, max 3 for normal letters
      const maxAllowed = RareConsonants.includes(l) ? 1 : 3;
      if (tracker[l] > maxAllowed) {
        excessIndices.push(idx);
      }
    });

    if (excessIndices.length === 0) {
      break; 
    }

    // Replace the excess indexes
    for (const idx of excessIndices) {
      const originalValue = result[idx];
      const isVowel = SlovenianVowels.includes(originalValue);

      const currentCounts: { [key: string]: number } = {};
      AllSlovenianLetters.forEach(l => { currentCounts[l] = 0; });
      result.forEach(l => { currentCounts[l]++; });

      if (isVowel) {
        // Pick a vowel whose count is < 3
        const candidates = SlovenianVowels.filter(v => currentCounts[v] < 3);
        if (candidates.length > 0) {
          result[idx] = candidates[Math.floor(randomFn() * candidates.length)];
        }
      } else {
        // Pick from high-frequency consonants to ensure smart letter distribution
        const candidates = HighFreqPool.filter(c => currentCounts[c] < 3);
        if (candidates.length > 0) {
          result[idx] = candidates[Math.floor(randomFn() * candidates.length)];
        } else {
          const fallback = ModerateConsonants.filter(c => currentCounts[c] < 3);
          if (fallback.length > 0) {
            result[idx] = fallback[Math.floor(randomFn() * fallback.length)];
          }
        }
      }
    }

    attempts++;
  }

  return result;
}

function hasAdjacentAt(letters: string[], idx: number): boolean {
  const size = Math.sqrt(letters.length);
  const r = Math.floor(idx / size);
  const c = idx % size;
  const char = letters[idx];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        const nidx = nr * size + nc;
        if (letters[nidx] === char) {
          return true;
        }
      }
    }
  }
  return false;
}

function resolveIdenticalAdjacencies(letters: string[], randomFn: () => number): string[] {
  const result = [...letters];
  const size = Math.sqrt(letters.length);
  const len = letters.length;
  
  for (let pass = 0; pass < 20; pass++) {
    const violatingIndices: number[] = [];
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const idx = r * size + c;
        const char = result[idx];
        let hasAdjacency = false;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              const nidx = nr * size + nc;
              if (result[nidx] === char) {
                hasAdjacency = true;
                break;
              }
            }
          }
          if (hasAdjacency) break;
        }
        if (hasAdjacency) {
          violatingIndices.push(idx);
        }
      }
    }
    
    if (violatingIndices.length === 0) {
      break;
    }
    
    for (const idx of violatingIndices) {
      const indicesToTry = Array.from({ length: len }, (_, i) => i);
      for (let i = indicesToTry.length - 1; i > 0; i--) {
        const j = Math.floor(randomFn() * (i + 1));
        const temp = indicesToTry[i];
        indicesToTry[i] = indicesToTry[j];
        indicesToTry[j] = temp;
      }
      
      let swapped = false;
      for (const targetIdx of indicesToTry) {
        if (targetIdx === idx) continue;
        if (result[targetIdx] === result[idx]) continue;
        
        const tempChar = result[idx];
        result[idx] = result[targetIdx];
        result[targetIdx] = tempChar;
        
        if (!hasAdjacentAt(result, idx) && !hasAdjacentAt(result, targetIdx)) {
          swapped = true;
          break;
        } else {
          result[targetIdx] = result[idx];
          result[idx] = tempChar;
        }
      }
      
      if (!swapped) {
        const randomTarget = Math.floor(randomFn() * len);
        if (randomTarget !== idx && result[randomTarget] !== result[idx]) {
          const temp = result[idx];
          result[idx] = result[randomTarget];
          result[randomTarget] = temp;
        }
      }
    }
  }
  
  return result;
}

function ensureShumniki(letters: string[], randomFn: () => number, boardSize: number = 4): string[] {
  const result = [...letters];
  const shumniki = ["Č", "Š", "Ž"];
  const count = result.filter(l => shumniki.includes(l)).length;

  const targetMin = 1;
  const targetMax = boardSize === 4 ? 2 : 3;

  if (count >= targetMin && count <= targetMax) {
    return result;
  }

  if (count === 0) {
    // Replace 1 low-frequency letter with Č, Š, or Ž
    const numToReplace = 1;
    for (let k = 0; k < numToReplace; k++) {
      const rareConsonants = ["F", "G", "H", "P", "B"];
      let candidates = result.reduce((acc: number[], char, idx) => {
        if (rareConsonants.includes(char)) acc.push(idx);
        return acc;
      }, []);

      if (candidates.length === 0) {
        // Fall back to moderate consonants
        const moderateConsonants = ["C", "J", "K", "Z"];
        candidates = result.reduce((acc: number[], char, idx) => {
          if (moderateConsonants.includes(char)) acc.push(idx);
          return acc;
        }, []);
      }

      if (candidates.length === 0) {
        // Fall back to any non-vowel
        const vowels = ["A", "E", "I", "O", "U"];
        candidates = result.reduce((acc: number[], char, idx) => {
          if (!vowels.includes(char)) acc.push(idx);
          return acc;
        }, []);
      }

      if (candidates.length > 0) {
        const replaceIdx = candidates[Math.floor(randomFn() * candidates.length)];
        result[replaceIdx] = shumniki[Math.floor(randomFn() * shumniki.length)];
      }
    }
  } else if (count > targetMax) {
    // If we have more than targetMax, replace excess with high-frequency consonants
    const highFreqConsonants = ["R", "S", "T", "L", "N", "M", "D", "V"];
    const shumnikIndices = result.reduce((acc: number[], char, idx) => {
      if (shumniki.includes(char)) acc.push(idx);
      return acc;
    }, []);

    const excessCount = count - targetMax;
    for (let k = 0; k < excessCount; k++) {
      if (shumnikIndices.length > 0) {
        const removeIdx = shumnikIndices.splice(Math.floor(randomFn() * shumnikIndices.length), 1)[0];
        result[removeIdx] = highFreqConsonants[Math.floor(randomFn() * highFreqConsonants.length)];
      }
    }
  }

  return result;
}

const generateSlovenianBoardSeeded = (seed: number, boardSize: number = 4): BoardGrid => {
  const rng = new SeededRandom(seed);
  const is4x4 = boardSize === 4;
  const dice = is4x4 ? SLOVENIAN_DICE_4X4 : SLOVENIAN_DICE_5X5;
  let finalLetters: string[] = [];
  let attempts = 0;

  while (attempts < 1000) {
    const shuffledDice = rng.shuffle(dice);
    const rawLetters: string[] = [];
    shuffledDice.forEach((die) => {
      const randomFaceIdx = Math.floor(rng.next() * 6);
      const randomFace = die[randomFaceIdx];
      rawLetters.push(randomFace);
    });

    const adjustedLetters = adjustSlovenianBoardLetters(rawLetters, () => rng.next());
    const resolvedLetters = resolveIdenticalAdjacencies(adjustedLetters, () => rng.next());
    
    const vowelCount = resolvedLetters.filter(l => ["A", "E", "I", "O", "U"].includes(l)).length;
    const shumnikiCount = resolvedLetters.filter(l => ["Č", "Š", "Ž"].includes(l)).length;
    const consonants = resolvedLetters.filter(l => !["A", "E", "I", "O", "U"].includes(l));
    const highFreqConsonantsCount = consonants.filter(l => ["R", "S", "T", "L", "N", "M", "D", "V"].includes(l)).length;

    let conditionMet = false;

    if (is4x4) {
      // 4x4 criteria: 5-6 vowels minimum, 1-2 shumniki guaranteed
      let targetMinVowels = 5;
      let targetMaxVowels = 6;
      let targetMinShumniki = 1;
      let targetMaxShumniki = 2;

      if (attempts > 800) {
        targetMinVowels = 4;
        targetMaxVowels = 8;
        targetMinShumniki = 1;
        targetMaxShumniki = 3;
      }

      if (
        vowelCount >= targetMinVowels &&
        vowelCount <= targetMaxVowels &&
        shumnikiCount >= targetMinShumniki &&
        shumnikiCount <= targetMaxShumniki
      ) {
        conditionMet = true;
      }
    } else {
      // 5x5 criteria: 9-10 vowels, 1-3 shumniki, no identical adjacent letters
      const centerIndices = [6, 7, 8, 11, 12, 13, 16, 17, 18];
      const centerVowelsCount = centerIndices.filter(idx => ["A", "E", "I", "O", "U"].includes(resolvedLetters[idx])).length;

      let targetMinVowels = 9;
      let targetMaxVowels = 10;
      let targetMinCenterVowels = 4;
      let targetMinHighFreqConsonants = 10;
      let targetMinShumniki = 1;
      let targetMaxShumniki = 3;

      if (attempts > 800) {
        targetMinVowels = 8;
        targetMaxVowels = 11;
        targetMinCenterVowels = 3;
        targetMinHighFreqConsonants = 8;
      } else if (attempts > 950) {
        targetMinVowels = 7;
        targetMaxVowels = 12;
        targetMinCenterVowels = 2;
        targetMinHighFreqConsonants = 7;
      }

      if (
        vowelCount >= targetMinVowels &&
        vowelCount <= targetMaxVowels &&
        centerVowelsCount >= targetMinCenterVowels &&
        highFreqConsonantsCount >= targetMinHighFreqConsonants &&
        shumnikiCount >= targetMinShumniki &&
        shumnikiCount <= targetMaxShumniki
      ) {
        conditionMet = true;
      }
    }

    if (conditionMet) {
      finalLetters = resolvedLetters;
      break;
    }
    attempts++;
  }

  let boardLetters = finalLetters;
  if (boardLetters.length === 0) {
    const shuffledDice = rng.shuffle(dice);
    const rawLetters: string[] = [];
    shuffledDice.forEach((die) => {
      const randomFaceIdx = Math.floor(rng.next() * 6);
      const randomFace = die[randomFaceIdx];
      rawLetters.push(randomFace);
    });
    const adjusted = adjustSlovenianBoardLetters(rawLetters, () => rng.next());
    boardLetters = resolveIdenticalAdjacencies(adjusted, () => rng.next());
  }

  // Double check/guarantee Slovenian Shumniki (Č, Š, Ž) counts
  let finalWithShumniki = ensureShumniki(boardLetters, () => rng.next(), boardSize);
  if (JSON.stringify(finalWithShumniki) !== JSON.stringify(boardLetters)) {
    finalWithShumniki = resolveIdenticalAdjacencies(finalWithShumniki, () => rng.next());
  }

  const result: BoardGrid = Array.from({ length: boardSize }, () => []);
  finalWithShumniki.forEach((letter, index) => {
    const row = Math.floor(index / boardSize);
    const col = index % boardSize;
    result[row].push({
      row,
      col,
      letter,
    });
  });

  return result;
};

export default function App() {
  const [grid, setGrid] = useState<BoardGrid>(INITIAL_BLANK_GRID_4X4);
  const [selectedCells, setSelectedCells] = useState<Coordinates[]>([]);
  const [wordsFound, setWordsFound] = useState<PlayerWord[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(180);
  const [isRevealed, setIsRevealed] = useState(true);
  
  // Game Configuration States
  const [settings, setSettings] = useState<GameSettings>({
    timerDuration: 180, // 3 Minutes default
    soundEnabled: true,
    boardSize: 4,
  });
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // Game History and Score Tracker States
  const [gameHistory, setGameHistory] = useState<number[]>([]);
  const currentRoundSavedRef = useRef<string | null>(null);
  
  // Seeded Multiplayer States
  const [seedInput, setSeedInput] = useState('');
  const [gameSeed, setGameSeed] = useState<string | null>(null);
  
  // AI Solver and status
  const [isSolving, setIsSolving] = useState(false);
  const [aiSolutions, setAiSolutions] = useState<Array<{word: string; definition: string; points: number}>>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [dictionarySize, setDictionarySize] = useState<number>(SLOVENIAN_WORDS.length);
 
  // Audio System Ref
  const audioSynthRef = useRef<WebAudioSynth | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
 
  // Lazy instantiate Audio Controller
  const getAudioSynth = () => {
    if (!audioSynthRef.current) {
      audioSynthRef.current = new WebAudioSynth();
    }
    return audioSynthRef.current;
  };
 
  // Roll/Rattle logic block
  const generateSlovenianBoard = (): BoardGrid => {
    const size = settings.boardSize;
    const dice = size === 4 ? SLOVENIAN_DICE_4X4 : SLOVENIAN_DICE_5X5;
    const shuffledDice = [...dice].sort(() => Math.random() - 0.5);
    const result: BoardGrid = Array.from({ length: size }, () => []);
    
    shuffledDice.forEach((die, index) => {
      const row = Math.floor(index / size);
      const randomFace = die[Math.floor(Math.random() * 6)];
      result[row].push({
        row,
        col: index % size,
        letter: randomFace,
      });
    });
    return result;
  };
 
  // Sound and shaking routine triggers
  const handleStartNewGameSeeded = (forcedSeed?: number) => {
    if (gameStatus === 'shaking') return;
 
    // Use forced seed or generate a fresh 4-digit code
    const activeSeed = forcedSeed !== undefined ? forcedSeed : Math.floor(1000 + Math.random() * 9000);
 
    // Trigger Audio rattle
    if (settings.soundEnabled) {
      getAudioSynth().startRattle(4000);
    }
 
    setGameStatus('shaking');
    setIsRevealed(false);
    setSelectedCells([]);
    setWordsFound([]);
    setAiSolutions([]);
    setAiError(null);
    setGameSeed(activeSeed.toString());
 
    // Create a physical rattling interval to randomize faces dynamically during shaker
    let shakeTicks = 0;
    const totalTicks = Math.floor(4000 / 75); // Exactly 53 ticks for 4 seconds
    const rattleTimer = setInterval(() => {
      setGrid(generateSlovenianBoard());
      shakeTicks++;
      
      if (shakeTicks >= totalTicks) { // after exactly 4 seconds
        clearInterval(rattleTimer);
        const finalBoard = generateSlovenianBoardSeeded(activeSeed, settings.boardSize);
        setGrid(finalBoard);
        setTimeLeft(settings.timerDuration);
        setGameStatus('playing');
        setIsRevealed(false);
      }
    }, 75);
  };
 
  const startNewGame = () => handleStartNewGameSeeded();
 
  // Helper to determine points for Slovenian word lengths
  const getBogglePoints = (len: number): number => {
    if (len < 3) return 0;
    if (len === 3 || len === 4) return 1;
    if (len === 5) return 2;
    if (len === 6) return 3;
    if (len === 7) return 5;
    return 11;
  };

  // Helper to manually override the status and score of a guessed word
  const handleOverrideWordStatus = (wordId: string, newStatus: 'valid' | 'invalid') => {
    setWordsFound(prev => prev.map(w => {
      if (w.id === wordId) {
        if (newStatus === 'valid') {
          return {
            ...w,
            status: 'valid',
            points: getBogglePoints(w.word.length)
          };
        } else {
          return {
            ...w,
            status: 'invalid',
            points: 0
          };
        }
      }
      return w;
    }));
  };
 
  // DFS check if word exists on grid
  const checkWordOnGridLocal = (gridLetters: string[][], word: string): boolean => {
    const R = gridLetters.length;
    const C = gridLetters[0].length;
    const cleanedWord = word.toUpperCase().trim();
    if (cleanedWord.length < 3) return false;
 
    const visited: boolean[][] = Array.from({ length: R }, () => Array(C).fill(false));
 
    function dfs(r: number, c: number, wordIdx: number): boolean {
      if (wordIdx === cleanedWord.length) return true;
      if (
        r < 0 || r >= R || c < 0 || c >= C ||
        visited[r][c] || 
        gridLetters[r][c].toUpperCase() !== cleanedWord[wordIdx]
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
  };

  // Word submission logic block, live server-proxied dictionary check with instant loading and robust fallbacks
  const handleWordSubmit = async (word: string) => {
    const uppercaseWord = word.toUpperCase().trim();
    const lowercaseWord = word.toLowerCase().trim();

    if (uppercaseWord.length < 3) return;

    // Check if player has already found this exact word
    if (wordsFound.some(w => w.word === uppercaseWord)) {
      setSelectedCells([]); // clear select path
      return;
    }

    // Insert pending word entry instantly with loading spinner state
    const pendingWordId = Math.random().toString();
    const pendingWordItem: PlayerWord = {
      id: pendingWordId,
      word: uppercaseWord,
      points: 0,
      status: 'loading',
      definition: 'Preverjanje v slovarju...',
      canBeFormedOnBoard: true
    };

    setWordsFound(prev => [pendingWordItem, ...prev]);
    setSelectedCells([]); // clear select path

    try {
      const flatLetters = grid.map(row => row.map(cell => cell.letter));
      const res = await fetch('/api/verify-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: uppercaseWord,
          grid: flatLetters,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const isValid = !!data.isValid;
      const calculatedPoints = isValid ? getBogglePoints(uppercaseWord.length) : 0;

      if (isValid) {
        if (settings.soundEnabled) {
          getAudioSynth().playSuccess();
        }
      }

      setWordsFound(prev => 
        prev.map(w => 
          w.id === pendingWordId 
            ? {
                ...w,
                status: isValid ? 'valid' : 'invalid',
                points: calculatedPoints,
                definition: data.definition || (isValid ? 'Veljavna beseda.' : 'Besede ni v slovarju.'),
                canBeFormedOnBoard: data.canBeFormedOnBoard !== false
              }
            : w
        )
      );

    } catch (err) {
      console.warn("Live API connection failed, using robust client-side fallback validation:", err);
      
      // Fallback verification against local list
      const flatLetters = grid.map(row => row.map(cell => cell.letter));
      const isFallbackValid = SLOVENIAN_WORDS.includes(lowercaseWord);
      const canBeFormed = checkWordOnGridLocal(flatLetters, uppercaseWord);
      const isValid = isFallbackValid && canBeFormed;
      const fallbackPoints = isValid ? getBogglePoints(uppercaseWord.length) : 0;

      if (isValid) {
        if (settings.soundEnabled) {
          getAudioSynth().playSuccess();
        }
      }

      setWordsFound(prev => 
        prev.map(w => 
          w.id === pendingWordId 
            ? {
                ...w,
                status: isValid ? 'valid' : 'invalid',
                points: fallbackPoints,
                definition: isFallbackValid 
                  ? (canBeFormed ? `Veljavna slovenska beseda (${uppercaseWord.length} črk) [Offline preverba].` : 'Besede ni mogoče sestaviti na tej plošči.')
                  : "Neznana ali neveljavna beseda [Offline preverba].",
                canBeFormedOnBoard: canBeFormed
              }
            : w
        )
      );
    }
  };

  // Solve the Board locally using SLOVENIAN_WORDS with instant DFS search
  const solveActiveBoardWithAI = async () => {
    if (gameStatus !== 'ended') return;
    setIsSolving(true);
    setAiError(null);

    try {
      const flatLetters = grid.map(row => row.map(cell => cell.letter));
      const foundWords: Array<{word: string; definition: string; points: number}> = [];

      SLOVENIAN_WORDS.forEach(word => {
        const uppercase = word.toUpperCase().trim();
        if (uppercase.length >= 3 && checkWordOnGridLocal(flatLetters, uppercase)) {
          if (!foundWords.some(f => f.word === uppercase)) {
            foundWords.push({
              word: uppercase,
              points: getBogglePoints(uppercase.length),
              definition: "Vgrajena beseda najdena na plošči."
            });
          }
        }
      });

      foundWords.sort((a, b) => b.points - a.points || b.word.length - a.word.length || a.word.localeCompare(b.word));

      setAiSolutions(foundWords.slice(0, 30));
    } catch (err) {
      console.error("Local solver error:", err);
      setAiError("Odkrivanje besed ni uspelo.");
    } finally {
      setIsSolving(false);
    }
  };

  // Fetch dictionary size on mount from local browser API or Android Javascript Interface integration
  useEffect(() => {
    const fetchDictionarySize = async () => {
      // 1. Android Native WebView Javascript Interface Bridging checks
      const win = window as any;
      if (win.AndroidBridge && typeof win.AndroidBridge.getDictionarySize === 'function') {
        try {
          const size = win.AndroidBridge.getDictionarySize();
          if (typeof size === 'number' && size > 0) {
            setDictionarySize(size);
            return;
          }
        } catch (e) {
          console.warn("Android JavascriptInterface bridge call failed:", e);
        }
      }

      if (win.AndroidInterface && typeof win.AndroidInterface.getDictionarySize === 'function') {
        try {
          const size = win.AndroidInterface.getDictionarySize();
          if (typeof size === 'number' && size > 0) {
            setDictionarySize(size);
            return;
          }
        } catch (e) {
          console.warn("Android JavascriptInterface interface call failed:", e);
        }
      }

      // 2. Local Node/Vite Express Server Endpoint fetch
      try {
        const response = await fetch('/api/dictionary-size');
        if (response.ok) {
          const data = await response.json();
          if (data && typeof data.size === 'number' && data.size > 0) {
            setDictionarySize(data.size);
          }
        }
      } catch (err) {
        console.warn("Could not fetch server dictionary size:", err);
      }
    };

    fetchDictionarySize();
  }, []);

  // Timer loop hooks
  useEffect(() => {
    if (gameStatus === 'playing') {
      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            setGameStatus('ended');
            setIsRevealed(false); // Instantly hide letter layout as requested
            if (settings.soundEnabled) {
              getAudioSynth().playBuzzer();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [gameStatus]);

  // Handle Score aggregates
  const totalScore = wordsFound
    .filter(w => w.status === 'valid' || w.status === 'unchecked')
    .reduce((sum, w) => sum + w.points, 0);

  // Keep gameHistory updated for the ended round
  useEffect(() => {
    if (gameStatus === 'ended' && gameSeed) {
      if (currentRoundSavedRef.current !== gameSeed) {
        currentRoundSavedRef.current = gameSeed;
        setGameHistory(prev => [...prev, totalScore]);
      } else {
        // If already saved, but totalScore has updated (e.g. dictionary check finished), update the last entry
        setGameHistory(prev => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          updated[updated.length - 1] = totalScore;
          return updated;
        });
      }
    }
  }, [gameStatus, totalScore, gameSeed]);

  const panelThemeClass = 'bg-[#1E293B] border border-[#334155] shadow-xl text-slate-100';

  return (
    <div id="game-root-theme-wrapper" className="bg-[#0F172A] text-slate-100 pb-16 min-h-screen font-sans">
      
      {/* 1. Global Navigation / Header Bar */}
      <header className="border-b sticky top-0 z-40 transition-all bg-[#1E293B] border-[#334155] shadow-md text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl flex items-center justify-center bg-blue-600/15 border border-blue-500/30 text-blue-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold tracking-tight text-lg sm:text-xl font-sans uppercase text-white">
                  Boggle <span className="text-blue-500 font-black">SI</span>
                </span>
                <span 
                  className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono flex items-center gap-1"
                  title={`${dictionarySize} vgrajenih slovenskih besed dolžine 3 do 8+ črk`}
                >
                  <span className="w-1 h-1 rounded-full bg-emerald-400" /> lokalni slovar ({dictionarySize})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Help Manual Button */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 bg-neutral-800/40 hover:bg-neutral-800/80 border border-neutral-700/50 text-neutral-300 hover:text-white rounded-xl transition"
              title="Navodila za igranje"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Sound Toggle Button */}
            <button
              onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              className={`p-2 border rounded-xl transition-all ${
                settings.soundEnabled 
                  ? 'bg-amber-500/15 border-amber-500/35 text-amber-400' 
                  : 'bg-neutral-800/40 border-neutral-700/50 text-neutral-500'
              }`}
            >
              {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Configuration Dropdown Dial */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className={`p-2 border rounded-xl transition ${
                  showSettingsDropdown ? 'bg-amber-500 text-black border-amber-500' : 'bg-neutral-800/40 border-neutral-700/50 text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>

              {showSettingsDropdown && (
                <div className="absolute right-0 mt-2.5 w-64 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-4 z-50 text-white animate-fade-in">
                  <h4 className="font-bold text-sm border-b border-neutral-850 pb-2 mb-3 text-amber-400 flex items-center gap-1.5 font-mono">
                    <Settings className="w-4 h-4 text-amber-400" />
                    NASTAVITVE IGRE
                  </h4>
                  
                  {/* Timer Config Options */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 font-mono">
                      Trajanje igre
                    </label>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
                      {[180, 240, 300].map((dur) => (
                        <button
                          key={dur}
                          onClick={() => {
                            setSettings(prev => ({ ...prev, timerDuration: dur }));
                            if (gameStatus === 'idle') setTimeLeft(dur);
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                            settings.timerDuration === dur ? 'bg-amber-500 text-black shadow-md' : 'hover:bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {dur / 60}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Board Size Config Options */}
                  <div className="mb-1 font-sans">
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 font-mono">
                      Velikost mreže
                    </label>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
                      {[4, 5].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setSettings(prev => ({ ...prev, boardSize: size as 4 | 5 }));
                            if (gameStatus === 'idle') {
                               setGrid(size === 4 ? INITIAL_BLANK_GRID_4X4 : INITIAL_BLANK_GRID_5X5);
                            }
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                            settings.boardSize === size ? 'bg-amber-500 text-black shadow-md' : 'hover:bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {size}x{size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Interactive Help Accordion Banner */}
      {showHelp && (
        <section className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border-y border-amber-500/20 py-4 px-4 transition-all">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-neutral-300">
            <div>
              <h4 className="font-bold text-amber-400 flex items-center gap-1.5 mb-1.5 uppercase font-mono">
                <Info className="w-4 h-4 text-amber-400" />
                Slovenski Boggle 5x5
              </h4>
              <p className="text-xs leading-relaxed font-sans text-neutral-400">
                Igra vsebuje izključno slovensko abecedo, vključno z lokalnimi znaki <strong>Č, Š in Ž</strong>. Vse tuje črke (Q, W, X, Y) so odstranjene za pristno slovensko izkušnjo slovotvorja.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-amber-400 flex items-center gap-1.5 mb-1.5 uppercase font-mono">
                <BookOpen className="w-4 h-4 text-amber-400" />
                Pravila Povezovanja
              </h4>
              <p className="text-xs leading-relaxed font-sans text-neutral-400">
                Povlecite s prstom ali miško prek mreže (tudi diagonalno). Vsako posamezno polje na plošči lahko v eni besedi uporabite največ enkrat. Beseda mora vsebovati <strong>vsaj 3 črke</strong>.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-amber-400 flex items-center gap-1.5 mb-1.5 uppercase font-mono">
                <Trophy className="w-4 h-4 text-amber-400" />
                Točkovanje
              </h4>
              <p className="text-xs leading-relaxed font-sans text-neutral-400 font-mono text-amber-100">
                3-4 črke = 1 točka • 5 črk = 2 točki • 6 črk = 3 točke • 7 črk = 5 točk • 8+ črk = 11 točk.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 3. Main Gameplay Grid-Layout */}
      {/* A. DESKTOP/TABLET ONLY VIEW (screen width > 600px) */}
      <main className="desktop-only-view max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Controls & Shaker Grid (Col size 7) */}
        <div className="lg:col-span-7 flex flex-col items-center gap-6 w-full">
          
          {/* Status Display Alert Panel */}
          <div className={`w-full p-4 rounded-3xl ${panelThemeClass} flex flex-col sm:flex-row items-center justify-between gap-4 transition-all`}>
            {gameStatus === 'idle' ? (
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-yellow-500 animate-pulse shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-white font-mono uppercase">Pripravljen na start!</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Vpiši kodo igre ali klikni "Premešaj in začni".</p>
                </div>
              </div>
            ) : gameStatus === 'shaking' ? (
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-amber-500 animate-bounce shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-white font-mono uppercase">Kocke se mešajo...</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Simulacija tresenja plastične škatle z zvokom.</p>
                </div>
              </div>
            ) : gameStatus === 'playing' ? (
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-emerald-500 animate-ping duration-1000 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-white font-mono uppercase">Igra poteka!</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Poišči čim več veljavnih slovenskih besed na plošči.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-red-650 shrink-0 bg-red-500" />
                <div>
                  <h4 className="font-bold text-sm text-white font-mono uppercase">Konec igre!</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Plošča se je zakrila zaradi poštenosti.</p>
                </div>
              </div>
            )}

            {gameSeed && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-950/60 border border-neutral-850 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-neutral-500">Koda plošče:</span>
                <span className="text-xs font-mono font-bold text-amber-400">{gameSeed}</span>
              </div>
            )}
          </div>
 
          {/* Canvas Hourglass Alignment & Interactive 5x5 Grid Wrapper */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full">
            
            {/* Hourglass Timer & Game History Widgets Panel */}
            {(gameStatus === 'playing' || gameStatus === 'ended' || gameStatus === 'idle') && (
              <div className="w-full md:w-[190px] shrink-0 flex flex-col sm:flex-row md:flex-col gap-4 animate-fade-in">
                
                {/* Timer Widget */}
                <div className="flex justify-center flex-1">
                  <HourglassTimer
                    timeLeft={timeLeft}
                    totalDuration={settings.timerDuration}
                    isActive={gameStatus === 'playing'}
                  />
                </div>

                {/* Score board & history panel */}
                <div className={`p-4 rounded-2xl border ${panelThemeClass} flex flex-col gap-3 font-sans w-full sm:max-w-xs md:max-w-none shadow-md`}>
                  <div className="flex items-center gap-2 border-b border-neutral-805 pb-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                    <h4 className="text-xs font-black tracking-wider uppercase font-mono text-neutral-300">
                      Zgodovina iger
                    </h4>
                  </div>

                  {/* List of past games */}
                  <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1.5 pr-1 text-xs font-mono">
                    {gameHistory.length === 0 ? (
                      <span className="text-neutral-500 italic text-[11px] leading-normal font-sans py-2 text-center">
                        Ni še shranjenih rezultatov.
                      </span>
                    ) : (
                      gameHistory.map((score, index) => {
                        let tockWord = 'točk';
                        const lastDigit = score % 10;
                        const lastTwoDigits = score % 100;
                        if (lastTwoDigits === 11 || lastTwoDigits === 12 || lastTwoDigits === 13 || lastTwoDigits === 14) {
                          tockWord = 'točk';
                        } else if (lastDigit === 1) {
                          tockWord = 'točka';
                        } else if (lastDigit === 2) {
                          tockWord = 'točki';
                        } else if (lastDigit === 3 || lastDigit === 4) {
                          tockWord = 'točke';
                        }
                        return (
                          <div key={index} id={`history-game-${index}`} className="flex justify-between items-center text-neutral-300 py-0.5 border-b border-neutral-800/10 last:border-0">
                            <span>Igra {index + 1}</span>
                            <span className="text-amber-400 font-bold">= {score} {tockWord}</span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Total Cumulative Score */}
                  <div className="pt-2 border-t border-neutral-800/40 flex justify-between items-center text-xs font-mono font-bold">
                    <span className="text-neutral-400 uppercase tracking-wide">Skupaj</span>
                    <span className="text-amber-500 text-sm font-black underline decoration-amber-500/30 decoration-2">
                      = {gameHistory.reduce((sum, s) => sum + s, 0)} točk
                    </span>
                  </div>

                  {/* Reset Button */}
                  <button
                    id="clear-history-btn"
                    onClick={() => {
                      setGameHistory([]);
                      currentRoundSavedRef.current = null;
                    }}
                    className="w-full py-1.5 px-3 rounded-xl border border-neutral-800/60 hover:border-neutral-700 bg-neutral-950/40 hover:bg-neutral-950 text-[10px] font-bold font-mono tracking-wider uppercase text-neutral-400 hover:text-neutral-200 transition active:translate-y-[1px]"
                  >
                    Počisti
                  </button>
                </div>
              </div>
            )}
 
            {/* Main Interactive Boggle Grid Component */}
            <BoggleBoard
              grid={grid}
              isRevealed={isRevealed}
              gameStatus={gameStatus}
              selectedCells={selectedCells}
              setSelectedCells={setSelectedCells}
              onSubmitWord={handleWordSubmit}
            />
          </div>
 
          {/* End-Of-Round Face-down Override Controls */}
          {gameStatus === 'ended' && (
            <div className={`w-full p-4 rounded-2xl ${panelThemeClass} flex flex-col md:flex-row items-center gap-4 justify-between animate-fade-in`}>
              <div className="flex items-center gap-2.5">
                <Info className="w-5 h-5 text-amber-400" />
                <p className="text-xs text-neutral-300 leading-normal font-sans">
                  Ko se čas izteče, se mreža zakrije zaradi poštenosti. Kliknite gumb desno za ponovni vpogled v ploščo za preverjanje besed s prijatelji.
                </p>
              </div>
              
              <button
                id="reveal-board-btn"
                onClick={() => setIsRevealed(!isRevealed)}
                className={`w-full md:w-auto shrink-0 flex items-center justify-center gap-2 py-2 px-5 rounded-2xl border text-xs font-bold font-mono transition ${
                  isRevealed 
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700' 
                    : 'bg-amber-500 border-amber-400 text-black hover:bg-amber-400 font-extrabold'
                }`}
              >
                {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {isRevealed ? 'Skrij Ploščo' : 'Razkrij Ploščo'}
              </button>
            </div>
          )}
 
        </div>
 
        {/* RIGHT COLUMN: Reorganized controls and play history (Col size 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          
          {/* a. "PREMEŠAJ IN ZAČNI" (Shuffle & Start) Section */}
          <div className={`p-5 rounded-3xl ${panelThemeClass} flex flex-col gap-3 relative overflow-hidden transition-all shadow-xl`}>
            <div>
              <h3 className="font-extrabold tracking-wide uppercase font-mono text-xs text-amber-400 mb-1 animate-pulse">
                Nova igra (Solo / Host)
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">Generiraj novo naključno slovensko ploščo s 4-mestno kodo.</p>
            </div>
            
            <button
              id="shuffle-start-btn"
              onClick={() => handleStartNewGameSeeded()}
              disabled={gameStatus === 'shaking'}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-extrabold transition active:translate-y-[2px] disabled:opacity-45 select-none uppercase font-mono tracking-wide shadow-lg bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/20 shadow-[0_4px_0_#1D4ED8]"
            >
              <RotateCcw className="w-4 h-4" />
              Premešaj in začni
            </button>
            
            {gameSeed && (
              <div className="flex items-center justify-between bg-neutral-950/40 p-3 rounded-2xl border border-neutral-900 mt-1">
                <span className="text-xs text-neutral-400 font-sans">Koda trenutne igre:</span>
                <span className="text-base font-mono font-extrabold text-amber-400 bg-neutral-950 px-3 py-1 rounded-xl border border-neutral-800">
                  {gameSeed}
                </span>
              </div>
            )}
          </div>

          {/* b. "Multiplayer" Seed Input Section */}
          <div className={`p-5 rounded-3xl ${panelThemeClass} flex flex-col gap-3 relative overflow-hidden transition-all shadow-xl`}>
            <div>
              <h3 className="font-extrabold tracking-wide uppercase font-mono text-xs text-cyan-400 mb-1">
                Način igranja z več igralci
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">Za igranje povsem identične plošče s prijateljem vpiši njegovo kodo spodaj.</p>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={4}
                  value={seedInput}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, '');
                    setSeedInput(cleaned);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && seedInput.length === 4) {
                      const parsed = parseInt(seedInput, 10);
                      if (!isNaN(parsed) && parsed >= 1000 && parsed <= 9999) {
                        handleStartNewGameSeeded(parsed);
                      }
                    }
                  }}
                  placeholder="Koda igre"
                  className="w-full bg-neutral-950 text-slate-100 placeholder-neutral-700 font-mono text-center text-sm font-bold tracking-widest rounded-xl border border-neutral-800 focus:border-amber-500/50 outline-none px-3 py-3 h-[46px]"
                />
              </div>
              <button
                id="join-seeded-btn"
                onClick={() => {
                  const parsed = parseInt(seedInput, 10);
                  if (!isNaN(parsed) && parsed >= 1000 && parsed <= 9999) {
                    handleStartNewGameSeeded(parsed);
                  }
                }}
                disabled={seedInput.length !== 4 || gameStatus === 'shaking'}
                className={`py-3 px-5 text-xs font-bold font-mono uppercase tracking-wide rounded-xl transition-all ${
                  seedInput.length === 4 && gameStatus !== 'shaking'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                    : 'bg-neutral-800 border border-neutral-850 text-neutral-500 cursor-not-allowed opacity-50'
                }`}
              >
                Pridruži se
              </button>
            </div>
          </div>

          {/* c. "NAJDENE BESEDE" (Found Words) List Section */}
          <div className={`p-5 rounded-3xl ${panelThemeClass} flex flex-col gap-4 relative overflow-hidden transition-all shadow-xl`}>
            
            <div className="flex items-center justify-between border-b border-neutral-800/40 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="font-extrabold tracking-wide uppercase font-mono text-sm text-neutral-200">
                  NAJDENE BESEDE
                </h3>
              </div>
              
              {/* Score counter badge */}
              <div className="flex items-center gap-2 bg-neutral-950/60 border border-neutral-800 px-3 py-1.5 rounded-2xl">
                <span className="text-xs font-mono font-medium text-neutral-400 uppercase">Točke:</span>
                <span className="text-xl font-mono font-extrabold text-amber-400">{totalScore}</span>
              </div>
            </div>

            {/* List of found words with custom cross-out validation formatting */}
            <div className="max-h-[340px] overflow-y-auto pr-1 flex flex-col gap-2">
              {wordsFound.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-xs italic font-sans leading-relaxed">
                  Ni še oddanih besed. Povlecite prst ali miško prek črk na plošči in nato kliknite "Oddaj"!
                </div>
              ) : (
                wordsFound.map((w) => {
                  return (
                    <div 
                      key={w.id} 
                      className={`flex flex-col p-3 rounded-2xl border transition-all text-xs leading-normal ${
                        w.status === 'valid' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-100 hover:bg-emerald-950/35' :
                        w.status === 'invalid' ? 'bg-red-950/15 border-red-500/10 text-neutral-450 hover:bg-red-950/20 opacity-80' :
                        w.status === 'loading' ? 'bg-neutral-900 border-neutral-805 text-neutral-300 animate-pulse' :
                        'bg-yellow-950/10 border-yellow-500/10 text-yellow-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold uppercase gap-2">
                        <span className={`text-sm font-semibold tracking-wider text-white truncate max-w-[130px] sm:max-w-none ${w.status === 'invalid' ? 'line-through text-red-400/85 opacity-60' : ''}`}>
                          {w.word}
                        </span>
                        
                        <div className="flex items-center gap-1.5 sm:gap-2 font-mono shrink-0">
                          {/* Manual Validation Override Buttons */}
                          {w.status !== 'loading' && (
                            <div className="flex items-center border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950/80 shrink-0 select-none">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOverrideWordStatus(w.id, 'valid');
                                }}
                                disabled={w.status === 'valid'}
                                title="Odobri"
                                className={`px-2 py-0.5 text-xs font-bold transition-all outline-none ${
                                  w.status === 'valid'
                                    ? 'text-emerald-500 bg-emerald-500/15 cursor-default'
                                    : 'text-neutral-500 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95 cursor-pointer'
                                }`}
                              >
                                ✓
                              </button>
                              <div className="w-[1px] h-3 bg-neutral-800" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOverrideWordStatus(w.id, 'invalid');
                                }}
                                disabled={w.status === 'invalid'}
                                title="Zavrni"
                                className={`px-2 py-0.5 text-xs font-bold transition-all outline-none ${
                                  w.status === 'invalid'
                                    ? 'text-red-500 bg-red-400/15 cursor-default'
                                    : 'text-neutral-500 hover:text-red-400 hover:bg-red-400/10 active:scale-95 cursor-pointer'
                                }`}
                              >
                                ✗
                              </button>
                            </div>
                          )}

                          {w.status === 'valid' && (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded-lg text-[10px] tracking-wide whitespace-nowrap">
                              +{w.points} {w.points === 1 ? 'točka' : w.points === 2 ? 'točki' : w.points >= 5 ? 'točk' : 'točke'}
                            </span>
                          )}
                          {w.status === 'invalid' && (
                            <span className="bg-red-500/10 text-red-400/80 border border-red-500/30 font-semibold px-2 py-0.5 rounded-lg text-[10px] tracking-wide whitespace-nowrap">
                              Neveljavna (0 točk)
                            </span>
                          )}
                          {w.status === 'loading' && (
                            <div className="h-3 w-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          )}
                          {w.status === 'unchecked' && (
                            <span className="bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 font-semibold px-2 py-0.5 rounded-lg text-[10px] tracking-wide whitespace-nowrap">
                              Napotek
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Vocabulary description / meaning block */}
                      <p className={`mt-1.5 font-sans text-xs text-neutral-400 leading-normal ${w.status === 'invalid' ? 'line-through opacity-50' : ''}`}>
                        {w.definition}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
 
        </div>
      </main>

      {/* B. MOBILE-ONLY PORTRAIT VIEW (screen width < 600px) */}
      <main className="mobile-only-view max-w-md mx-auto px-4 mt-6 flex flex-col gap-5 items-center w-full">
        
        {/* TOP: Compact Timer/Hourglass + Game Seed/Code with Guest Join options */}
        <section className={`w-full p-4 rounded-3xl ${panelThemeClass} flex flex-col gap-3 shadow-lg`}>
          <div className="flex items-center justify-between w-full">
            {/* Real-time Hourglass Component */}
            <div className="shrink-0 scale-90 -my-2">
              <HourglassTimer
                timeLeft={timeLeft}
                totalDuration={settings.timerDuration}
                isActive={gameStatus === 'playing'}
              />
            </div>

            {/* Game seed and Multiplayer Join Section */}
            <div className="flex-1 flex flex-col items-end gap-1.5 text-right pl-2">
              {gameSeed ? (
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Koda plošče (Host):</span>
                  <span className="text-sm font-mono font-black text-[#FACC15] bg-neutral-950 px-3 py-1 rounded-xl border border-neutral-800">
                    {gameSeed}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-neutral-400 italic">Premešaj za kodo</span>
              )}

              {/* Guest Enter Code Panel */}
              <div className="flex flex-col gap-2 justify-end items-stretch mt-1.5 w-full max-w-[150px]">
                <input
                  type="text"
                  maxLength={4}
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Koda sobe"
                  className="w-full bg-neutral-950 text-slate-100 placeholder-neutral-700 font-mono text-center text-xs font-bold rounded-xl border border-neutral-850 focus:border-amber-500/50 outline-none px-2 py-2 h-[34px]"
                />
                <button
                  onClick={() => {
                    const parsed = parseInt(seedInput, 10);
                    if (!isNaN(parsed) && parsed >= 1000 && parsed <= 9999) {
                      handleStartNewGameSeeded(parsed);
                    }
                  }}
                  disabled={seedInput.length !== 4 || gameStatus === 'shaking'}
                  className="w-full bg-amber-500 disabled:bg-neutral-800 disabled:opacity-45 text-black disabled:text-neutral-500 text-[10px] font-mono uppercase font-bold rounded-xl transition-all h-[34px]"
                >
                  Pridruži se
                </button>
              </div>
            </div>
          </div>

          {/* Quick Start & Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => handleStartNewGameSeeded()}
              disabled={gameStatus === 'shaking'}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold bg-amber-500 disabled:opacity-50 text-black text-xs uppercase tracking-wide transition active:translate-y-[1px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Premešaj
            </button>
            {gameStatus === 'ended' ? (
              <button
                onClick={() => setIsRevealed(!isRevealed)}
                className={`py-2 px-3 rounded-xl font-bold text-xs uppercase transition active:translate-y-[1px] ${
                  isRevealed
                    ? 'bg-neutral-800 border border-neutral-700 text-neutral-300'
                    : 'bg-amber-500 hover:bg-amber-400 text-black'
                }`}
              >
                {isRevealed ? 'SKRIJ ČRKE' : 'PRIKAŽI ČRKE'}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (gameStatus === 'playing') {
                    setTimeLeft(0);
                    setGameStatus('ended');
                    setIsRevealed(false);
                  } else {
                    handleStartNewGameSeeded();
                  }
                }}
                className="py-2 px-3 rounded-xl font-bold bg-[#1E293B] border border-[#334155] text-white text-xs uppercase transition active:translate-y-[1px]"
              >
                {gameStatus === 'playing' ? 'Zaključi' : 'Začni'}
              </button>
            )}
          </div>
        </section>

        {/* GAME HISTORY & SCORE TRACKER (Mobile) */}
        <section className={`w-full p-4 rounded-3xl ${panelThemeClass} flex flex-col gap-3 shadow-lg font-sans`}>
          <div className="flex items-center gap-2 border-b border-neutral-800/20 pb-2">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <h4 className="text-xs font-black tracking-wider uppercase font-mono text-neutral-300">
              Zgodovina iger
            </h4>
          </div>

          {/* List of past games */}
          <div className="max-h-[100px] overflow-y-auto flex flex-col gap-1.5 pr-1 text-xs font-mono">
            {gameHistory.length === 0 ? (
              <span className="text-neutral-500 italic text-[11px] py-1 text-center font-sans leading-normal">
                Ni še shranjenih rezultatov.
              </span>
            ) : (
              gameHistory.map((score, index) => {
                let tockWord = 'točk';
                const lastDigit = score % 10;
                const lastTwoDigits = score % 100;
                if (lastTwoDigits === 11 || lastTwoDigits === 12 || lastTwoDigits === 13 || lastTwoDigits === 14) {
                  tockWord = 'točk';
                } else if (lastDigit === 1) {
                  tockWord = 'točka';
                } else if (lastDigit === 2) {
                  tockWord = 'točki';
                } else if (lastDigit === 3 || lastDigit === 4) {
                  tockWord = 'točke';
                }
                return (
                  <div key={index} className="flex justify-between items-center text-neutral-300 py-0.5 border-b border-neutral-805/10 last:border-0">
                    <span>Igra {index + 1}</span>
                    <span className="text-amber-400 font-bold">= {score} {tockWord}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Total Cumulative Score */}
          <div className="pt-2 border-t border-neutral-800/40 flex justify-between items-center text-xs font-mono font-bold">
            <span className="text-neutral-400 uppercase tracking-wide">Skupaj</span>
            <span className="text-amber-500 text-sm font-black underline decoration-amber-500/30 decoration-2">
              = {gameHistory.reduce((sum, s) => sum + s, 0)} točk
            </span>
          </div>

          {/* Počisti (Reset) Button */}
          <button
            onClick={() => {
              setGameHistory([]);
              currentRoundSavedRef.current = null;
            }}
            className="w-full py-1.5 px-3 rounded-xl border border-neutral-800/60 hover:border-neutral-700 bg-neutral-950/40 hover:bg-neutral-950 text-xs font-mono tracking-wider font-bold uppercase text-neutral-400 hover:text-neutral-200 transition active:translate-y-[1px]"
          >
            Počisti
          </button>
        </section>

        {/* STATUS BAR ALERT */}
        <div className={`w-full py-2.5 px-4 rounded-2xl ${panelThemeClass} text-center text-xs font-mono font-bold uppercase`}>
          {gameStatus === 'idle' ? 'Pripravljen na igro!' :
           gameStatus === 'shaking' ? 'Mešanje kock...' :
           gameStatus === 'playing' ? 'Iskanje besed v teku...' : 'Čas se je iztekel! Mreža zakrita.'}
        </div>

        {/* CENTER: 5x5 Grid Board (takes 95% screen width and is finger tap-n-drag playable) */}
        <section className="w-full flex justify-center">
          <BoggleBoard
            grid={grid}
            isRevealed={isRevealed}
            gameStatus={gameStatus}
            selectedCells={selectedCells}
            setSelectedCells={setSelectedCells}
            onSubmitWord={handleWordSubmit}
          />
        </section>

        {/* BOTTOM: "Počisti" and "Oddaj" buttons (included inside BoggleBoard) + Scrollable found words */}
        <section className={`w-full p-4 rounded-3xl ${panelThemeClass} flex flex-col gap-3 shadow-md`}>
          <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold tracking-wide uppercase font-mono text-xs text-neutral-300">
                Najdene besede
              </h3>
            </div>
            
            <div className="bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-xl flex items-center gap-1">
              <span className="text-[10px] font-mono text-neutral-500 uppercase">Točke:</span>
              <span className="text-base font-mono font-black text-[#FACC15]">{totalScore}</span>
            </div>
          </div>

          <div className="max-h-[180px] overflow-y-auto flex flex-col gap-2 pr-1">
            {wordsFound.length === 0 ? (
              <div className="text-center py-8 text-neutral-550 text-xs italic text-neutral-500">
                Brez oddanih besed. Povlecite prst prek črk in kliknite "Oddaj"!
              </div>
            ) : (
              wordsFound.map((w) => (
                <div 
                  key={w.id} 
                  className={`flex flex-col p-2.5 rounded-xl border transition-all text-xs ${
                    w.status === 'valid' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-100' :
                    w.status === 'invalid' ? 'bg-red-950/15 border-red-500/10 text-neutral-450 opacity-85' :
                    w.status === 'loading' ? 'bg-neutral-900 border-neutral-805 text-neutral-300 animate-pulse' :
                    'bg-yellow-950/10 border-yellow-500/10 text-yellow-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold uppercase gap-2">
                    <span className={`text-[13px] font-black tracking-wider text-white truncate max-w-[120px] ${w.status === 'invalid' ? 'line-through text-red-400/80 opacity-60' : ''}`}>
                      {w.word}
                    </span>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Manual Validation Override Buttons (Mobile) */}
                      {w.status !== 'loading' && (
                        <div className="flex items-center border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950/80 shrink-0 select-none">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOverrideWordStatus(w.id, 'valid');
                            }}
                            disabled={w.status === 'valid'}
                            title="Odobri"
                            className={`px-1.5 py-0.5 text-[10px] font-bold transition-all outline-none ${
                              w.status === 'valid'
                                ? 'text-emerald-500 bg-emerald-500/15 cursor-default'
                                : 'text-neutral-500 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95 cursor-pointer'
                            }`}
                          >
                            ✓
                          </button>
                          <div className="w-[1px] h-3 bg-neutral-800" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOverrideWordStatus(w.id, 'invalid');
                            }}
                            disabled={w.status === 'invalid'}
                            title="Zavrni"
                            className={`px-1.5 py-0.5 text-[10px] font-bold transition-all outline-none ${
                              w.status === 'invalid'
                                ? 'text-red-500 bg-red-400/15 cursor-default'
                                : 'text-neutral-500 hover:text-red-400 hover:bg-red-400/10 active:scale-95 cursor-pointer'
                            }`}
                          >
                            ✗
                          </button>
                        </div>
                      )}

                      <div>
                        {w.status === 'valid' && (
                          <span className="text-emerald-400 text-[10px] font-mono">
                            +{w.points}t
                          </span>
                        )}
                        {w.status === 'invalid' && (
                          <span className="text-red-400/80 text-[10px] font-mono">
                            0t
                          </span>
                        )}
                        {w.status === 'loading' && (
                          <div className="h-2.5 w-2.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </div>
                  </div>
                  {w.definition && (
                    <p className={`mt-1 font-sans text-[11px] text-neutral-400 leading-normal ${w.status === 'invalid' ? 'line-through opacity-50' : ''}`}>
                      {w.definition}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

      </main>

      {/* 4. Complete Kotlin Android Developer Source Deck */}
      <section className="max-w-6xl mx-auto px-4 mt-8">
        <AndroidReference />
      </section>

    </div>
  );
}
