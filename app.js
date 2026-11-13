/**
 * Main Application Controller — Connects LyraCharacter, LyraBrain, Web Speech TTS/STT, and UI.
 */
document.addEventListener("DOMContentLoaded", () => {
  const character = new window.LyraCharacter();
  const brain = new window.LyraBrain();

  const stageBackdrop = document.querySelector(".stage-backdrop");
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const subtitleText = document.getElementById("subtitleText");

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

  let voiceEnabled = true;
  let speechRate = Number(localStorage.getItem("lyra_rate")) || 1.0;
  let speechPitch = Number(localStorage.getItem("lyra_pitch")) || 1.12;
  let selectedVoiceURI = localStorage.getItem("lyra_voice_uri") || "";
  let availableVoices = [];

  let lipSyncInterval = null;
  let fallbackTimer = null;
  let activeUtterance = null;

  // Initialize settings UI values
  rateRange.value = String(speechRate);
  pitchRange.value = String(speechPitch);
  rateVal.textContent = speechRate.toFixed(2).replace(/\.00$/, ".0");
  pitchVal.textContent = speechPitch.toFixed(2);
  geminiKeyInput.value = localStorage.getItem("lyra_gemini_key") || "";

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

  function appendMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className = `msg ${sender}`;

    const meta = document.createElement("div");
    meta.className = "msg-meta";
    const name = document.createElement("strong");
    name.textContent = sender === "lyra" ? "Lyra" : "You";
    const time = document.createElement("span");
    time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    meta.append(name, time);

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
    setStatus("ready", "Ready to tell a story");
  }

  function startLipSyncCadence() {
    if (lipSyncInterval) clearInterval(lipSyncInterval);
    character.setSpeaking(true);
    setStatus("speaking", "Lyra is speaking...");

    let step = 0;
    lipSyncInterval = setInterval(() => {
      step += 1;
      // Natural syllable-like open/close envelope with varied width
      const open = 0.22 + Math.abs(Math.sin(step * 0.85)) * 0.68;
      const width = 0.78 + (Math.cos(step * 0.6) + 1) * 0.2;
      character.setMouthTarget(open, width);
    }, 95);
  }

  function speakText(text) {
    stopSpeakingAnimation();
    subtitleText.textContent = `"${text}"`;

    if ("speechSynthesis" in window && voiceEnabled) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      activeUtterance = utterance;
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;

      const chosen =
        availableVoices.find((v) => v.voiceURI === selectedVoiceURI) ||
        pickBestFemaleVoice(availableVoices);
      if (chosen) utterance.voice = chosen;

      utterance.onstart = () => {
        if (utterance !== activeUtterance) return;
        startLipSyncCadence();
      };

      utterance.onboundary = () => {
        if (utterance !== activeUtterance) return;
        // Extra crisp mouth accent on word boundaries
        character.setMouthTarget(0.85 + Math.random() * 0.15, 0.85 + Math.random() * 0.3);
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
      // Safety fallback in case browser doesn't fire onstart/onend reliably
      const estimatedMs = Math.min(14000, Math.max(1800, text.length * 58));
      fallbackTimer = setTimeout(() => {
        if (utterance === activeUtterance && !window.speechSynthesis.speaking) {
          stopSpeakingAnimation();
        }
      }, estimatedMs + 1200);
    } else {
      // Muted or unsupported TTS: animate mouth for realistic reading duration
      startLipSyncCadence();
      const durationMs = Math.min(9000, Math.max(1600, text.length * 46));
      fallbackTimer = setTimeout(stopSpeakingAnimation, durationMs);
    }
  }

  async function handleUserMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    appendMessage("user", trimmed);
    userInput.value = "";
    renderChoices([]);

    character.setExpression("thinking");
    setStatus("ready", "Lyra is thinking...");

    const reply = await brain.respond(trimmed);
    character.setExpression(reply.expression || "warm");
    appendMessage("lyra", reply.text);
    renderChoices(reply.choices || []);
    speakText(reply.text);
  }

  function scoreFemaleVoice(voice) {
    const name = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();
    let score = 0;
    if (lang.startsWith("en")) score += 30;
    if (/aria|jenny|zira|hazel|sonia|libby|natasha|clara|samantha|victoria|karen|ava|allison|susan|serena|tessa|fiona|moira|veena|google uk english female|google us english|female|woman|girl/.test(name)) {
      score += 50;
    }
    if (/natural|online|neural/.test(name)) score += 15;
    if (/david|mark|george|daniel|guy|ryan|richard|james|alex|fred|male|man\b/.test(name)) {
      score -= 80;
    }
    return score;
  }

  function pickBestFemaleVoice(voices) {
    if (!voices.length) return null;
    return [...voices].sort((a, b) => scoreFemaleVoice(b) - scoreFemaleVoice(a))[0];
  }

  // Load TTS Voices
  function populateVoices() {
    if (!("speechSynthesis" in window)) {
      voiceSelect.innerHTML = "<option>Speech Synthesis not supported</option>";
      return;
    }

    availableVoices = window.speechSynthesis.getVoices();
    voiceSelect.innerHTML = "";

    if (!availableVoices.length) {
      const opt = document.createElement("option");
      opt.textContent = "Default System Voice";
      voiceSelect.appendChild(opt);
      return;
    }

    const hasSavedVoice = availableVoices.some((v) => v.voiceURI === selectedVoiceURI);
    if (!selectedVoiceURI || !hasSavedVoice) {
      const preferred = pickBestFemaleVoice(availableVoices);
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

  // Expression tester buttons
  document.querySelectorAll(".expr-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      character.setExpression(btn.dataset.expr);
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

  // Reset story
  resetStoryBtn.addEventListener("click", () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    stopSpeakingAnimation();
    chatFeed.innerHTML = "";
    const welcome = brain.getWelcome();
    brain.activeStory = null;
    brain.storyStep = 0;
    character.setExpression(welcome.expression);
    appendMessage("lyra", welcome.text);
    renderChoices(welcome.choices);
    speakText(welcome.text);
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
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListening = true;
      micBtn.classList.add("listening");
      character.setExpression("curious");
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
      setStatus("ready", "Ready to tell a story");
    };

    recognition.onend = () => {
      isListening = false;
      micBtn.classList.remove("listening");
      if (!character.isSpeaking) {
        setStatus("ready", "Ready to tell a story");
      }
    };
  }

  micBtn.addEventListener("click", () => {
    if (!recognition) {
      appendMessage(
        "lyra",
        "Your browser doesn't support Speech Recognition (try Chrome or Edge), or you can type to me anytime!"
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
    settingsDialog.close();
  });

  // Initial welcome message
  const welcome = brain.getWelcome();
  character.setExpression(welcome.expression);
  appendMessage("lyra", welcome.text);
  renderChoices(welcome.choices);
  subtitleText.textContent = `"${welcome.text}"`;
});
