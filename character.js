/**
 * LyraCharacter — Procedural 2D SVG animation, mood expressions, and lip-sync engine.
 * Handles blinking, gaze tracking, breathing, eyelid/brow expressions, and voice-wave bars.
 */
class LyraCharacter {
  constructor() {
    this.headRig = document.getElementById("headRig");
    this.torsoGroup = document.getElementById("torsoGroup");
    this.stageBackdrop = document.getElementById("stageBackdrop");

    this.leftPupil = document.getElementById("leftPupilGroup");
    this.rightPupil = document.getElementById("rightPupilGroup");
    this.leftBlinkLid = document.getElementById("leftBlinkLid");
    this.rightBlinkLid = document.getElementById("rightBlinkLid");
    this.leftUpperLid = document.getElementById("leftUpperLid");
    this.rightUpperLid = document.getElementById("rightUpperLid");

    this.leftBrow = document.getElementById("leftBrow");
    this.rightBrow = document.getElementById("rightBrow");
    this.leftBlush = document.getElementById("leftBlush");
    this.rightBlush = document.getElementById("rightBlush");

    this.mouthCavity = document.getElementById("mouthCavity");
    this.mouthTeeth = document.getElementById("mouthTeeth");
    this.mouthTongue = document.getElementById("mouthTongue");
    this.mouthLips = document.getElementById("mouthLips");

    this.expressionLabel = document.getElementById("expressionLabel");
    this.voiceWaveBars = Array.from(document.querySelectorAll("#voiceWave span"));

    this.currentExpression = "warm";
    this.isSpeaking = false;
    this.mouthOpen = 0;
    this.mouthWidth = 1;
    this.targetMouthOpen = 0;
    this.targetMouthWidth = 1;

    this.targetGazeX = 0;
    this.targetGazeY = 0;
    this.gazeX = 0;
    this.gazeY = 0;

    this.blinkValue = 0;
    this.nextBlinkAt = performance.now() + 2000;
    this.blinkPhase = "idle";
    this.blinkStart = 0;

    this.startTime = performance.now();

    this.expressions = {
      warm: {
        label: "Warm",
        leftBrow: "M 136 178 Q 160 169 184 176",
        rightBrow: "M 236 176 Q 260 169 284 178",
        leftLid: "M 134 205 Q 160 183 186 205",
        rightLid: "M 234 205 Q 260 183 286 205",
        blush: 0.48,
        smileCurve: 7,
        headTilt: 0,
      },
      happy: {
        label: "Happy",
        leftBrow: "M 135 173 Q 160 162 185 171",
        rightBrow: "M 235 171 Q 260 162 285 173",
        leftLid: "M 134 204 Q 160 179 186 204",
        rightLid: "M 234 204 Q 260 179 286 204",
        blush: 0.78,
        smileCurve: 13,
        headTilt: -2,
      },
      excited: {
        label: "Excited",
        leftBrow: "M 134 166 Q 160 154 186 166",
        rightBrow: "M 234 166 Q 260 154 286 166",
        leftLid: "M 134 205 Q 160 177 186 205",
        rightLid: "M 234 205 Q 260 177 286 205",
        blush: 0.85,
        smileCurve: 14,
        headTilt: 2.5,
      },
      thinking: {
        label: "Thinking",
        leftBrow: "M 136 177 Q 160 172 184 180",
        rightBrow: "M 236 170 Q 260 160 284 168",
        leftLid: "M 134 205 Q 160 191 186 205",
        rightLid: "M 234 205 Q 260 189 286 205",
        blush: 0.3,
        smileCurve: 1,
        headTilt: -4.8,
      },
      surprised: {
        label: "Surprised",
        leftBrow: "M 134 161 Q 160 148 186 161",
        rightBrow: "M 234 161 Q 260 148 286 161",
        leftLid: "M 134 205 Q 160 175 186 205",
        rightLid: "M 234 205 Q 260 175 286 205",
        blush: 0.62,
        smileCurve: 2,
        headTilt: 1.5,
      },
      curious: {
        label: "Curious",
        leftBrow: "M 136 170 Q 160 159 184 171",
        rightBrow: "M 236 177 Q 260 172 284 178",
        leftLid: "M 134 205 Q 160 181 186 205",
        rightLid: "M 234 205 Q 260 186 286 205",
        blush: 0.45,
        smileCurve: 5,
        headTilt: 4.2,
      },
    };

    this.bindPointerGaze();
    this.initParticles();
    this.setExpression("warm");
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  bindPointerGaze() {
    window.addEventListener("pointermove", (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      this.targetGazeX = Math.max(-5.5, Math.min(5.5, nx * 5.5));
      this.targetGazeY = Math.max(-3.5, Math.min(3.5, ny * 3.5));
    });
  }

  setExpression(name) {
    const expr = this.expressions[name] || this.expressions.warm;
    this.currentExpression = name in this.expressions ? name : "warm";

    this.leftBrow.setAttribute("d", expr.leftBrow);
    this.rightBrow.setAttribute("d", expr.rightBrow);
    this.leftUpperLid.setAttribute("d", expr.leftLid);
    this.rightUpperLid.setAttribute("d", expr.rightLid);
    this.leftBlush.setAttribute("opacity", String(expr.blush));
    this.rightBlush.setAttribute("opacity", String(expr.blush));

    if (this.stageBackdrop) {
      this.stageBackdrop.dataset.mood = this.currentExpression;
    }

    if (this.expressionLabel) {
      this.expressionLabel.textContent = expr.label;
    }
  }

  setSpeaking(active) {
    this.isSpeaking = active;
    if (!active) {
      this.targetMouthOpen = 0;
      this.targetMouthWidth = 1;
      this.voiceWaveBars.forEach((bar) => {
        bar.style.height = "4px";
      });
    }
  }

  setMouthTarget(openAmount, widthFactor = 1) {
    this.targetMouthOpen = Math.max(0, Math.min(1, openAmount));
    this.targetMouthWidth = Math.max(0.65, Math.min(1.25, widthFactor));

    if (this.isSpeaking && this.voiceWaveBars.length) {
      this.voiceWaveBars.forEach((bar, i) => {
        const wave = Math.abs(Math.sin((i + 1) * 0.9 + openAmount * 5.2));
        const h = Math.round(4 + openAmount * 14 * (0.45 + wave * 0.65));
        bar.style.height = `${h}px`;
      });
    }
  }

  triggerBlink(now) {
    this.blinkPhase = "closing";
    this.blinkStart = now;
  }

  updateBlink(now) {
    if (this.blinkPhase === "idle") {
      if (now >= this.nextBlinkAt) {
        this.triggerBlink(now);
      }
      return;
    }

    const elapsed = now - this.blinkStart;
    if (this.blinkPhase === "closing") {
      this.blinkValue = Math.min(1, elapsed / 75);
      if (elapsed >= 75) {
        this.blinkPhase = "opening";
        this.blinkStart = now;
      }
    } else if (this.blinkPhase === "opening") {
      this.blinkValue = Math.max(0, 1 - elapsed / 110);
      if (elapsed >= 110) {
        this.blinkValue = 0;
        this.blinkPhase = "idle";
        const doubleBlink = Math.random() < 0.22;
        this.nextBlinkAt = now + (doubleBlink ? 180 : 2200 + Math.random() * 3200);
      }
    }

    this.leftBlinkLid.setAttribute("opacity", this.blinkValue.toFixed(2));
    this.rightBlinkLid.setAttribute("opacity", this.blinkValue.toFixed(2));
  }

  updateMouth() {
    this.mouthOpen += (this.targetMouthOpen - this.mouthOpen) * 0.38;
    this.mouthWidth += (this.targetMouthWidth - this.mouthWidth) * 0.32;

    const expr = this.expressions[this.currentExpression] || this.expressions.warm;
    const w = 20 * this.mouthWidth;
    const smile = expr.smileCurve;

    if (this.mouthOpen < 0.06) {
      const lipPath =
        this.currentExpression === "surprised"
          ? `M -7 2 A 7 6.5 0 1 0 7 2 A 7 6.5 0 1 0 -7 2 Z`
          : `M ${-w} 0 Q 0 ${smile} ${w} 0`;

      this.mouthLips.setAttribute("d", lipPath);
      this.mouthCavity.setAttribute("d", `M ${-w + 2} 0 Q 0 1 ${w - 2} 0 Q 0 1 ${-w + 2} 0 Z`);
      this.mouthTeeth.setAttribute("opacity", "0");
      this.mouthTongue.setAttribute("opacity", "0");
      return;
    }

    const openH = 4 + this.mouthOpen * 18;
    const upperY = -1.5;
    const lowerY = openH + smile * 0.25;

    const cavityPath = `M ${-w + 2} ${upperY} Q 0 ${upperY + 2.5} ${w - 2} ${upperY} Q 0 ${lowerY + 4} ${-w + 2} ${upperY} Z`;
    const lipsPath = `M ${-w} ${upperY} Q 0 ${upperY + 2} ${w} ${upperY} Q 0 ${lowerY + 5} ${-w} ${upperY} Z`;

    this.mouthCavity.setAttribute("d", cavityPath);
    this.mouthLips.setAttribute("d", lipsPath);

    const showInner = Math.min(1, this.mouthOpen * 1.6);
    this.mouthTeeth.setAttribute("opacity", (showInner * 0.9).toFixed(2));
    this.mouthTongue.setAttribute("opacity", (showInner * 0.85).toFixed(2));
    this.mouthTongue.setAttribute("cy", (openH * 0.5 + 2).toFixed(1));
  }

  animate(now) {
    const t = (now - this.startTime) / 1000;
    const expr = this.expressions[this.currentExpression] || this.expressions.warm;

    const breathY = Math.sin(t * 1.55) * 2.2;
    const swayX = Math.sin(t * 0.72) * 1.6;
    const nodSpeed = this.currentExpression === "thinking" ? 4.4 : 7.0;
    const speakNod = this.isSpeaking ? Math.sin(t * nodSpeed) * 1.8 : 0;
    const headTilt =
      expr.headTilt +
      Math.sin(t * 0.65) * 1.1 +
      (this.isSpeaking ? Math.sin(t * 4.2) * 1.3 : 0);

    this.headRig.setAttribute(
      "transform",
      `translate(${swayX.toFixed(2)}, ${(breathY + speakNod).toFixed(2)}) rotate(${headTilt.toFixed(2)} 210 260)`
    );
    this.torsoGroup.setAttribute("transform", `translate(0, ${(breathY * 0.55).toFixed(2)})`);

    // Gaze smoothing (thinking looks thoughtfully up-right)
    const gxTarget = this.currentExpression === "thinking" ? 3.8 : this.targetGazeX;
    const gyTarget = this.currentExpression === "thinking" ? -3.0 : this.targetGazeY;
    this.gazeX += (gxTarget - this.gazeX) * 0.1;
    this.gazeY += (gyTarget - this.gazeY) * 0.1;

    this.leftPupil.setAttribute("transform", `translate(${this.gazeX.toFixed(2)}, ${this.gazeY.toFixed(2)})`);
    this.rightPupil.setAttribute("transform", `translate(${this.gazeX.toFixed(2)}, ${this.gazeY.toFixed(2)})`);

    this.updateBlink(now);
    this.updateMouth();

    requestAnimationFrame(this.animate);
  }

  initParticles() {
    const canvas = document.getElementById("particlesCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      if (!canvas.offsetWidth || !canvas.offsetHeight) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const motes = Array.from({ length: 18 }, () => ({
      x: Math.random() * 600,
      y: Math.random() * 500,
      r: 0.8 + Math.random() * 1.5,
      vy: 0.12 + Math.random() * 0.25,
      vx: (Math.random() - 0.5) * 0.16,
      alpha: 0.12 + Math.random() * 0.28,
    }));

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w > 0 && h > 0) {
        ctx.clearRect(0, 0, w, h);

        for (const m of motes) {
          m.y -= m.vy;
          m.x += m.vx;
          if (m.y < -10) {
            m.y = h + 10;
            m.x = Math.random() * w;
          }
          if (m.x < 0) m.x += w;
          if (m.x > w) m.x -= w;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(229, 231, 235, ${m.alpha})`;
          ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }
}

window.LyraCharacter = LyraCharacter;
