/**
 * Main Application Controller — Connects LucyCharacter, LucyBrain, Cyberpunk Holo-Comms Audio FX,
 * mood-adaptive Web Speech TTS/STT, and Studio UI.
 */
class HoloAudioFX {
  constructor() {
    this.ctx = null;
    this.carrierNode = null;
    this.carrierGain = null;
    this.enabled = true;
  }

  ensureContext() {
    if (!this.enabled) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTone(freqStart, freqEnd, durationSec, type = "sine", peakGain = 0.045, delaySec = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + durationSec);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  playStaticBurst(durationSec = 0.09, peakGain = 0.018) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const sampleCount = Math.floor(ctx.sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1850;
    filter.Q.value = 1.6;

    const gain = ctx.createGain();
    gain.gain.value = peakGain;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  playCallStart() {
    if (!this.enabled) return;
    this.playStaticBurst(0.08, 0.016);
    this.playTone(740, 1180, 0.08, "triangle", 0.038, 0);
    this.playTone(1180, 1480, 0.09, "sine", 0.032, 0.075);
  }

  playCallEnd() {
    if (!this.enabled) return;
    this.playTone(860, 520, 0.09, "sine", 0.026, 0);
    this.playStaticBurst(0.05, 0.01);
  }

  playMoodSwitch(mood) {
    if (!this.enabled) return;
    if (mood === "thinking") {
      this.playTone(540, 320, 0.14, "sawtooth", 0.022, 0);
      this.playTone(680, 920, 0.11, "sine", 0.025, 0.09);
    } else if (mood === "excited" || mood === "surprised") {
      this.playTone(660, 1320, 0.1, "triangle", 0.032, 0);
    } else {
      this.playTone(620, 840, 0.08, "sine", 0.026, 0);
    }
  }

  startCarrierHum() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.stopCarrierHum();

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1650;
    filter.Q.value = 1.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.006, ctx.currentTime + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    this.carrierNode = noise;
    this.carrierGain = gain;
  }

  stopCarrierHum() {
    if (this.carrierGain && this.ctx) {
      try {
        this.carrierGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.06);
      } catch (_) {}
    }
    if (this.carrierNode) {
      const node = this.carrierNode;
      setTimeout(() => {
        try {
          node.stop();
          node.disconnect();
        } catch (_) {}
      }, 70);
      this.carrierNode = null;
      this.carrierGain = null;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const character = new window.LyraCharacter();
  const brain = new window.LyraBrain();
  const holoFx = new HoloAudioFX();

  const stageBackdrop = document.getElementById("stageBackdrop");
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const subtitleText = document.getElementById("subtitleText");
  const moodLockTag = document.getElementById("moodLockTag");
  const voiceMoodMeta = document.getElementById("voiceMoodMeta");

  const chatFeed = document.getElementById("chatFeed");
  const choicesBar = document.getElementById("choicesBar");
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const micBtn = document.getElementById("micBtn");
  const resetStoryBtn = document.getElementById("resetStoryBtn");

  const holoFxBtn = document.getElementById("holoFxBtn");
  const holoFxDot = document.getElementById("holoFxDot");
  const holoFxLabel = document.getElementById("holoFxLabel");

  const voiceToggleBtn = document.getElementById("voiceToggleBtn");
  const voiceDot = document.getElementById("voiceDot");
  const voiceToggleLabel = document.getElementById("voiceToggleLabel");

  const settingsBtn = document.getElementById("settingsBtn");
  const settingsDialog = document.getElementById("settingsDialog");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const voiceSelect = document.getElementById("voiceSelect");
  const micLangSelect = document.getElementById("micLangSelect");
  const rateRange = document.getElementById("rateRange");
  const pitchRange = document.getElementById("pitchRange");
  const rateVal = document.getElementById("rateVal");
  const pitchVal = document.getElementById("pitchVal");
  const geminiKeyInput = document.getElementById("geminiKeyInput");

  const exprButtons = Array.from(document.querySelectorAll(".expr-btn"));

  // Apply Lucy v4 defaults & clear any previously cached male voice URI
  if (!localStorage.getItem("lucy_v4_fixes")) {
    localStorage.setItem("lyra_rate", "0.96");
    localStorage.setItem("lyra_pitch", "0.96");
    const oldVoice = (localStorage.getItem("lyra_voice_uri") || "").toLowerCase();
    if (!oldVoice || /david|mark|george|daniel|guy|ryan|richard|james|alex|fred|pavel|dmitry|yuri|\bmale\b/.test(oldVoice)) {
      localStorage.removeItem("lyra_voice_uri");
    }
    localStorage.setItem("lucy_v4_fixes", "1");
  }

  let voiceEnabled = true;
  let speechRate = Number(localStorage.getItem("lyra_rate")) || 0.96;
  let speechPitch = Number(localStorage.getItem("lyra_pitch")) || 0.96;
  let selectedVoiceURI = localStorage.getItem("lyra_voice_uri") || "";
  let micLang = localStorage.getItem("lyra_mic_lang") || "en-US";
  let availableVoices = [];

  let selectedMoodButton = "auto";
  let lipSyncInterval = null;
  let fallbackTimer = null;
  let activeUtterance = null;

  // Lucy Cyberpunk 2077 mood-to-voice modulation profiles (cool composed alto base)
  const MOOD_VOICE_PROFILES = {
    warm: { label: "Warm", rateMul: 0.96, pitchOffset: 0.0, cadenceMs: 98, amp: 0.8 },
    happy: { label: "Happy", rateMul: 1.03, pitchOffset: 0.05, cadenceMs: 88, amp: 0.88 },
    excited: { label: "Excited", rateMul: 1.12, pitchOffset: 0.11, cadenceMs: 74, amp: 0.98 },
    thinking: { label: "Thinking", rateMul: 0.84, pitchOffset: -0.07, cadenceMs: 124, amp: 0.62 },
    surprised: { label: "Surprised", rateMul: 1.1, pitchOffset: 0.12, cadenceMs: 78, amp: 0.94 },
    curious: { label: "Curious", rateMul: 0.95, pitchOffset: 0.04, cadenceMs: 96, amp: 0.82 },
  };

  rateRange.value = String(speechRate);
  pitchRange.value = String(speechPitch);
  rateVal.textContent = speechRate.toFixed(2);
  pitchVal.textContent = speechPitch.toFixed(2);
  if (micLangSelect) micLangSelect.value = micLang;
  geminiKeyInput.value = localStorage.getItem("lyra_gemini_key") || "";

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function getVoiceProfile(mood) {
    const base = MOOD_VOICE_PROFILES[mood] || MOOD_VOICE_PROFILES.warm;
    const rate = clamp(speechRate * base.rateMul, 0.68, 1.45);
    const pitch = clamp(speechPitch + base.pitchOffset, 0.78, 1.4);
    return { ...base, rate, pitch };
  }

  function updateVoiceMoodIndicator(mood) {
    const profile = getVoiceProfile(mood);
    if (voiceMoodMeta) {
      voiceMoodMeta.textContent = `${profile.label} · ${profile.rate.toFixed(2)}x`;
    }
  }

  function updateMoodButtonsUI() {
    exprButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.expr === selectedMoodButton);
    });
    if (moodLockTag) {
      const isLocked = selectedMoodButton !== "auto";
      moodLockTag.textContent = isLocked ? "Pinned" : "Auto";
      moodLockTag.classList.toggle("locked", isLocked);
    }
  }

  function setStatus(mode, text) {
    statusDot.classList.remove("speaking", "listening");
    stageBackdrop.classList.remove("speaking");
    if (mode === "speaking") {
      statusDot.classList.add("speaking");
      stageBackdrop.classList.add("speaking");
    } else if (mode === "listening") {
      statusDot.classList.add("listening");
    }
    statusText.textContent = text;
  }

  function appendMessage(sender, text, mood = null) {
    const msg = document.createElement("div");
    msg.className = `msg ${sender}`;

    const meta = document.createElement("div");
    meta.className = "msg-meta";
    const name = document.createElement("strong");
    name.textContent = sender === "lyra" ? "Lucy" : "You";
    const time = document.createElement("span");
    time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    meta.append(name, time);

    if (sender === "lyra" && mood) {
      const tag = document.createElement("span");
      tag.className = "msg-mood-tag";
      tag.textContent = mood;
      meta.appendChild(tag);
    }

    const body = document.createElement("div");
    body.textContent = text;

    msg.append(meta, body);
    chatFeed.appendChild(msg);
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  function renderChoices(choices = []) {
    choicesBar.innerHTML = "";
    choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-chip";
      btn.textContent = choice;
      btn.addEventListener("click", () => handleUserMessage(choice));
      choicesBar.appendChild(btn);
    });
  }

  function stopSpeakingAnimation(playHangup = false) {
    activeUtterance = null;
    if (lipSyncInterval) {
      clearInterval(lipSyncInterval);
      lipSyncInterval = null;
    }
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    holoFx.stopCarrierHum();
    if (playHangup) holoFx.playCallEnd();
    character.setSpeaking(false);
    setStatus("ready", "HOLO-LINK ACTIVE");
  }

  function startLipSyncCadence(profile) {
    if (lipSyncInterval) clearInterval(lipSyncInterval);
    character.setSpeaking(true);
    setStatus("speaking", `HOLO-TX (${profile.label.toUpperCase()})`);

    let step = 0;
    lipSyncInterval = setInterval(() => {
      step += 1;
      const open = (0.2 + Math.abs(Math.sin(step * 0.85)) * 0.68) * profile.amp;
      const width = 0.78 + (Math.cos(step * 0.6) + 1) * 0.2;
      character.setMouthTarget(open, width);
    }, profile.cadenceMs);
  }

  function speakText(text, mood = "warm") {
    stopSpeakingAnimation(false);
    subtitleText.textContent = `"${text}"`;
    const profile = getVoiceProfile(mood);
    updateVoiceMoodIndicator(mood);

    if ("speechSynthesis" in window && voiceEnabled) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      activeUtterance = utterance;
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;

      const isRu = brain.isRussian(text);
      const chosen = isRu
        ? pickBestFemaleVoice(availableVoices, "ru") || availableVoices.find((v) => v.voiceURI === selectedVoiceURI)
        : availableVoices.find((v) => v.voiceURI === selectedVoiceURI) || pickBestFemaleVoice(availableVoices, "en");

      if (chosen) utterance.voice = chosen;

      utterance.onstart = () => {
        if (utterance !== activeUtterance) return;
        holoFx.playCallStart();
        holoFx.startCarrierHum();
        startLipSyncCadence(profile);
      };

      utterance.onboundary = () => {
        if (utterance !== activeUtterance) return;
        character.setMouthTarget((0.78 + Math.random() * 0.22) * profile.amp, 0.85 + Math.random() * 0.28);
      };

      utterance.onend = () => {
        if (utterance !== activeUtterance) return;
        stopSpeakingAnimation(true);
      };

      utterance.onerror = () => {
        if (utterance !== activeUtterance) return;
        stopSpeakingAnimation(false);
      };

      window.speechSynthesis.speak(utterance);
      const estimatedMs = Math.min(16000, Math.max(1800, (text.length * 58) / profile.rate));
      fallbackTimer = setTimeout(() => {
        if (utterance === activeUtterance && !window.speechSynthesis.speaking) {
          stopSpeakingAnimation(false);
        }
      }, estimatedMs + 1200);
    } else {
      startLipSyncCadence(profile);
      const durationMs = Math.min(9500, Math.max(1600, (text.length * 46) / profile.rate));
      fallbackTimer = setTimeout(() => stopSpeakingAnimation(false), durationMs);
    }
  }

  async function handleUserMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    appendMessage("user", trimmed);
    userInput.value = "";
    renderChoices([]);

    const activeMoodBefore = brain.lockedMood || "thinking";
    character.setExpression(activeMoodBefore);
    setStatus("ready", brain.lockedMood === "thinking" ? "NETRUNNING..." : "DECRYPTING...");

    const reply = await brain.respond(trimmed);
    const finalMood = brain.lockedMood || reply.expression || "warm";
    character.setExpression(finalMood);
    appendMessage("lyra", reply.text, finalMood);
    renderChoices(reply.choices || []);
    speakText(reply.text, finalMood);
  }

  function scoreFemaleVoice(voice, targetLang = "en") {
    const name = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();
    let score = 0;

    if (lang.startsWith(targetLang)) score += 60;
    else if (targetLang === "en" && lang.startsWith("en")) score += 60;

    if (
      /aria|jenny|zira|hazel|sonia|libby|natasha|clara|samantha|victoria|karen|ava|allison|susan|serena|tessa|fiona|moira|veena|irina|svetlana|milena|google uk english female|google us english|google русский|female|woman|girl/.test(
        name
      )
    ) {
      score += 55;
    }
    if (/natural|online|neural/.test(name)) score += 15;
    if (/david|mark|george|daniel|guy|ryan|richard|james|alex|fred|pavel|dmitry|yuri|male|man\b/.test(name)) {
      score -= 90;
    }
    return score;
  }

  function pickBestFemaleVoice(voices, targetLang = "en") {
    if (!voices.length) return null;
    const filtered = targetLang === "ru" ? voices.filter((v) => v.lang.toLowerCase().startsWith("ru")) : voices;
    const pool = filtered.length ? filtered : voices;
    return [...pool].sort((a, b) => scoreFemaleVoice(b, targetLang) - scoreFemaleVoice(a, targetLang))[0];
  }

  function populateVoices() {
    if (!("speechSynthesis" in window)) {
      voiceSelect.innerHTML = "<option>Speech Synthesis not supported</option>";
      return;
    }

    availableVoices = window.speechSynthesis.getVoices();
    voiceSelect.innerHTML = "";

    if (!availableVoices.length) {
      const opt = document.createElement("option");
      opt.textContent = "Default Female System Voice";
      voiceSelect.appendChild(opt);
      return;
    }

    const hasSavedVoice = availableVoices.some((v) => v.voiceURI === selectedVoiceURI);
    if (!selectedVoiceURI || !hasSavedVoice) {
      const preferred = pickBestFemaleVoice(availableVoices, "en");
      if (preferred) selectedVoiceURI = preferred.voiceURI;
    }

    availableVoices.forEach((voice) => {
      const opt = document.createElement("option");
      opt.value = voice.voiceURI;
      opt.textContent = `${voice.name} (${voice.lang})`;
      if (voice.voiceURI === selectedVoiceURI) opt.selected = true;
      voiceSelect.appendChild(opt);
    });
  }

  if ("speechSynthesis" in window) {
    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;
  }

  // Mood Selector
  exprButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const moodChoice = btn.dataset.expr;
      selectedMoodButton = moodChoice;
      brain.setMood(moodChoice);
      updateMoodButtonsUI();
      holoFx.playMoodSwitch(moodChoice);

      const reaction = brain.getMoodReaction(moodChoice);
      character.setExpression(reaction.expression);
      appendMessage("lyra", reaction.text, reaction.expression);
      speakText(reaction.text, reaction.expression);
    });
  });

  // Cyberpunk Holo-FX toggle
  holoFxBtn.addEventListener("click", () => {
    holoFx.enabled = !holoFx.enabled;
    holoFxBtn.setAttribute("aria-pressed", String(holoFx.enabled));
    holoFxDot.classList.toggle("active", holoFx.enabled);
    holoFxLabel.textContent = holoFx.enabled ? "Holo-FX On" : "Holo-FX Off";
    if (!holoFx.enabled) {
      holoFx.stopCarrierHum();
    } else {
      holoFx.playMoodSwitch("curious");
    }
  });

  // Voice mute/unmute toggle
  voiceToggleBtn.addEventListener("click", () => {
    voiceEnabled = !voiceEnabled;
    voiceToggleBtn.setAttribute("aria-pressed", String(voiceEnabled));
    voiceDot.classList.toggle("active", voiceEnabled);
    voiceToggleLabel.textContent = voiceEnabled ? "Voice On" : "Voice Muted";
    if (!voiceEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      stopSpeakingAnimation(false);
    }
  });

  // Reset link
  resetStoryBtn.addEventListener("click", () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    stopSpeakingAnimation(false);
    chatFeed.innerHTML = "";
    brain.activeStoryId = null;
    brain.activeNodeId = null;
    brain.pendingRiddle = null;
    selectedMoodButton = "auto";
    brain.setMood("auto");
    updateMoodButtonsUI();

    const welcome = brain.getWelcome();
    character.setExpression(welcome.expression);
    appendMessage("lyra", welcome.text, welcome.expression);
    renderChoices(welcome.choices);
    speakText(welcome.text, welcome.expression);
  });

  // Chat submit
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleUserMessage(userInput.value);
  });

  // Speech Recognition (Voice Input)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isListening = false;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = micLang;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListening = true;
      micBtn.classList.add("listening");
      if (!brain.lockedMood) character.setExpression("curious");
      setStatus("listening", "LISTENING ON HOLO-MIC...");
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      userInput.value = transcript;
      if (event.results[event.results.length - 1].isFinal) {
        handleUserMessage(transcript);
      }
    };

    recognition.onerror = () => {
      isListening = false;
      micBtn.classList.remove("listening");
      setStatus("ready", "HOLO-LINK ACTIVE");
    };

    recognition.onend = () => {
      isListening = false;
      micBtn.classList.remove("listening");
      if (!character.isSpeaking) {
        setStatus("ready", "HOLO-LINK ACTIVE");
      }
    };
  }

  micBtn.addEventListener("click", () => {
    if (!recognition) {
      appendMessage(
        "lyra",
        "Your browser doesn't support Speech Recognition (try Chrome or Edge), or you can type to me anytime!",
        brain.lockedMood || "warm"
      );
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      stopSpeakingAnimation(false);
      recognition.start();
    }
  });

  // Settings Modal
  settingsBtn.addEventListener("click", () => settingsDialog.showModal());
  closeSettingsBtn.addEventListener("click", () => settingsDialog.close());
  rateRange.addEventListener("input", () => {
    rateVal.textContent = Number(rateRange.value).toFixed(2);
  });
  pitchRange.addEventListener("input", () => {
    pitchVal.textContent = Number(pitchRange.value).toFixed(2);
  });
  saveSettingsBtn.addEventListener("click", () => {
    selectedVoiceURI = voiceSelect.value;
    speechRate = Number(rateRange.value);
    speechPitch = Number(pitchRange.value);
    if (micLangSelect) {
      micLang = micLangSelect.value;
      localStorage.setItem("lyra_mic_lang", micLang);
      if (recognition) recognition.lang = micLang;
    }
    localStorage.setItem("lyra_voice_uri", selectedVoiceURI);
    localStorage.setItem("lyra_rate", String(speechRate));
    localStorage.setItem("lyra_pitch", String(speechPitch));
    localStorage.setItem("lyra_gemini_key", geminiKeyInput.value.trim());
    updateVoiceMoodIndicator(character.currentExpression);
    settingsDialog.close();
  });

  // Initial welcome
  updateMoodButtonsUI();
  updateVoiceMoodIndicator("warm");
  const welcome = brain.getWelcome();
  character.setExpression(welcome.expression);
  appendMessage("lyra", welcome.text, welcome.expression);
  renderChoices(welcome.choices);
  subtitleText.textContent = `"${welcome.text}"`;
});
