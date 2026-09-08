package com.slovenian.boggle

import android.content.Context
import java.io.BufferedReader
import java.io.InputStreamReader

/**
 * Slovenian dice distribution, point calculators, seeded randomizations,
 * and high-accuracy offline lemma checks inside a single package module.
 */
object SlovenianDictionary {

    val SlovenianDice = listOf(
        "AAAFRS", "AAEEEE", "AAFIRS", "ADENNN", "AEEEEM",
        "AEEGMU", "AEGMNN", "AFIRST", "BJKČŠŽ", "CCENST",
        "CEIILT", "CEILPT", "CEIPST", "DDHNOT", "DHHLOR",
        "DHLNOR", "DLNOTV", "EIIITT", "EMOTTT", "ENSSSU",
        "FIPRST", "GORRVZ", "HIPRRL", "NOOTUV", "OOOTTE"
    )

    var LocalLemmas = listOf(
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
    )

    val localLemmas: List<String> get() = LocalLemmas

    fun load(context: Context) {
        try {
            val words = mutableListOf<String>()
            context.assets.open("besede.txt").bufferedReader().useLines { lines ->
                lines.forEach { line ->
                    val trimmed = line.trim()
                    if (trimmed.isNotEmpty()) {
                        words.add(trimmed.uppercase())
                    }
                }
            }
            if (words.isNotEmpty()) {
                LocalLemmas = words
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    class SeededRandom(seedValue: Long) {
        private var seed = seedValue

        fun nextDouble(): Double {
            seed = (seed + 0x6d2b79f5L) and 0xffffffffL
            var t = seed
            t = ((t xor (t ushr 15)) * (t or 1L)) and 0xffffffffL
            t = t xor (t + ((t xor (t ushr 7)) * (t or 61L))) and 0xffffffffL
            val resultLong = ((t xor (t ushr 14)) ushr 0)
            return resultLong.toDouble() / 4294967296.0
        }

        fun <T> shuffle(list: List<T>): List<T> {
            val copy = list.toMutableList()
            for (i in copy.size - 1 downTo 1) {
                val j = (nextDouble() * (i + 1)).toInt()
                val temp = copy[i]
                copy[i] = copy[j]
                copy[j] = temp
            }
            return copy
        }
    }

    fun adjustSlovenianBoardLetters(letters: List<Char>, doubleProvider: () -> Double): List<Char> {
        val result = letters.toMutableList()
        val slovenianVowels = listOf('A', 'E', 'I', 'O', 'U')
        
        // High-frequency Slovenian consonants
        val highFreqConsonants = listOf('R', 'S', 'T', 'L', 'N', 'M', 'D', 'V')
        // Rare consonants in Slovenian language
        val rareConsonants = listOf('F', 'G', 'H', 'P', 'B')
        // Moderate frequency consonants
        val moderateConsonants = listOf('C', 'Č', 'J', 'K', 'Š', 'Z', 'Ž')
        
        // Custom pool to draw high-frequency consonants from
        val highFreqPool = listOf(
            'R', 'R', 'S', 'S', 'T', 'T', 'L', 'L', 'N', 'N', 'M', 'M', 'D', 'V'
        )

        // Upgrade rare consonants with 50% probability to high-frequency ones for smarter frequencies
        for (i in result.indices) {
            val char = result[i]
            if (char in rareConsonants) {
                if (doubleProvider() < 0.5) {
                    val idx = (doubleProvider() * highFreqPool.size).toInt()
                    result[i] = highFreqPool[idx]
                }
            }
        }

        val allSlovenianLetters = slovenianVowels + highFreqConsonants + moderateConsonants + rareConsonants

        var attempts = 0
        while (attempts < 15) {
            val counts = mutableMapOf<Char, Int>()
            allSlovenianLetters.forEach { counts[it] = 0 }
            result.forEach { l ->
                counts[l] = (counts[l] ?: 0) + 1
            }

            val excessIndices = mutableListOf<Int>()
            val tracker = mutableMapOf<Char, Int>()
            result.forEachIndexed { idx, l ->
                tracker[l] = (tracker[l] ?: 0) + 1
                val maxAllowed = if (l in rareConsonants) 1 else 3
                if ((tracker[l] ?: 0) > maxAllowed) {
                    excessIndices.add(idx)
                }
            }

            if (excessIndices.isEmpty()) {
                break
            }

            // Replace excess indices
            for (idx in excessIndices) {
                val originalValue = result[idx]
                val isVowel = slovenianVowels.contains(originalValue)

                val currentCounts = mutableMapOf<Char, Int>()
                allSlovenianLetters.forEach { currentCounts[it] = 0 }
                result.forEach { l ->
                    currentCounts[l] = (currentCounts[l] ?: 0) + 1
                }

                if (isVowel) {
                    val candidates = slovenianVowels.filter { (currentCounts[it] ?: 0) < 3 }
                    if (candidates.isNotEmpty()) {
                        val chosenIdx = (doubleProvider() * candidates.size).toInt()
                        result[idx] = candidates[chosenIdx]
                    }
                } else {
                    val candidates = highFreqPool.filter { (currentCounts[it] ?: 0) < 3 }
                    if (candidates.isNotEmpty()) {
                        val chosenIdx = (doubleProvider() * candidates.size).toInt()
                        result[idx] = candidates[chosenIdx]
                    } else {
                        val fallback = moderateConsonants.filter { (currentCounts[it] ?: 0) < 3 }
                        if (fallback.isNotEmpty()) {
                            val chosenIdx = (doubleProvider() * fallback.size).toInt()
                            result[idx] = fallback[chosenIdx]
                        }
                    }
                }
            }

            attempts++
        }

        return result
    }

    fun hasAdjacentAt(letters: List<Char>, idx: Int): Boolean {
        val r = idx / 5
        val c = idx % 5
        val char = letters[idx]
        for (dr in -1..1) {
            for (dc in -1..1) {
                if (dr == 0 && dc == 0) continue
                val nr = r + dr
                val nc = c + dc
                if (nr in 0..4 && nc in 0..4) {
                    val nidx = nr * 5 + nc
                    if (letters[nidx] == char) {
                        return true
                    }
                }
            }
        }
        return false
    }

    fun resolveIdenticalAdjacencies(letters: List<Char>, doubleProvider: () -> Double): List<Char> {
        val result = letters.toMutableList()
        
        for (pass in 0 until 20) {
            val violatingIndices = mutableListOf<Int>()
            for (r in 0 until 5) {
                for (c in 0 until 5) {
                    val idx = r * 5 + c
                    val char = result[idx]
                    var hasAdjacency = false
                    for (dr in -1..1) {
                        for (dc in -1..1) {
                            if (dr == 0 && dc == 0) continue
                            val nr = r + dr
                            val nc = c + dc
                            if (nr in 0..4 && nc in 0..4) {
                                val nidx = nr * 5 + nc
                                if (result[nidx] == char) {
                                    hasAdjacency = true
                                    break
                                }
                            }
                        }
                        if (hasAdjacency) break
                    }
                    if (hasAdjacency) {
                        violatingIndices.add(idx)
                    }
                }
            }
            
            if (violatingIndices.isEmpty()) {
                break
            }
            
            for (idx in violatingIndices) {
                val indicesToTry = (0 until 25).toMutableList()
                // Shuffle indicesToTry
                for (i in indicesToTry.size - 1 downTo 1) {
                    val j = (doubleProvider() * (i + 1)).toInt()
                    val temp = indicesToTry[i]
                    indicesToTry[i] = indicesToTry[j]
                    indicesToTry[j] = temp
                }
                
                var swapped = false
                for (targetIdx in indicesToTry) {
                    if (targetIdx == idx) continue
                    if (result[targetIdx] == result[idx]) continue
                    
                    val tempChar = result[idx]
                    result[idx] = result[targetIdx]
                    result[targetIdx] = tempChar
                    
                    if (!hasAdjacentAt(result, idx) && !hasAdjacentAt(result, targetIdx)) {
                        swapped = true
                        break
                    } else {
                        result[targetIdx] = result[idx]
                        result[idx] = tempChar
                    }
                }
                
                if (!swapped) {
                    val randomTarget = (doubleProvider() * 25).toInt()
                    if (randomTarget != idx && result[randomTarget] != result[idx]) {
                        val temp = result[idx]
                        result[idx] = result[randomTarget]
                        result[randomTarget] = temp
                    }
                }
            }
        }
        return result
    }

    fun ensureShumniki(letters: List<Char>, doubleProvider: () -> Double): List<Char> {
        val result = letters.toMutableList()
        val shumniki = listOf('Č', 'Š', 'Ž')
        val count = result.count { it in shumniki }

        if (count in 1..3) {
            return result
        }

        if (count == 0) {
            val numToReplace = (doubleProvider() * 2).toInt() + 1 // 1 or 2
            for (k in 0 until numToReplace) {
                val rareConsonants = listOf('F', 'G', 'H', 'P', 'B')
                var candidates = result.indices.filter { result[it] in rareConsonants }

                if (candidates.isEmpty()) {
                    val moderateConsonants = listOf('C', 'J', 'K', 'Z')
                    candidates = result.indices.filter { result[it] in moderateConsonants }
                }

                if (candidates.isEmpty()) {
                    val vowels = listOf('A', 'E', 'I', 'O', 'U')
                    candidates = result.indices.filter { result[it] !in vowels }
                }

                if (candidates.isNotEmpty()) {
                    val replaceIdx = candidates[(doubleProvider() * candidates.size).toInt()]
                    result[replaceIdx] = shumniki[(doubleProvider() * shumniki.size).toInt()]
                }
            }
        } else if (count > 3) {
            val highFreqConsonants = listOf('R', 'S', 'T', 'L', 'N', 'M', 'D', 'V')
            val shumnikIndices = result.indices.filter { result[it] in shumniki }.toMutableList()

            val excessCount = count - 3
            for (k in 0 until excessCount) {
                if (shumnikIndices.isNotEmpty()) {
                    val removeIdx = shumnikIndices.removeAt((doubleProvider() * shumnikIndices.size).toInt())
                    result[removeIdx] = highFreqConsonants[(doubleProvider() * highFreqConsonants.size).toInt()]
                }
            }
        }

        return result
    }

    /**
     * Gen deterministic board array of 25 nodes chunked inside 5x5 Grid.
     */
    fun generateBoard(seed: Long): List<List<Char>> {
        val prng = SeededRandom(seed)
        var finalLetters = listOf<Char>()
        var attempts = 0

        while (attempts < 1000) {
            val shuffledDice = prng.shuffle(SlovenianDice)
            val rawLetters = mutableListOf<Char>()
            shuffledDice.forEach { die ->
                val randomFaceIdx = (prng.nextDouble() * 6).toInt()
                rawLetters.add(die[randomFaceIdx])
            }

            val adjustedLetters = adjustSlovenianBoardLetters(rawLetters) { prng.nextDouble() }
            val resolvedLetters = resolveIdenticalAdjacencies(adjustedLetters) { prng.nextDouble() }
            
            val vowelCount = resolvedLetters.count { l -> l in listOf('A', 'E', 'I', 'O', 'U') }
            
            // Center 3x3 indices: 6, 7, 8, 11, 12, 13, 16, 17, 18
            val centerIndices = listOf(6, 7, 8, 11, 12, 13, 16, 17, 18)
            val centerVowelsCount = centerIndices.count { idx -> resolvedLetters[idx] in listOf('A', 'E', 'I', 'O', 'U') }
            
            val consonants = resolvedLetters.filter { l -> l !in listOf('A', 'E', 'I', 'O', 'U') }
            val highFreqConsonantsCount = consonants.count { l -> l in listOf('R', 'S', 'T', 'L', 'N', 'M', 'D', 'V') }
            
            val shumnikiCount = resolvedLetters.count { l -> l in listOf('Č', 'Š', 'Ž') }

            // Dynamic thresholds with relaxation to prevent getting stuck
            var targetMinVowels = 9
            var targetMaxVowels = 10
            var targetMinCenterVowels = 4
            var targetMinHighFreqConsonants = 10
            var targetMinShumniki = 1
            var targetMaxShumniki = 3

            if (attempts > 800) {
                targetMinVowels = 8
                targetMaxVowels = 11
                targetMinCenterVowels = 3
                targetMinHighFreqConsonants = 8
            } else if (attempts > 950) {
                targetMinVowels = 7
                targetMaxVowels = 12
                targetMinCenterVowels = 2
                targetMinHighFreqConsonants = 7
            }

            if (vowelCount in targetMinVowels..targetMaxVowels &&
                centerVowelsCount >= targetMinCenterVowels &&
                highFreqConsonantsCount >= targetMinHighFreqConsonants &&
                shumnikiCount in targetMinShumniki..targetMaxShumniki
            ) {
                finalLetters = resolvedLetters
                break
            }
            attempts++
        }

        var boardLetters = finalLetters
        if (boardLetters.isEmpty()) {
            val shuffledDice = prng.shuffle(SlovenianDice)
            val rawLetters = shuffledDice.map { die -> die[(prng.nextDouble() * 6).toInt()] }
            val adjusted = adjustSlovenianBoardLetters(rawLetters) { prng.nextDouble() }
            boardLetters = resolveIdenticalAdjacencies(adjusted) { prng.nextDouble() }
        }

        // Guarantee shumniki count & resolve any potential resulting adjacencies
        var finalWithShumniki = ensureShumniki(boardLetters) { prng.nextDouble() }
        if (finalWithShumniki != boardLetters) {
            finalWithShumniki = resolveIdenticalAdjacencies(finalWithShumniki) { prng.nextDouble() }
        }

        val gridResult = mutableListOf<MutableList<Char>>()
        for (row in 0 until 5) {
            val rowList = mutableListOf<Char>()
            for (col in 0 until 5) {
                val index = row * 5 + col
                rowList.add(finalWithShumniki[index])
            }
            gridResult.add(rowList)
        }
        return gridResult
    }

    fun calculatePoints(wordLength: Int): Int {
        return when (wordLength) {
            0, 1, 2 -> 0
            3, 4 -> 1
            5 -> 2
            6 -> 3
            7 -> 5
            else -> 11
        }
    }

    /**
     * Checks if word is highly probable to be Slovenian offline.
     */
    fun verifySlovenianWord(word: String): WordValidationResult {
        val upperWord = word.uppercase().trim()
        
        if (upperWord.length < 3) {
            return WordValidationResult(false, "Prekratka beseda (najmanj 3 črke).", 0)
        }

        // Standard letters Check (avoid non-Slovenian letters like Y, Q, W, X)
        if (upperWord.any { it in "QWXY" }) {
            return WordValidationResult(false, "Vsebuje tuje črke (Q, W, X, Y).", 0)
        }

        // Direct database match
        if (LocalLemmas.contains(upperWord)) {
            return WordValidationResult(true, "Potrjena slovenska beseda.", calculatePoints(upperWord.length))
        }

        // Check dictionary stems + suffixes
        val commonEndings = listOf("IJI", "EVI", "EVE", "EVA", "EJU", "AMA", "AMI", "AH", "EM", "OM", "IH", "JO", "TA", "TI", "TE", "MO", "A", "E", "I", "O", "U")
        for (ending in commonEndings) {
            if (upperWord.endsWith(ending)) {
                val stem = upperWord.dropLast(ending.length)
                if (stem.length >= 3 && LocalLemmas.contains(stem)) {
                    return WordValidationResult(
                        true, 
                        "Slovnična oblika besede \"$stem\".", 
                        calculatePoints(upperWord.length)
                    )
                }
            }
        }

        // Syllabic heuristic (needs at least one vowel or vocalic R)
        val hasVowels = upperWord.any { it in "AEIOUR" }
        // Slovene clusters shouldn't have too many straight consonants
        var consecutiveConsonants = 0
        var tooManyConsonants = false
        for (char in upperWord) {
            if (char in "AEIOU") {
                consecutiveConsonants = 0
            } else {
                consecutiveConsonants++
                if (consecutiveConsonants >= 4) {
                    tooManyConsonants = true
                }
            }
        }

        if (hasVowels && !tooManyConsonants) {
            val part = when {
                upperWord.endsWith("TI") || upperWord.endsWith("ČI") || upperWord.endsWith("AT") -> "Glagol"
                upperWord.endsWith("AP") || upperWord.endsWith("IN") || upperWord.endsWith("EN") || upperWord.endsWith("AST") -> "Pridevnik"
                else -> "Samostalnik"
            }
            return WordValidationResult(true, "$part: verjetna slovenska beseda.", calculatePoints(upperWord.length))
        }

        return WordValidationResult(false, "Neusklajen niz glasov (ni veljavna beseda).", 0)
    }

    data class WordValidationResult(
        val isValid: Boolean,
        val definition: String,
        val points: Int
    )
}
