/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Smartphone, Code, Play, FolderMinus, FileCode } from 'lucide-react';

export const AndroidReference: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ui' | 'sound' | 'logic'>('ui');

  const kotlinUiCode = `
package com.slovenian.boggle.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

/**
 * 5x5 Slovenian Boggle Grid with continuous gesture tracing and shaking animations.
 */
@Composable
fun BoggleGrid5x5(
    grid: List<List<Char>>,
    isShaking: Boolean,
    isHidingLetters: Boolean,
    selectedCoordinates: List<Pair<Int, Int>>,
    onCellTrace: (row: Int, col: Int) => Unit,
    onTraceEnd: () => Unit
) {
    // Shaking Animation Offset setup
    val infiniteTransition = rememberInfiniteTransition(label = "shake")
    val shakeOffset by infiniteTransition.animateFloat(
        initialValue = -10f,
        targetValue = 10f,
        animationSpec = infiniteRepeatable(
            animation = tween(40, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "offset"
    )

    val gridModifier = Modifier
        .fillMaxWidth()
        .aspectRatio(1f)
        .graphicsLayer {
            if (isShaking) {
                translationX = shakeOffset
                translationY = shakeOffset * 0.6f
                rotationZ = shakeOffset * 0.15f
            }
        }
        .pointerInput(Unit) {
            detectDragGestures(
                onDragStart = { },
                onDragEnd = { onTraceEnd() },
                onDragCancel = { onTraceEnd() },
                onDrag = { change, _ ->
                    // Calculate cell index from drag coordinates
                    val cellWidth = size.width / 5
                    val cellHeight = size.height / 5
                    val col = (change.position.x / cellWidth).toInt().coerceIn(0, 4)
                    val row = (change.position.y / cellHeight).toInt().coerceIn(0, 4)
                    onCellTrace(row, col)
                }
            )
        }

    LazyVerticalGrid(
        columns = GridCells.Fixed(5),
        modifier = gridModifier.background(Color(0xFF263238), RoundedCornerShape(16.dp)).padding(10.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        items(25) { index ->
            val row = index / 5
            val col = index % 5
            val letter = grid[row][col]
            val isSelected = selectedCoordinates.contains(Pair(row, col))

            Box(
                modifier = Modifier
                    .aspectRatio(1f)
                    .background(
                        color = when {
                            isSelected -> Color(0xFFFFB300) // Selected Golden Yellow
                            else -> Color(0xFF37474F) // Normal Dark Gray
                        },
                        shape = RoundedCornerShape(8.dp)
                    )
                    .clickable { onCellTrace(row, col) },
                contentAlignment = Alignment.Center
            ) {
                if (!isHidingLetters) {
                    Text(
                        text = letter.toString(),
                        fontSize = 24.sp,
                        color = if (isSelected) Color(0xFF1A1A1A) else Color.White
                    )
                } else {
                    // Blank pattern during hide state at the end-of-round
                    Box(
                        modifier = Modifier
                            .size(16.dp)
                            .background(Color(0xFF546E7A), RoundedCornerShape(4.dp))
                    )
                }
            }
        }
    }
}
`;

  const kotlinSoundCode = `
package com.slovenian.boggle.sound

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import com.slovenian.boggle.R

/**
 * Android SoundManager handles low-latency sound effect playbacks.
 */
class BoggleSoundManager(private val context: Context) {
    private var soundPool: SoundPool? = null
    private var shakeSoundId: Int = 0
    private var buzzerSoundId: Int = 0
    private var successSoundId: Int = 0

    init {
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_GAME)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        soundPool = SoundPool.Builder()
            .setMaxStreams(5)
            .setAudioAttributes(audioAttributes)
            .build()

        soundPool?.let { pool ->
            // Load audio tracks from /res/raw directory
            shakeSoundId = pool.load(context, R.raw.dice_rattle, 1)
            buzzerSoundId = pool.load(context, R.raw.hourglass_warning, 1)
            successSoundId = pool.load(context, R.raw.success, 1)
        }
    }

    fun playDiceRattle() {
        soundPool?.play(shakeSoundId, 0.8f, 0.8f, 1, 0, 1.0f)
    }

    fun playBuzzer() {
        soundPool?.play(buzzerSoundId, 0.9f, 0.9f, 1, 0, 1.0f)
    }

    fun playWordSuccess() {
        soundPool?.play(successSoundId, 0.7f, 0.7f, 1, 0, 1.0f)
    }

    fun release() {
        soundPool?.release()
        soundPool = null
    }
}
`;

  const kotlinLogicCode = `
package com.slovenian.boggle.logic

/**
 * Slovenian dice layout frequencies (25 custom 6-sided dice)
 * Fits perfectly for 5x5 Boggle SI distribution without foreign keys "Q,W,X,Y".
 */
object SlovenianBoggle {
    val SlovenianDice = listOf(
        "AAAFRS", "AAEEEE", "AAFIRS", "ADENNN", "AEEEEM",
        "AEEGMU", "AEGMNN", "AFIRST", "BJKČŠŽ", "CCENST",
        "CEIILT", "CEILPT", "CEIPST", "DDHNOT", "DHHLOR",
        "DHLNOR", "DLNOTV", "EIIITT", "EMOTTT", "ENSSSU",
        "FIPRST", "GORRVZ", "HIPRRL", "NOOTUV", "OOOTTE"
    )

    /**
     * Executes standard 5x5 Slovenian block random roll.
     */
    fun rollNewBoard(): List<List<Char>> {
        val shuffledDice = SlovenianDice.shuffled()
        val rolledLetters = shuffledDice.map { die ->
            die.random() // Roll a random 1 of the 6 faces
        }
        
        // Chunk rolled results into a 5x5 board list of lists
        return rolledLetters.chunked(5)
    }

    /**
     * Boggle standard length point calculator.
     */
    fun calculatePoints(word: String): Int {
        return when (word.length) {
            0, 1, 2 -> 0
            3, 4 -> 1
            5 -> 2
            6 -> 3
            7 -> 5
            else -> 11 // 8 or more characters
        }
    }
}
`;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl mt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Slovenski Boggle v Kotlinu (Android)</h3>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">Strokovno strukturiran vodnik za mobilni razvoj v Jetpack Compose.</p>
          </div>
        </div>

        <div className="flex gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-xl max-w-fit">
          <button
            onClick={() => setActiveTab('ui')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
              activeTab === 'ui' ? 'bg-amber-500 text-black shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            UI & Animacije (Compose)
          </button>
          <button
            onClick={() => setActiveTab('sound')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
              activeTab === 'sound' ? 'bg-amber-500 text-black shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Zvok (SoundPool)
          </button>
          <button
            onClick={() => setActiveTab('logic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
              activeTab === 'logic' ? 'bg-amber-500 text-black shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Porazdelitev & Igra
          </button>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 max-h-[420px] overflow-y-auto">
        <div className="absolute top-3 right-4 z-20 bg-neutral-900/90 text-[10px] font-mono font-medium text-neutral-400 border border-neutral-800 px-2 py-1 rounded bg-blur">
          KOTLIN / COMPOSE
        </div>
        <pre className="p-4 bg-neutral-950 text-emerald-400 font-mono text-[12px] leading-relaxed overflow-x-auto selection:bg-neutral-800">
          <code>
            {activeTab === 'ui' && kotlinUiCode}
            {activeTab === 'sound' && kotlinSoundCode}
            {activeTab === 'logic' && kotlinLogicCode}
          </code>
        </pre>
      </div>

      <div className="mt-4 flex items-center gap-2.5 p-3.5 bg-neutral-950 border border-neutral-800/60 rounded-xl">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <p className="text-xs text-neutral-400 leading-normal font-sans">
          Ta koda zagotavlja popolno ločitev skrbništva v Kotlinu (ločen UI izris, namenski SoundPool kontroler in logiko slovenskih kock). Popolnoma pripravljeno za prenos v vaša mobilna okolja Android Studio.
        </p>
      </div>
    </div>
  );
};
