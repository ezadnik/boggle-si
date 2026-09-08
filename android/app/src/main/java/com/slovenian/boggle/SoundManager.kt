package com.slovenian.boggle

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import android.util.Log

/**
 * Handle low-latency sound effect playbacks (Dice clinking rattle, round buzzers, success loops).
 */
class SoundManager(private val context: Context) {
    private var soundPool: SoundPool? = null
    private var rattleSoundId = 0
    private var buzzerSoundId = 0
    private var successSoundId = 0
    private var rattleStreamId = 0

    init {
        try {
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            soundPool = SoundPool.Builder()
                .setMaxStreams(3)
                .setAudioAttributes(audioAttributes)
                .build()

            // Safe resources indicators
            soundPool?.let { pool ->
                val packageName = context.packageName
                val res = context.resources
                
                // Fetch optional raw IDs dynamically to prevent strict compilation raw folders crash if missing
                val rattleResId = res.getIdentifier("dice_rattle", "raw", packageName)
                if (rattleResId != 0) {
                    rattleSoundId = pool.load(context, rattleResId, 1)
                }
                
                val buzzerResId = res.getIdentifier("hourglass_warning", "raw", packageName)
                if (buzzerResId != 0) {
                    buzzerSoundId = pool.load(context, buzzerResId, 1)
                }

                val successResId = res.getIdentifier("success", "raw", packageName)
                if (successResId != 0) {
                    successSoundId = pool.load(context, successResId, 1)
                }
            }
        } catch (e: Exception) {
            Log.e("SoundManager", "Error setting up SoundPool: ${e.message}")
        }
    }

    fun startRattleLoop() {
        if (soundPool != null && rattleSoundId != 0) {
            rattleStreamId = soundPool?.play(rattleSoundId, 0.85f, 0.85f, 1, -1, 1.0f) ?: 0
        }
    }

    fun stopRattleLoop() {
        if (soundPool != null && rattleStreamId != 0) {
            soundPool?.stop(rattleStreamId)
            rattleStreamId = 0
        }
    }

    fun playBuzzer() {
        if (soundPool != null && buzzerSoundId != 0) {
            soundPool?.play(buzzerSoundId, 0.9f, 0.9f, 1, 0, 1.0f)
        }
    }

    fun playSuccess() {
        if (soundPool != null && successSoundId != 0) {
            soundPool?.play(successSoundId, 0.75f, 0.75f, 1, 0, 1.0f)
        }
    }

    fun release() {
        soundPool?.release()
        soundPool = null
    }
}
