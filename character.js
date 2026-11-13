/**
 * LyraCharacter — Procedural 2D SVG animation & lip-sync engine.
 * Handles blinking, gaze tracking, breathing, facial expressions, and viseme mouth animation.
 */
class LyraCharacter {
  constructor() {
    this.headRig = document.getElementById("headRig");
    this.torsoGroup = document.getElementById("torsoGroup");
    this.lanternGroup = document.getElementById("lanternGroup");
    this.lanternAura = document.getElementById("lanternAura");

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
    this.exprButtons = Array.from(document.querySelectorAll(".expr-btn"));

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

    this.blinkValue = 0; // 0 = open, 1 = closed
    this.nextBlinkAt = performance.now() + 2200;
    this.blinkPhase = "idle";
    this.blinkStart = 0;

    this.startTime = performance.now();

    this.expressions = {
      warm: {
        label: "Warm",
        leftBrow: "M 136 178 Q 160 169 184 176",
        rightBrow: "M 236 176 Q 260 169 284 178",
        blush: 0.55,
        smileCurve: 7,
        headTilt: 0,
      },
      happy: {
        label: "Happy",
        leftBrow: "M 135 173 Q 160 162 185 171",
        rightBrow: "M 235 171 Q 260 162 285 173",
        blush: 0.85,
        smileCurve: 13,
        headTilt: -2,
      },
      excited: {
        label: "Excited",
        leftBrow: "M 134 166 Q 160 155 186 166",
        rightBrow: "M 234 166 Q 260 155 286 166",
        blush: 0.9,
        smileCurve: 14,
        headTilt: 2.5,
      },
      thinking: {
        label: "Thinking",
        leftBrow: "M 136 175 Q 160 168 184 178",
        rightBrow: "M 236 170 Q 260 160 284 168",
        blush: 0.35,
        smileCurve: 1,
        headTilt: -4.5,
      },
      surprised: {
        label: "Surprised",
        leftBrow: "M 134 162 Q 160 150 186 162",
        rightBrow: "M 234 162 Q 260 150 286 162",
        blush: 0.65,
        smileCurve: 2,
        headTilt: 1.5,
      },
      curious: {
        label: "Curious",
        leftBrow: "M 136 171 Q 160 160 184 172",
        rightBrow: "M 236 177 Q 260 172 284 178",
        blush: 0.5,
        smileCurve: 5,
        headTilt: 4,
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
    this.leftBlush.setAttribute("opacity", String(expr.blush));
    this.rightBlush.setAttribute("opacity", String(expr.blush));

    if (this.expressionLabel) {
      this.expressionLabel.textContent = expr.label;
    }

    this.exprButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.expr === this.currentExpression);
    });
  }

  setSpeaking(active) {
    this.isSpeaking = active;
    if (!active) {
      this.targetMouthOpen = 0;
      this.targetMouthWidth = 1;
    }
  }

  setMouthTarget(openAmount, widthFactor = 1) {
    this.targetMouthOpen = Math.max(0, Math.min(1, openAmount));
    this.targetMouthWidth = Math.max(0.65, Math.min(1.25, widthFactor));
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
        // Occasional natural double-blink
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
    const w = 22 * this.mouthWidth;
    const smile = expr.smileCurve;

    if (this.mouthOpen < 0.06) {
      // Closed expressive mouth
      const lipPath =
        this.currentExpression === "surprised"
          ? `M -8 2 A 8 7 0 1 0 8 2 A 8 7 0 1 0 -8 2 Z`
          : `M ${-w} 0 Q 0 ${smile} ${w} 0`;

      this.mouthLips.setAttribute("d", lipPath);
      this.mouthCavity.setAttribute("d", `M ${-w + 2} 0 Q 0 1 ${w - 2} 0 Q 0 1 ${-w + 2} 0 Z`);
      this.mouthTeeth.setAttribute("opacity", "0");
      this.mouthTongue.setAttribute("opacity", "0");
      return;
    }

    const openH = 4 + this.mouthOpen * 19;
    const upperY = -1.5;
    const lowerY = openH + smile * 0.25;

    const cavityPath = `M ${-w + 2} ${upperY} Q 0 ${upperY + 2.5} ${w - 2} ${upperY} Q 0 ${lowerY + 4} ${-w + 2} ${upperY} Z`;
    const lipsPath = `M ${-w} ${upperY} Q 0 ${upperY + 2} ${w} ${upperY} Q 0 ${lowerY + 5} ${-w} ${upperY} Z`;

    this.mouthCavity.setAttribute("d", cavityPath);
    this.mouthLips.setAttribute("d", lipsPath);

    const showInner = Math.min(1, this.mouthOpen * 1.6);
    this.mouthTeeth.setAttribute("opacity", (showInner * 0.9).toFixed(2));
    this.mouthTongue.setAttribute("opacity", (showInner * 0.85).toFixed(2));
    this.mouthTongue.setAttribute("cy", (openH * 0.52 + 2).toFixed(1));
  }

  animate(now) {
    const t = (now - this.startTime) / 1000;
    const expr = this.expressions[this.currentExpression] || this.expressions.warm;

    // Breathing & gentle idle sway
    const breathY = Math.sin(t * 1.6) * 2.4;
    const swayX = Math.sin(t * 0.75) * 1.8;
    const speakNod = this.isSpeaking ? Math.sin(t * 7.2) * 1.9 : 0;
    const headTilt = expr.headTilt + Math.sin(t * 0.65) * 1.2 + (this.isSpeaking ? Math.sin(t * 4.5) * 1.4 : 0);

    this.headRig.setAttribute(
      "transform",
      `translate(${swayX.toFixed(2)}, ${(breathY + speakNod).toFixed(2)}) rotate(${headTilt.toFixed(2)} 210 260)`
    );
    this.torsoGroup.setAttribute("transform", `translate(0, ${(breathY * 0.55).toFixed(2)})`);

    // Floating lantern bob
    const lanternBob = Math.sin(t * 1.9 + 0.8) * 5;
    this.lanternGroup.setAttribute("transform", `translate(345, ${(290 + lanternBob).toFixed(2)})`);
    this.lanternAura.setAttribute("opacity", (0.12 + Math.sin(t * 3.1) * 0.04).toFixed(3));

    // Gaze smoothing (thinking looks slightly up-right)
    const gxTarget = this.currentExpression === "thinking" ? 3.5 : this.targetGazeX;
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

    const motes = Array.from({ length: 24 }, () => ({
      x: Math.random() * 600,
      y: Math.random() * 500,
      r: 0.9 + Math.random() * 1.9,
      vy: 0.15 + Math.random() * 0.32,
      vx: (Math.random() - 0.5) * 0.2,
      alpha: 0.18 + Math.random() * 0.45,
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
          ctx.fillStyle = `rgba(226, 230, 238, ${m.alpha})`;
          ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }
}

window.LyraCharacter = LyraCharacter;
