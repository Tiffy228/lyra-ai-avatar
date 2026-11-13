/**
 * Main Application Controller — Connects LyraCharacter, LyraBrain, mood-adaptive Web Speech TTS/STT, and UI.
 */
document.addEventListener("DOMContentLoaded", () => {
  const character = new window.LyraCharacter();
  const brain = new window.LyraBrain();

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

  const voiceToggleBtn = document.getElementById("voiceToggleBtn");
  const voiceDot = document.getElementById("voiceDot");
  const voiceToggleLabel = document.getElementById("voiceToggleLabel");

  const settingsBtn = document.getElementById("settingsBtn");
  const settingsDialog = document.getElementById("settingsDialog");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const voiceSelect = document.getElementById("voiceSelect");
  const rateRange = document.getElementById("rateRange");
  const pitchRange = document.getElementById("pitchRange");
  const rateVal = document.getElementById("rateVal");
  const pitchVal = document.getElementById("pitchVal");
  const geminiKeyInput = document.getElementById("geminiKeyInput");

  const exprButtons = Array.from(document.querySelectorAll(".expr-btn"));

  let voiceEnabled = true;
  let speechRate = Number(localStorage.getItem("lyra_rate")) || 1.0;
  let speechPitch = Number(localStorage.getItem("lyra_pitch")) || 1.14;
  let selectedVoiceURI = localStorage.getItem("lyra_voice_uri") || "";
  let availableVoices = [];

  let selectedMoodButton = "auto";
  let lipSyncInterval = null;
  let fallbackTimer = null;
  let activeUtterance = null;

  // Mood-to-voice modulation profiles
  const MOOD_VOICE_PROFILES = {
    warm: { label: "Warm", rateMul: 1.0, pitchOffset: 0.0, cadenceMs: 95, amp: 0.85 },
    happy: { label: "Happy", rateMul: 1.06, pitchOffset: 0.06, cadenceMs: 85, amp: 0.92 },
    excited: { label: "Excited", rateMul: 1.15, pitchOffset: 0.13, cadenceMs: 72, amp: 1.0 },
    thinking: { label: "Thinking", rateMul: 0.83, pitchOffset: -0.1, cadenceMs: 125, amp: 0.65 },
    surprised: { label: "Surprised", rateMul: 1.12, pitchOffset: 0.14, cadenceMs: 78, amp: 0.95 },
    curious: { label: "Curious", rateMul: 0.96, pitchOffset: 0.05, cadenceMs: 95, amp: 0.82 },
  };

  rateRange.value = String(speechRate);
  pitchRange.value = String(speechPitch);
  rateVal.textContent = speechRate.toFixed(2).replace(/\.00$/, ".0");
  pitchVal.textContent = speechPitch.toFixed(2);
  geminiKeyInput.value = localStorage.getItem("lyra_gemini_key") || "";

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function getVoiceProfile(mood) {
    const base = MOOD_VOICE_PROFILES[mood] || MOOD_VOICE_PROFILES.warm;
    const rate = clamp(speechRate * base.rateMul, 0.65, 1.5);
    const pitch = clamp(speechPitch + base.pitchOffset, 0.75, 1.55);
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
    name.textContent = sender === "lyra" ? "Lyra" : "You";
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

  function stopSpeakingAnimation() {
    if (lipSyncInterval) {
      clearInterval(lipSyncInterval);
      lipSyncInterval = null;
    }
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    character.setSpeaking(false);
    setStatus("ready", "Online · Ready");
  }

  function startLipSyncCadence(profile) {
    if (lipSyncInterval) clearInterval(lipSyncInterval);
    character.setSpeaking(true);
    setStatus("speaking", `Speaking (${profile.label})...`);

    let step = 0;
    lipSyncInterval = setInterval(() => {
      step += 1;
      const open = (0.2 + Math.abs(Math.sin(step * 0.85)) * 0.68) * profile.amp;
      const width = 0.78 + (Math.cos(step * 0.6) + 1) * 0.2;
      character.setMouthTarget(open, width);
    }, profile.cadenceMs);
  }

  function speakText(text, mood = "warm") {
    stopSpeakingAnimation();
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
        startLipSyncCadence(profile);
      };

      utterance.onboundary = () => {
        if (utterance !== activeUtterance) return;
        character.setMouthTarget((0.78 + Math.random() * 0.22) * profile.amp, 0.85 + Math.random() * 0.28);
      };

      utterance.onend = () => {
        if (utterance !== activeUtterance) return;
        stopSpeakingAnimation();
      };

      utterance.onerror = () => {
        if (utterance !== activeUtterance) return;
        stopSpeakingAnimation();
      };

      window.speechSynthesis.speak(utterance);
      const estimatedMs = Math.min(16000, Math.max(1800, (text.length * 58) / profile.rate));
      fallbackTimer = setTimeout(() => {
        if (utterance === activeUtterance && !window.speechSynthesis.speaking) {
          stopSpeakingAnimation();
        }
      }, estimatedMs + 1200);
    } else {
      startLipSyncCadence(profile);
      const durationMs = Math.min(9500, Math.max(1600, (text.length * 46) / profile.rate));
      fallbackTimer = setTimeout(stopSpeakingAnimation, durationMs);
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
    setStatus("ready", brain.lockedMood === "thinking" ? "Analyzing deeply..." : "Thinking...");

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

  // Mood / Expression Selector (updates expression, brain style, AND speaks in that mood's voice!)
  exprButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const moodChoice = btn.dataset.expr;
      selectedMoodButton = moodChoice;
      brain.setMood(moodChoice);
      updateMoodButtonsUI();

      const reaction = brain.getMoodReaction(moodChoice);
      character.setExpression(reaction.expression);
      appendMessage("lyra", reaction.text, reaction.expression);
      speakText(reaction.text, reaction.expression);
    });
  });

  // Voice mute/unmute toggle
  voiceToggleBtn.addEventListener("click", () => {
    voiceEnabled = !voiceEnabled;
    voiceToggleBtn.setAttribute("aria-pressed", String(voiceEnabled));
    voiceDot.classList.toggle("active", voiceEnabled);
    voiceToggleLabel.textContent = voiceEnabled ? "Voice On" : "Voice Muted";
    if (!voiceEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      stopSpeakingAnimation();
    }
  });

  // Reset chat
  resetStoryBtn.addEventListener("click", () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    stopSpeakingAnimation();
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

  // Chat form submit
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
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListening = true;
      micBtn.classList.add("listening");
      if (!brain.lockedMood) character.setExpression("curious");
      setStatus("listening", "Listening to your voice...");
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
      setStatus("ready", "Online · Ready");
    };

    recognition.onend = () => {
      isListening = false;
      micBtn.classList.remove("listening");
      if (!character.isSpeaking) {
        setStatus("ready", "Online · Ready");
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
      stopSpeakingAnimation();
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
