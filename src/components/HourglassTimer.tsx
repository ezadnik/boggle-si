/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface HourglassTimerProps {
  timeLeft: number; // in seconds
  totalDuration: number; // in seconds
  isActive: boolean;
}

export const HourglassTimer: React.FC<HourglassTimerProps> = ({
  timeLeft,
  totalDuration,
  isActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const particles = useRef<Array<{ x: number; y: number; speed: number; size: number }>>([]);

  // Format time remaining (m:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high pixel density ratio for razor sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const width = 160;
    const height = 220;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Shader-style deterministic pseudo-random number generator for stable sand grains
    const getStableNoise = (index: number) => {
      const x = Math.sin(index * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };

    const updateAndDrawHourglass = () => {
      ctx.clearRect(0, 0, width, height);

      const ratioRemaining = Math.max(0, Math.min(1, timeLeft / totalDuration));
      const ratioPassed = 1 - ratioRemaining;

      const midX = width / 2;
      const midY = height / 2;

      const topY = 40;
      const bottomY = height - 40;
      const xRadius = 52; // bulb wide radius

      // --- 1. Draw Rear Pillar Column (Placed behind glass) ---
      const rearColGrad = ctx.createLinearGradient(midX - 5, topY, midX + 5, topY);
      rearColGrad.addColorStop(0, '#101725');
      rearColGrad.addColorStop(0.5, '#3A475C');
      rearColGrad.addColorStop(1, '#0C111C');
      ctx.fillStyle = rearColGrad;
      ctx.fillRect(midX - 4.5, topY - 3, 9, bottomY - topY + 6);

      // --- 2. Draw Glass Chambers Ambient Backdrop (Subtle dark transparency) ---
      ctx.fillStyle = 'rgba(10, 16, 27, 0.45)';
      
      // Top Bulb Shape
      ctx.beginPath();
      ctx.moveTo(midX - xRadius, topY);
      ctx.lineTo(midX + xRadius, topY);
      ctx.bezierCurveTo(midX + xRadius, topY + 40, midX + 11, midY - 12, midX + 3.5, midY - 1);
      ctx.lineTo(midX - 3.5, midY - 1);
      ctx.bezierCurveTo(midX - 11, midY - 12, midX - xRadius, topY + 40, midX - xRadius, topY);
      ctx.closePath();
      ctx.fill();

      // Bottom Bulb Shape
      ctx.beginPath();
      ctx.moveTo(midX - 3.5, midY + 1);
      ctx.lineTo(midX + 3.5, midY + 1);
      ctx.bezierCurveTo(midX + 11, midY + 12, midX + xRadius, bottomY - 40, midX + xRadius, bottomY);
      ctx.lineTo(midX - xRadius, bottomY);
      ctx.bezierCurveTo(midX - xRadius, bottomY - 40, midX - 11, midY + 12, midX - 3.5, midY + 1);
      ctx.closePath();
      ctx.fill();

      // --- 3. Draw Sand Inside Top Bulb ---
      if (ratioRemaining > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(midX - xRadius, topY);
        ctx.lineTo(midX + xRadius, topY);
        ctx.bezierCurveTo(midX + xRadius, topY + 40, midX + 11, midY - 12, midX + 3.5, midY - 1);
        ctx.lineTo(midX - 3.5, midY - 1);
        ctx.bezierCurveTo(midX - 11, midY - 12, midX - xRadius, topY + 40, midX - xRadius, topY);
        ctx.closePath();
        ctx.clip();

        const sandTopY = topY + (midY - 1 - topY) * (1 - ratioRemaining);
        
        const topSandGrad = ctx.createLinearGradient(midX - 25, sandTopY, midX + 25, midY);
        topSandGrad.addColorStop(0, '#FFE666');
        topSandGrad.addColorStop(0.4, '#F5A623');
        topSandGrad.addColorStop(1, '#925400');
        ctx.fillStyle = topSandGrad;
        
        ctx.beginPath();
        ctx.moveTo(midX - 60, sandTopY);
        ctx.quadraticCurveTo(midX, sandTopY + 1.2, midX + 60, sandTopY);
        ctx.lineTo(midX + 60, midY + 5);
        ctx.lineTo(midX - 60, midY + 5);
        ctx.closePath();
        ctx.fill();

        for (let i = 0; i < 480; i++) {
          const randX = getStableNoise(i * 3 + 1);
          const randY = getStableNoise(i * 3 + 2);
          const px = midX - xRadius + randX * (xRadius * 2);
          const py = sandTopY + randY * (midY - 1 - sandTopY);
          
          if (py >= sandTopY && py < midY) {
            const twinkle = getStableNoise(i * 5 + (isActive ? Math.floor(Date.now() / 185) : 0)) > 0.82;
            ctx.fillStyle = twinkle ? '#FFFFFF' : 'rgba(254, 240, 138, 0.45)';
            ctx.fillRect(px, py, 1.3, 1.3);
          }
        }
        
        ctx.fillStyle = 'rgba(120, 53, 4, 0.35)';
        for (let i = 0; i < 280; i++) {
          const randX = getStableNoise(i * 11 + 4);
          const randY = getStableNoise(i * 11 + 7);
          const px = midX - xRadius + randX * (xRadius * 2);
          const py = sandTopY + randY * (midY - 1 - sandTopY);
          
          if (py >= sandTopY && py < midY) {
            ctx.fillRect(px, py, 1.1, 1.1);
          }
        }

        if (isActive && ratioRemaining < 0.96) {
          ctx.fillStyle = 'rgba(120, 53, 4, 0.6)';
          ctx.beginPath();
          ctx.ellipse(midX, sandTopY, 6.5, 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // --- 4. Draw Sand Inside Bottom Bulb ---
      if (ratioPassed > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(midX - 3.5, midY + 1);
        ctx.lineTo(midX + 3.5, midY + 1);
        ctx.bezierCurveTo(midX + 11, midY + 12, midX + xRadius, bottomY - 40, midX + xRadius, bottomY);
        ctx.lineTo(midX - xRadius, bottomY);
        ctx.bezierCurveTo(midX - xRadius, bottomY - 40, midX - 11, midY + 12, midX - 3.5, midY + 1);
        ctx.closePath();
        ctx.clip();

        const pileHeight = (bottomY - 14 - (midY + 16)) * ratioPassed;
        const pileTopY = bottomY - 2 - pileHeight;

        const bottomSandGrad = ctx.createLinearGradient(midX - 40, pileTopY, midX + 40, bottomY);
        bottomSandGrad.addColorStop(0, '#FFE666');
        bottomSandGrad.addColorStop(0.35, '#F5A623');
        bottomSandGrad.addColorStop(1, '#8C4D00');

        ctx.fillStyle = bottomSandGrad;
        ctx.beginPath();
        ctx.moveTo(midX - 65, bottomY + 10);
        ctx.lineTo(midX - 55, bottomY - 3);
        ctx.bezierCurveTo(midX - 45, bottomY - 3 - pileHeight * 0.18, midX - 25, pileTopY + pileHeight * 0.22, midX, pileTopY);
        ctx.bezierCurveTo(midX + 25, pileTopY + pileHeight * 0.22, midX + 45, bottomY - 3, midX + 55, bottomY - 3);
        ctx.lineTo(midX + 65, bottomY + 10);
        ctx.closePath();
        ctx.fill();

        for (let i = 0; i < 500; i++) {
          const randX = getStableNoise(i * 13 + 3);
          const randY = getStableNoise(i * 13 + 5);
          const px = midX - xRadius + randX * (xRadius * 2);
          const py = pileTopY + randY * (bottomY - 1 - pileTopY);

          if (py >= pileTopY && py <= bottomY) {
            const twinkle = getStableNoise(i * 17 + (isActive ? Math.floor(Date.now() / 150) : 0)) > 0.83;
            ctx.fillStyle = twinkle ? '#FFFFFF' : 'rgba(254, 240, 138, 0.48)';
            ctx.fillRect(px, py, 1.2, 1.2);
          }
        }

        ctx.fillStyle = 'rgba(120, 53, 4, 0.45)';
        for (let i = 0; i < 300; i++) {
          const randX = getStableNoise(i * 23 + 2);
          const randY = getStableNoise(i * 23 + 6);
          const px = midX - xRadius + randX * (xRadius * 2);
          const py = pileTopY + randY * (bottomY - 1 - pileTopY);

          if (py >= pileTopY && py <= bottomY) {
            ctx.fillRect(px, py, 1, 1);
          }
        }

        ctx.restore();
      }

      // --- 5. Draw Pouring Stream & Splashes ---
      if (isActive && ratioRemaining > 0) {
        const pileHeight = (bottomY - 14 - (midY + 16)) * ratioPassed;
        const pileTopY = bottomY - 2 - pileHeight;

        ctx.strokeStyle = '#FFE666';
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(midX, midY - 1);
        ctx.lineTo(midX, pileTopY);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(245, 166, 35, 0.35)';
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(midX, midY - 1);
        ctx.lineTo(midX, pileTopY);
        ctx.stroke();

        if (Math.random() < 0.8) {
          particles.current.push({
            x: midX + (Math.random() * 3.2 - 1.6),
            y: midY + 1,
            speed: 4.5 + Math.random() * 2,
            boxsize: 0.9 + Math.random() * 1.1,
            size: 0.9 + Math.random() * 1.1,
          });
        }
      }

      ctx.fillStyle = '#FFE666';
      particles.current = particles.current.filter((p) => {
        p.y += p.speed;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        const pileHeight = (bottomY - 14 - (midY + 16)) * ratioPassed;
        const pileTopY = bottomY - 2 - pileHeight;
        return p.y < pileTopY;
      });

      if (isActive && ratioRemaining > 0 && ratioPassed > 0) {
        const pileHeight = (bottomY - 14 - (midY + 16)) * ratioPassed;
        const pileTopY = bottomY - 2 - pileHeight;
        ctx.beginPath();
        ctx.ellipse(midX, pileTopY, 5.5 + Math.random() * 3.5, 1.4, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 238, 102, 0.52)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      // --- 6. Draw Glass Chambers Outer Highlights ---
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.moveTo(midX - xRadius, topY);
      ctx.lineTo(midX + xRadius, topY);
      ctx.bezierCurveTo(midX + xRadius, topY + 40, midX + 11, midY - 12, midX + 3.5, midY - 1);
      ctx.lineTo(midX - 3.5, midY - 1);
      ctx.bezierCurveTo(midX - 11, midY - 12, midX - xRadius, topY + 40, midX - xRadius, topY);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(midX - 3.5, midY + 1);
      ctx.lineTo(midX + 3.5, midY + 1);
      ctx.bezierCurveTo(midX + 11, midY + 12, midX + xRadius, bottomY - 40, midX + xRadius, bottomY);
      ctx.lineTo(midX - xRadius, bottomY);
      ctx.bezierCurveTo(midX - xRadius, bottomY - 40, midX - 11, midY + 12, midX - 3.5, midY + 1);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.beginPath();
      ctx.moveTo(midX - xRadius + 4, topY + 4);
      ctx.bezierCurveTo(midX - xRadius + 15, topY + 26, midX - 18, midY - 15, midX - 4, midY - 5);
      ctx.lineTo(midX - 6.5, midY - 5);
      ctx.bezierCurveTo(midX - 22, midY - 15, midX - xRadius + 8, topY + 28, midX - xRadius + 6, topY + 4);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(midX + xRadius - 6, bottomY - 4);
      ctx.bezierCurveTo(midX + xRadius - 15, bottomY - 26, midX + 18, midY + 15, midX + 4, midY + 5);
      ctx.lineTo(midX + 6.5, midY + 5);
      ctx.bezierCurveTo(midX + 22, midY + 15, midX + xRadius - 8, bottomY - 28, midX + xRadius - 6, bottomY - 4);
      ctx.closePath();
      ctx.fill();

      // --- 7. Draw Columns ---
      const leftPillarGrad = ctx.createLinearGradient(midX - 68, topY, midX - 58, topY);
      leftPillarGrad.addColorStop(0, '#0F131A');
      leftPillarGrad.addColorStop(0.3, '#303D4E');
      leftPillarGrad.addColorStop(0.5, '#5C6C80');
      leftPillarGrad.addColorStop(0.85, '#2D3949');
      leftPillarGrad.addColorStop(1, '#0A0E14');
      ctx.fillStyle = leftPillarGrad;
      ctx.fillRect(midX - 66, topY, 8.5, bottomY - topY);

      ctx.fillStyle = '#26313F';
      ctx.fillRect(midX - 67.5, topY, 11, 3.5);
      ctx.fillRect(midX - 67.5, bottomY - 3.5, 11, 3.5);

      const rightPillarGrad = ctx.createLinearGradient(midX + 58, topY, midX + 68, topY);
      rightPillarGrad.addColorStop(0, '#0F131A');
      rightPillarGrad.addColorStop(0.3, '#303D4E');
      rightPillarGrad.addColorStop(0.5, '#5C6C80');
      rightPillarGrad.addColorStop(0.85, '#2D3949');
      rightPillarGrad.addColorStop(1, '#0A0E14');
      ctx.fillStyle = rightPillarGrad;
      ctx.fillRect(midX + 57.5, topY, 8.5, bottomY - topY);

      ctx.fillStyle = '#26313F';
      ctx.fillRect(midX + 56.5, topY, 11, 3.5);
      ctx.fillRect(midX + 56.5, bottomY - 3.5, 11, 3.5);

      // --- 8. Draw Cap Plates ---
      const capGrad = ctx.createLinearGradient(midX - 75, topY, midX + 75, topY);
      capGrad.addColorStop(0, '#131B26');
      capGrad.addColorStop(0.25, '#404E60');
      capGrad.addColorStop(0.5, '#738499');
      capGrad.addColorStop(0.78, '#2D3949');
      capGrad.addColorStop(1, '#0C1117');

      ctx.fillStyle = capGrad;
      ctx.fillRect(midX - 74, topY - 11, 148, 11);
      
      ctx.fillStyle = '#0F1318';
      ctx.fillRect(midX - 74, topY - 13, 148, 2);

      const bottomCapGrad = ctx.createLinearGradient(midX - 75, bottomY, midX + 75, bottomY);
      bottomCapGrad.addColorStop(0, '#131B26');
      bottomCapGrad.addColorStop(0.25, '#404E60');
      bottomCapGrad.addColorStop(0.5, '#738499');
      bottomCapGrad.addColorStop(0.78, '#2D3949');
      bottomCapGrad.addColorStop(1, '#0C1117');

      ctx.fillStyle = bottomCapGrad;
      ctx.fillRect(midX - 74, bottomY, 148, 11);
      
      ctx.fillStyle = '#0F1318';
      ctx.fillRect(midX - 74, bottomY + 11, 148, 2);

      animationFrameId.current = requestAnimationFrame(updateAndDrawHourglass);
    };

    updateAndDrawHourglass();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [timeLeft, totalDuration, isActive]);

  return (
    <div 
      id="hourglass-container" 
      className="flex flex-col items-center justify-center p-6 rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.65)] transition-all bg-[#121B27] border border-slate-800/40 w-full"
    >
      <canvas ref={canvasRef} className="rounded-2xl" />
      
      {/* OČIŠČEN HUD PRIKAZ - ZDAJ Z JAKO IN POPOLNO NASTAVLJENIM JETBRAINS MONO FONTOM */}
      <div 
        id="countdown-label-display" 
        className="mt-6 flex items-center justify-center select-none"
      >
        {/* Majhna statusna lučka na levi */}
        <div 
          id="led-status-indicator" 
          className="h-3.5 w-3.5 rounded-full mr-3 shrink-0 bg-[#FFAA00] border border-[#52461D] shadow-[0_0_8px_rgba(255,170,0,0.5)]"
        />

        {/* POPOLN ČASOVNIK: Brez zmedene SVG grafike, čisti JetBrains Mono tekst */}
        <span className="font-mono font-bold text-4xl tracking-wider text-[#FFAA00] drop-shadow-[0_0_10px_rgba(255,170,0,0.4)]">
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
};