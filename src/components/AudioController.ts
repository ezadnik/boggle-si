/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Web Audio API synthesizer to simulate real-time wooden dice clinking/rattling sounds.
 * This ensures the web preview is fully interactive and provides authentic sound feedback
 * without requiring any external static audio assets.
 */
export class WebAudioSynth {
  private ctx: AudioContext | null = null;
  private isSynthesizing = false;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies.
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Play a single procedural wood-clink sound block.
   */
  public playSingleClink(pitch: number = 600, duration: number = 0.08, volume: number = 0.5) {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // Node creation
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const bandpass = this.ctx.createBiquadFilter();

      // Configure oscillator
      // Wood clinks consist of complex tones: a triangle or sine wave with high frequencies
      osc.type = Math.random() > 0.4 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      // Random frequency modulation for realism
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, now + duration);

      // Procedural noise click
      const bufferSize = this.ctx.sampleRate * 0.01; // 10ms of noise click
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.connect(gainNode);

      // Configure bandpass filter to give a hollow wooden quality
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(pitch * 1.5, now);
      bandpass.Q.setValueAtTime(4, now);

      // Amplitude Envelope (Exponential decay for snappy percussion hits)
      gainNode.gain.setValueAtTime(volume * 0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Routing
      osc.connect(bandpass);
      bandpass.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      // Start and Stop
      osc.start(now);
      noiseSource.start(now);
      osc.stop(now + duration);
      noiseSource.stop(now + duration);
    } catch (e) {
      console.warn("Error playing synthesized clink:", e);
    }
  }

  /**
   * Start an continuous rattling simulation during grid shakes.
   */
  public startRattle(durationMs: number = 1500) {
    if (this.isSynthesizing) return;
    this.isSynthesizing = true;
    
    this.initContext();

    const startTime = Date.now();
    const triggerClink = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= durationMs) {
        this.isSynthesizing = false;
        return;
      }

      // Procedural randomized variations
      const pitch = 700 + Math.random() * 800; // 700Hz - 1500Hz
      const volume = 0.2 + Math.random() * 0.4;
      const clinkDuration = 0.04 + Math.random() * 0.08;
      
      this.playSingleClink(pitch, clinkDuration, volume);

      // Stagger next hit delay between 30ms and 80ms to sound erratic
      const nextDelay = 30 + Math.random() * 50;
      setTimeout(triggerClink, nextDelay);
    };

    triggerClink();
  }

  /**
   * Procedural buzzer sound when the timer ends.
   */
  public playBuzzer() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(140, now);
      // vibrato
      osc1.frequency.linearRampToValueAtTime(145, now + 0.5);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(142, now);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn("Error playing synthesized buzzer:", e);
    }
  }

  /**
   * Procedural success tone for valid word submissions.
   */
  public playSuccess() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.15, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn("Success sound error:", e);
    }
  }
}

/**
 * ANDROID DOCUMENTATION SNIPPET (KOTLIN/JAVA PLACEHOLDER REFERENCE)
 * This documentation explains how an Android developer loads and plays these rattling audio files
 * using SoundPool or MediaPlayer. Included below for full transparency and design adherence.
 */
export const kotlinSoundCode = `
package com.slovenian.boggle.sound

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import com.slovenian.boggle.R

/**
 * SoundManager handles Boggle sound effects on Android using SoundPool.
 * SoundPool is preferred for short, low-latency audio playbacks (rattles, ticking, buzzers).
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

        // Load Audio Assets from res/raw directory
        soundPool?.let { pool ->
            shakeSoundId = pool.load(context, R.raw.dice_rattle, 1)
            buzzerSoundId = pool.load(context, R.raw.hourglass_warning, 1)
            successSoundId = pool.load(context, R.raw.success_pinger, 1)
        }
    }

    /**
     * Play the sound effect of dice wooden blocks clinking together.
     * We can loop it during the shaking animation or set the loop parameter to 0.
     */
    fun playDiceRattle() {
        soundPool?.play(
            shakeSoundId, 
            0.8f, // Left Volume
            0.8f, // Right Volume
            1,    // Priority
            0,    // Loop (0 = no loop, -1 = infinite loop)
            1.0f  // Playback Rate (0.5 to 2.0)
        )
    }

    fun playBuzzer() {
        soundPool?.play(buzzerSoundId, 0.9f, 0.9f, 1, 0, 1.0f)
    }

    fun playWordSuccess() {
        soundPool?.play(successSoundId, 0.7f, 0.7f, 1, 0, 1.2f)
    }

    /**
     * Clean up Audio resources when the game screen scope finishes.
     */
    fun release() {
        soundPool?.release()
        soundPool = null
    }
}
`;
