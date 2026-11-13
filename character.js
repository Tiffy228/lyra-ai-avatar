/**
 * LucyCharacter — Procedural 2D SVG animation, Cyberpunk netrunner HUD eyes, and lip-sync engine.
 * Handles blinking, gaze tracking, breathing, facial expressions, cyber-iris rotation, and voice-wave bars.
 */
class LyraCharacter {
  constructor() {
    this.headRig = document.getElementById("headRig");
    this.backHairRig = document.getElementById("backHairRig");
    this.torsoGroup = document.getElementById("torsoGroup");
    this.stageBackdrop = document.getElementById("stageBackdrop");
    this.cyberHaloGroup = document.getElementById("cyberHaloGroup");

    this.leftPupil = document.getElementById("leftPupilGroup");
    this.rightPupil = document.getElementById("rightPupilGroup");
    this.leftIrisHud = document.getElementById("leftIrisHud");
    this.rightIrisHud = document.getElementById("rightIrisHud");

    this.leftSclera = document.getElementById("leftSclera");
    this.rightSclera = document.getElementById("rightSclera");
    this.leftEyeClipPath = document.getElementById("leftEyeClipPath");
    this.rightEyeClipPath = document.getElementById("rightEyeClipPath");
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
        leftLid: "M 130 201 Q 160 182 186 205",
        rightLid: "M 234 205 Q 260 182 290 201",
        leftEyeShape: "M 135 204 Q 160 184 185 205 Q 160 221 135 204 Z",
        rightEyeShape: "M 235 205 Q 260 184 285 204 Q 260 221 235 205 Z",
        blush: 0.44,
        smileCurve: 6,
        headTilt: 0,
      },
      happy: {
        label: "Happy",
        leftBrow: "M 135 173 Q 160 162 185 171",
        rightBrow: "M 235 171 Q 260 162 285 173",
        leftLid: "M 130 200 Q 160 179 186 204",
        rightLid: "M 234 204 Q 260 179 290 200",
        leftEyeShape: "M 135 204 Q 160 181 185 204 Q 160 218 135 204 Z",
        rightEyeShape: "M 235 204 Q 260 181 285 204 Q 260 218 235 204 Z",
        blush: 0.72,
        smileCurve: 12,
        headTilt: -2,
      },
      excited: {
        label: "Excited",
        leftBrow: "M 134 166 Q 160 155 186 166",
        rightBrow: "M 234 166 Q 260 155 286 166",
        leftLid: "M 130 201 Q 160 176 186 205",
        rightLid: "M 234 205 Q 260 176 290 201",
        leftEyeShape: "M 135 204 Q 160 178 185 205 Q 160 223 135 204 Z",
        rightEyeShape: "M 235 205 Q 260 178 285 204 Q 260 223 235 205 Z",
        blush: 0.8,
        smileCurve: 13,
        headTilt: 2.5,
      },
      thinking: {
        label: "Thinking",
        leftBrow: "M 136 178 Q 160 173 184 181",
        rightBrow: "M 236 171 Q 260 161 284 169",
        leftLid: "M 130 202 Q 160 190 186 205",
        rightLid: "M 234 205 Q 260 188 290 202",
        leftEyeShape: "M 135 204 Q 160 192 185 205 Q 160 220 135 204 Z",
        rightEyeShape: "M 235 205 Q 260 190 285 204 Q 260 220 235 205 Z",
        blush: 0.25,
        smileCurve: 0.5,
        headTilt: -4.2,
      },
      surprised: {
        label: "Surprised",
        leftBrow: "M 134 161 Q 160 148 186 161",
        rightBrow: "M 234 161 Q 260 148 286 161",
        leftLid: "M 130 201 Q 160 174 186 205",
        rightLid: "M 234 205 Q 260 174 290 201",
        leftEyeShape: "M 135 204 Q 160 176 185 205 Q 160 225 135 204 Z",
        rightEyeShape: "M 235 205 Q 260 176 285 204 Q 260 225 235 205 Z",
        blush: 0.58,
        smileCurve: 2,
        headTilt: 1.5,
      },
      curious: {
        label: "Curious",
        leftBrow: "M 136 170 Q 160 159 184 171",
        rightBrow: "M 236 177 Q 260 172 284 178",
        leftLid: "M 130 201 Q 160 180 186 205",
        rightLid: "M 234 205 Q 260 185 290 201",
        leftEyeShape: "M 135 204 Q 160 182 185 205 Q 160 221 135 204 Z",
        rightEyeShape: "M 235 205 Q 260 187 285 204 Q 260 221 235 205 Z",
        blush: 0.4,
        smileCurve: 4.5,
        headTilt: 4.0,
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
      this.targetGazeX = Math.max(-5.2, Math.min(5.2, nx * 5.2));
      this.targetGazeY = Math.max(-3.2, Math.min(3.2, ny * 3.2));
    });
  }

  setExpression(name) {
    const expr = this.expressions[name] || this.expressions.warm;
    this.currentExpression = name in this.expressions ? name : "warm";

    this.leftBrow.setAttribute("d", expr.leftBrow);
    this.rightBrow.setAttribute("d", expr.rightBrow);
    this.leftUpperLid.setAttribute("d", expr.leftLid);
    this.rightUpperLid.setAttribute("d", expr.rightLid);
    if (this.leftSclera) this.leftSclera.setAttribute("d", expr.leftEyeShape);
    if (this.rightSclera) this.rightSclera.setAttribute("d", expr.rightEyeShape);
    if (this.leftEyeClipPath) this.leftEyeClipPath.setAttribute("d", expr.leftEyeShape);
    if (this.rightEyeClipPath) this.rightEyeClipPath.setAttribute("d", expr.rightEyeShape);
    if (this.leftBlinkLid) this.leftBlinkLid.setAttribute("d", expr.leftEyeShape);
    if (this.rightBlinkLid) this.rightBlinkLid.setAttribute("d", expr.rightEyeShape);
    this.leftBlush.setAttribute("opacity", String(expr.blush));
    this.rightBlush.setAttribute("opacity", String(expr.blush));

    // Brighten netrunner cyber-iris rings in thinking/netrun mode
    const irisOpacity = this.currentExpression === "thinking" ? "0.95" : "0.6";
    if (this.leftIrisHud) this.leftIrisHud.setAttribute("opacity", irisOpacity);
    if (this.rightIrisHud) this.rightIrisHud.setAttribute("opacity", irisOpacity);

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
    const w = 19 * this.mouthWidth;
    const smile = expr.smileCurve;

    if (this.mouthOpen < 0.06) {
      const lipPath =
        this.currentExpression === "surprised"
          ? `M -6.5 2 A 6.5 6 0 1 0 6.5 2 A 6.5 6 0 1 0 -6.5 2 Z`
          : `M ${-w} 0 Q 0 ${smile} ${w} 0`;

      this.mouthLips.setAttribute("d", lipPath);
      this.mouthCavity.setAttribute("d", `M ${-w + 2} 0 Q 0 1 ${w - 2} 0 Q 0 1 ${-w + 2} 0 Z`);
      this.mouthTeeth.setAttribute("opacity", "0");
      this.mouthTongue.setAttribute("opacity", "0");
      return;
    }

    const openH = 4 + this.mouthOpen * 17;
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

    const breathY = Math.sin(t * 1.5) * 1.8;
    const swayX = Math.sin(t * 0.7) * 1.1;
    const nodSpeed = this.currentExpression === "thinking" ? 4.2 : 6.8;
    const speakNod = this.isSpeaking ? Math.sin(t * nodSpeed) * 1.4 : 0;
    const headTilt =
      expr.headTilt +
      Math.sin(t * 0.62) * 0.9 +
      (this.isSpeaking ? Math.sin(t * 4.0) * 1.1 : 0);

    // Pivot head & back hair cleanly around the top of the neck (210, 302)
    const headTransform = `translate(${swayX.toFixed(2)}, ${(breathY + speakNod).toFixed(2)}) rotate(${headTilt.toFixed(2)} 210 302)`;
    this.headRig.setAttribute("transform", headTransform);
    if (this.backHairRig) {
      this.backHairRig.setAttribute("transform", headTransform);
    }
    this.torsoGroup.setAttribute("transform", `translate(0, ${(breathY * 0.45).toFixed(2)})`);

    // Subtle cybernetic reticle & iris HUD spin
    const hudSpeed = this.currentExpression === "thinking" ? 48 : 16;
    if (this.cyberHaloGroup) {
      this.cyberHaloGroup.setAttribute("transform", `rotate(${((t * hudSpeed * 0.35) % 360).toFixed(1)} 210 212)`);
    }
    if (this.leftIrisHud) {
      this.leftIrisHud.setAttribute("transform", `rotate(${((t * hudSpeed) % 360).toFixed(1)} 160 204)`);
    }
    if (this.rightIrisHud) {
      this.rightIrisHud.setAttribute("transform", `rotate(${((-t * hudSpeed) % 360).toFixed(1)} 260 204)`);
    }

    // Gaze smoothing
    const gxTarget = this.currentExpression === "thinking" ? 3.8 : this.targetGazeX;
    const gyTarget = this.currentExpression === "thinking" ? -2.8 : this.targetGazeY;
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

    const motes = Array.from({ length: 20 }, (_, i) => ({
      x: Math.random() * 600,
      y: Math.random() * 500,
      r: 0.8 + Math.random() * 1.4,
      vy: 0.14 + Math.random() * 0.28,
      vx: (Math.random() - 0.5) * 0.18,
      alpha: 0.15 + Math.random() * 0.3,
      cyan: i % 3 === 0,
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
          ctx.fillStyle = m.cyan
            ? `rgba(103, 232, 249, ${m.alpha})`
            : `rgba(229, 231, 235, ${m.alpha})`;
          ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }
}

window.LyraCharacter = LyraCharacter;
