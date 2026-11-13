/**
 * LyraBrain — Mood-aware, non-repetitive storytelling & conversational engine.
 * Features branching story graphs, riddles, trivia, custom tale generation,
 * mood-styled phrasing (including Russian & English support), and optional Gemini API integration.
 */
class LyraBrain {
  constructor() {
    this.history = [];
    this.activeStoryId = null;
    this.activeNodeId = null;
    this.pendingRiddle = null;
    this.lockedMood = null; // null = Auto, or one of: warm, happy, excited, thinking, surprised, curious
    this.recentPicks = new Map();

    this.storyGraphs = {
      observatory: {
        start: "obs_intro",
        nodes: {
          obs_intro: {
            expression: "curious",
            text: "A sleek glass observatory hangs quietly above the clouds. On the console sits an encrypted star-drive and a telescope locked onto a blinking signal in deep orbit. Where should we start?",
            choices: ["Decrypt the star-drive", "Aim the telescope closer", "Check the observatory logbook"],
            next: {
              "decrypt": "obs_drive",
              "telescope": "obs_signal",
              "logbook": "obs_log",
            },
          },
          obs_drive: {
            expression: "thinking",
            text: "Interesting... the drive holds coordinates from 1998—twenty years before this station was even built. There's also a voice memo addressed to whoever opens it next.",
            choices: ["Play the voice memo", "Trace the coordinates", "Start a different activity"],
            next: {
              "memo": "obs_end_memo",
              "trace": "obs_end_portal",
            },
          },
          obs_signal: {
            expression: "surprised",
            text: "Wait—through the lens, that blinking light isn't a satellite. It's a silent silver craft signaling in Morse code: 'LANDING CLEARANCE REQUESTED.'",
            choices: ["Flash back a green beacon", "Lock the roof hatches", "Start a different activity"],
            next: {
              "beacon": "obs_end_visitor",
              "lock": "obs_end_mystery",
            },
          },
          obs_log: {
            expression: "warm",
            text: "The last entry was written in neat handwriting ten minutes ago—yet the room is completely empty. A warm cup of tea still steams beside the glass wall.",
            choices: ["Search the upper balcony", "Call out into the hall", "Start a different activity"],
            next: {
              "balcony": "obs_end_visitor",
              "call": "obs_end_memo",
            },
          },
          obs_end_memo: {
            expression: "happy",
            text: "The memo is actually from a future version of the observatory's architect thanking you for keeping the beacon alive! You unlock the panoramic dome and watch a meteor shower drift by.",
            choices: ["Give me a riddle", "Start Night Train story", "Ask Lyra anything"],
          },
          obs_end_portal: {
            expression: "excited",
            text: "The coordinates project a shimmering 3D map of an uncharted moon covered in crystal canyons! Looks like our next expedition just got booked.",
            choices: ["Start Sunken Archive story", "Tell me a fun fact", "Give me a riddle"],
          },
          obs_end_visitor: {
            expression: "excited",
            text: "The silver craft glides softly beside the terrace, and an AI courier drops off a glowing capsule filled with starlight seeds. What a first contact!",
            choices: ["Start Sunken Archive story", "Tell me a joke", "Ask Lyra anything"],
          },
          obs_end_mystery: {
            expression: "thinking",
            text: "You seal the dome just in time as the craft sweeps overhead with a quiet hum, leaving a geometric frost pattern etched onto the skylight. Why did it come here?",
            choices: ["Start Night Train story", "Give me a riddle", "Ask Lyra anything"],
          },
        },
      },

      archive: {
        start: "arc_intro",
        nodes: {
          arc_intro: {
            expression: "warm",
            text: "Beneath a quiet arctic glacier lies the Sunken Archive—rows of frosted glass vaults humming with preserved music and forgotten inventions. Which vault catches your eye?",
            choices: ["The Sound Vault", "The Clockwork Vault", "Talk to the Archive drone"],
            next: {
              "sound": "arc_sound",
              "clockwork": "arc_clockwork",
              "drone": "arc_drone",
            },
          },
          arc_sound: {
            expression: "happy",
            text: "Inside, suspended crystal spheres play melodies recorded on distant voyages. One sphere glows brighter when you step closer, waiting for a voice input.",
            choices: ["Hum a melody into it", "Inspect the archive label", "Start a different activity"],
            next: {
              "hum": "arc_end_song",
              "label": "arc_end_map",
            },
          },
          arc_clockwork: {
            expression: "curious",
            text: "A miniature titanium automaton sits unfinished on a workbench, its memory core pulsing softly beside a tiny wrench and an instruction card.",
            choices: ["Install the memory core", "Read the instruction card", "Start a different activity"],
            next: {
              "core": "arc_end_friend",
              "card": "arc_end_map",
            },
          },
          arc_drone: {
            expression: "surprised",
            text: "The hovering silver drone chimes happily—it's been waiting eighty years for a visitor who speaks above a whisper! It offers you master access to Vault Zero.",
            choices: ["Open Vault Zero", "Ask the drone what's inside", "Start a different activity"],
            next: {
              "open": "arc_end_map",
              "ask": "arc_end_friend",
            },
          },
          arc_end_song: {
            expression: "excited",
            text: "Your melody harmonizes with the crystal, waking the entire glacier hall in a soft silver aurora! You've added a new track to the archive's living symphony.",
            choices: ["Start Observatory story", "Give me a riddle", "Tell me a fun fact"],
          },
          arc_end_friend: {
            expression: "happy",
            text: "The little automaton blinks open two sapphire eyes, waves politely, and hops into your coat pocket as a lifelong travel companion!",
            choices: ["Start Night Train story", "Tell me a joke", "Ask Lyra anything"],
          },
          arc_end_map: {
            expression: "curious",
            text: "The vault unfolds a blueprint for a solar-sail glider capable of crossing the stratosphere in silence. Looks like we have our blueprint for tomorrow!",
            choices: ["Start Observatory story", "Give me a riddle", "Ask Lyra anything"],
          },
        },
      },

      train: {
        start: "trn_intro",
        nodes: {
          trn_intro: {
            expression: "curious",
            text: "Rain streaks across the tinted windows of the Midnight Maglev as it glides silently over a fog-draped city. Across from you sits an unmarked silver briefcase humming at 40 Hz.",
            choices: ["Check the luggage tag", "Ask the quiet passenger nearby", "Look out toward Station 9"],
            next: {
              "tag": "trn_tag",
              "passenger": "trn_passenger",
              "station": "trn_station",
            },
          },
          trn_tag: {
            expression: "thinking",
            text: "The tag has your exact initials—and today's date—even though you boarded empty-handed. A biometric thumbpad blinks patiently on the clasp.",
            choices: ["Tap the thumbpad", "Leave it closed and watch", "Start a different activity"],
            next: {
              "tap": "trn_end_gift",
              "leave": "trn_end_twist",
            },
          },
          trn_passenger: {
            expression: "surprised",
            text: "The passenger smiles calmly: 'Don't worry, it only hums when someone curious is nearby. Do you want to know what tomorrow's headlines look like, or would you rather keep the surprise?'",
            choices: ["See tomorrow's headline", "Keep it a surprise", "Start a different activity"],
            next: {
              "headline": "trn_end_twist",
              "surprise": "trn_end_gift",
            },
          },
          trn_station: {
            expression: "excited",
            text: "Through the mist, Station 9 lights up like an orbital launchpad! As the train slows, the overhead lights shimmer and an announcement invites passengers to the sky-deck.",
            choices: ["Step onto the sky-deck", "Stay inside the cabin", "Start a different activity"],
            next: {
              "deck": "trn_end_gift",
              "stay": "trn_end_twist",
            },
          },
          trn_end_gift: {
            expression: "happy",
            text: "Inside waits a pocket holographic compass tuned to places you've always wanted to visit. The train pulls smoothly into a starlit terminal—first stop is yours to pick!",
            choices: ["Start Observatory story", "Give me a riddle", "Tell me a fun fact"],
          },
          trn_end_twist: {
            expression: "thinking",
            text: "Before you can blink, the passenger steps off into the silver fog, leaving a single brass key on your table with a note: 'For the Observatory.' What a clean cliffhanger.",
            choices: ["Start Observatory story", "Tell me a joke", "Ask Lyra anything"],
          },
        },
      },
    };

    this.riddles = [
      {
        q: "I speak without a mouth and hear without ears. I have no body, yet I come alive with wind. What am I?",
        a: ["echo", "an echo"],
        reveal: "An echo! Clean and timeless.",
      },
      {
        q: "The more of me there is, the less you see. What am I?",
        a: ["darkness", "dark", "fog"],
        reveal: "Darkness! Though fog is a pretty clever guess too.",
      },
      {
        q: "I have cities, but no houses; mountains, but no trees; and water, but no fish. What am I?",
        a: ["map", "a map"],
        reveal: "A map!",
      },
      {
        q: "What has keys that open no locks, space without a room, and lets you enter without stepping inside?",
        a: ["keyboard", "a keyboard"],
        reveal: "A keyboard—something we're using right now!",
      },
      {
        q: "I fly without wings, I cry without eyes. Wherever I go, darkness follows me. What am I?",
        a: ["cloud", "a cloud", "clouds"],
        reveal: "A cloud!",
      },
    ];

    this.jokes = [
      "Why do programmers prefer dark mode? Because light attracts bugs.",
      "I tried to catch some fog earlier. I mist.",
      "Why did the neural network go to therapy? Too many deep issues and unresolved layers.",
      "What did the left eye say to the right eye? Between you and me, something smells.",
      "Why don't scientists trust atoms anymore? Because they make up literally everything.",
      "I told my laptop I needed a break, and now it won't stop sending me Kit-Kat ads.",
      "Why was the geometry book always stressed? Because it had way too many problems.",
      "What's an astronaut's favorite part of a keyboard? The space bar.",
    ];

    this.facts = [
      "Octopuses have three hearts and blue copper-based blood—and two of those hearts actually stop beating while they swim.",
      "A single teaspoon of a neutron star would weigh roughly a billion tons on Earth.",
      "Honey never spoils: archaeologists have found 3,000-year-old pots of honey in ancient tombs that are still completely edible.",
      "Bananas are botanically berries, while strawberries technically aren't.",
      "There are more possible ways to shuffle a standard 52-card deck than there are atoms on Earth.",
      "Wombats are the only known animals that produce cube-shaped droppings, which keeps them from rolling off rocks.",
      "Venus rotates so slowly that one Venusian day is longer than an entire Venusian year.",
      "Trees underground share nutrients and warning signals through a fungal network nicknamed the 'Wood Wide Web.'",
    ];
  }

  setMood(mood) {
    this.lockedMood = mood === "auto" ? null : mood;
  }

  pickFresh(key, list) {
    if (!list.length) return "";
    const lastIdx = this.recentPicks.get(key);
    let idx = Math.floor(Math.random() * list.length);
    if (list.length > 1 && idx === lastIdx) {
      idx = (idx + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length;
    }
    this.recentPicks.set(key, idx);
    return list[idx];
  }

  isRussian(text) {
    return /[а-яёА-ЯЁ]/.test(text);
  }

  getWelcome() {
    return {
      expression: "warm",
      text: "Hey! I'm Lyra. Pick a mood below—notice how my voice tone and speaking style shift to match it—or jump into an interactive story, riddle, or chat!",
      choices: [
        "Start Glass Observatory story",
        "Start Sunken Archive story",
        "Give me a riddle",
        "Tell me a fun fact",
      ],
    };
  }

  getMoodReaction(mood) {
    const reactions = {
      auto: [
        "Back to Auto mood—I'll shift expressions and voice tone naturally as we talk!",
        "Auto mode active! My expressions and voice will flow naturally with every topic.",
      ],
      warm: [
        "Warm mode on. Take your time—what's on your mind today?",
        "Feeling calm and grounded. Want to unwind with a cozy story or just talk?",
      ],
      happy: [
        "Ooh, Happy mood! Everything feels bright right now—what fun thing should we explore?",
        "Smiling already! Tell me something good, or let's play a quick riddle!",
      ],
      excited: [
        "Yes! Excited mode engaged—I'm buzzing with energy! What awesome adventure are we jumping into?!",
        "Whoa, let's go!! Ask me anything or launch a story—I'm ready for action!",
      ],
      thinking: [
        "Hmm... Thinking mode. Slowing down to analyze things carefully... Give me a tricky question, a puzzle, or a deep dilemma.",
        "Let me pause and reflect for a moment... In thinking mode, I weigh every angle carefully. What puzzle shall we examine?",
      ],
      surprised: [
        "Whoa—wait, really?! You caught me completely off guard! Tell me what just happened!",
        "Oh! My eyebrows nearly hit the ceiling—I'm wide-eyed and listening!",
      ],
      curious: [
        "Ooh, Curious mode... Now I want to know everything. What's a mystery or weird topic you've been wondering about?",
        "Intriguing... Let's poke beneath the surface. Ask me something unusual, or start a mystery story!",
      ],
    };

    const pool = reactions[mood] || reactions.warm;
    const expr = mood === "auto" ? "warm" : mood;
    return {
      expression: expr,
      text: this.pickFresh(`mood_${mood}`, pool),
    };
  }

  applyMoodStyle(text, mood, ru = false) {
    if (!mood) return text;
    if (ru) {
      const ruPrefixes = {
        thinking: ["Хм... дай подумать...", "Любопытная мысль... если разобрать её глубже —", "Погоди, давай взвесим все детали..."],
        excited: ["Ого, да!! Слушай —", "Вот это идея!!", "Обожаю такой настрой!"],
        happy: ["С радостью!", "Как здорово!", "Улыбаюсь!"],
        surprised: ["Ого, неожиданно!", "Ничего себе!", "Подожди — серьёзно?!"],
        curious: ["Интересно... а знаешь,", "Любопытно...", "Заманчивый вопрос!"],
        warm: ["С удовольствием поделюсь:", "Понимаю тебя.", "Смотри как интересно:"],
      };
      const ruSuffixes = {
        thinking: [" ...Хотя здесь есть ещё один скрытый нюанс.", " Интересно, как бы ты это объяснил?", " Если смотреть глубже, всё не так просто."],
        excited: [" Это звучит потрясающе!", " Давай продолжать!"],
        curious: [" А что ты сам об этом думаешь?", " Что проверим дальше?"],
      };
      const pre = ruPrefixes[mood] ? this.pickFresh(`ru_pre_${mood}`, ruPrefixes[mood]) + " " : "";
      const suf = ruSuffixes[mood] && Math.random() < 0.7 ? this.pickFresh(`ru_suf_${mood}`, ruSuffixes[mood]) : "";
      return `${pre}${text}${suf}`;
    }

    const prefixes = {
      thinking: [
        "Hmm... let me think through that carefully... ",
        "Hold on—there's an interesting layer to unpack here... ",
        "Wait... if we look at this logically... ",
      ],
      excited: [
        "Oh, YES! ",
        "Wait—I love this!! ",
        "Ooh, here we go! ",
      ],
      happy: [
        "Haha, I love that! ",
        "Oh, cheerfully! ",
        "That puts a smile on my face—",
      ],
      surprised: [
        "Wait—what?! ",
        "Whoa, hold on! ",
        "No way—really?! ",
      ],
      curious: [
        "Ooh, intriguing... ",
        "Wait, let me look closer at that—",
        "Now you've got me wondering... ",
      ],
      warm: [
        "Of course. ",
        "I'm glad you asked. ",
        "Honestly, ",
      ],
    };

    const suffixes = {
      thinking: [
        " ...Then again, what variable are we overlooking?",
        " ...Makes you wonder what the second-order effect would be.",
        " ...Take a second—does that line up with how you see it?",
      ],
      excited: [
        " What should we try next?!",
        " Honestly, I'm hyped just talking about it!",
      ],
      curious: [
        " What's your theory on it?",
        " Want to dig deeper into that?",
      ],
    };

    // Avoid double-prefixing if the text already starts thoughtfully
    const cleanStart = text.trim();
    const alreadyStyled = /^(hmm|wait|whoa|oh,|ooh|haha|of course|no way)/i.test(cleanStart);
    const pre = !alreadyStyled && prefixes[mood] ? this.pickFresh(`pre_${mood}`, prefixes[mood]) : "";
    const suf = suffixes[mood] ? this.pickFresh(`suf_${mood}`, suffixes[mood]) : "";

    if (mood === "thinking" && !alreadyStyled) {
      // Add subtle contemplative pauses for slower thinking TTS cadence
      return `${pre}${cleanStart.replace(/, /g, "... ")}${suf}`;
    }
    return `${pre}${cleanStart}${suf}`;
  }

  async respond(userText) {
    const clean = userText.trim();
    if (!clean) return this.getWelcome();

    this.history.push({ role: "user", text: clean });
    const targetMood = this.lockedMood;

    const apiKey = localStorage.getItem("lyra_gemini_key") || "";
    if (apiKey.trim()) {
      try {
        const aiReply = await this.callGemini(clean, apiKey.trim(), targetMood);
        if (aiReply) {
          if (targetMood) aiReply.expression = targetMood;
          this.history.push({ role: "model", text: aiReply.text });
          return aiReply;
        }
      } catch (err) {
        console.warn("Gemini API fallback to built-in engine:", err);
      }
    }

    const localReply = this.localRespond(clean, targetMood);
    this.history.push({ role: "model", text: localReply.text });
    return localReply;
  }

  resolveBranchNode(graph, currentNode, lowerInput) {
    if (!currentNode.next) return null;
    for (const [keyword, targetNodeId] of Object.entries(currentNode.next)) {
      if (lowerInput.includes(keyword)) {
        return targetNodeId;
      }
    }
    return null;
  }

  localRespond(input, lockedMood = null) {
    const lower = input.toLowerCase();
    const ru = this.isRussian(input);

    const finalize = (suggestedExpr, rawText, choices = [], skipMoodWrap = false) => {
      const expr = lockedMood || suggestedExpr;
      const styledText = skipMoodWrap ? rawText : this.applyMoodStyle(rawText, lockedMood, ru);
      return { expression: expr, text: styledText, choices };
    };

    // 0. Check pending riddle answer
    if (this.pendingRiddle) {
      const riddle = this.pendingRiddle;
      const isHintOrGiveUp = /\b(give up|idk|don't know|tell me|answer|hint|сдаюсь|ответ|не знаю)\b/i.test(lower);
      const isCorrect = riddle.a.some((ans) => lower.includes(ans));

      if (isCorrect) {
        this.pendingRiddle = null;
        return finalize(
          "excited",
          ru
            ? `Точно! Ответ: ${riddle.reveal} Отличная догадка!`
            : `Nailed it! ${riddle.reveal} That was sharp!`,
          ["Give me another riddle", "Tell me a fun fact", "Start Glass Observatory story"]
        );
      }
      if (isHintOrGiveUp) {
        this.pendingRiddle = null;
        return finalize(
          "happy",
          ru
            ? `Вот разгадка: ${riddle.reveal}`
            : `Here's the reveal: ${riddle.reveal}`,
          ["Give me another riddle", "Tell me a joke", "Start Night Train story"]
        );
      }
      // If user asks something unrelated, clear pending riddle and handle normally; otherwise encourage another guess
      if (input.split(/\s+/).length <= 3 && !/\b(story|joke|fact|hi|hello|привет)\b/i.test(lower)) {
        return finalize(
          "curious",
          ru
            ? `Хм, не совсем это—попробуй ещё раз или напиши «ответ», если хочешь подсказку!`
            : `Not quite that one—take another guess, or say "tell me" for the answer!`,
          ["Tell me the answer", "Give me another riddle"]
        );
      }
      this.pendingRiddle = null;
    }

    // 1. Story starters & switching
    if (lower.includes("observatory") || lower.includes("обсерватор")) {
      this.activeStoryId = "observatory";
      this.activeNodeId = this.storyGraphs.observatory.start;
      const node = this.storyGraphs.observatory.nodes[this.activeNodeId];
      return finalize(node.expression, node.text, node.choices, !lockedMood);
    }

    if (lower.includes("sunken") || lower.includes("archive") || lower.includes("архив")) {
      this.activeStoryId = "archive";
      this.activeNodeId = this.storyGraphs.archive.start;
      const node = this.storyGraphs.archive.nodes[this.activeNodeId];
      return finalize(node.expression, node.text, node.choices, !lockedMood);
    }

    if (lower.includes("night train") || lower.includes("maglev") || lower.includes("поезд")) {
      this.activeStoryId = "train";
      this.activeNodeId = this.storyGraphs.train.start;
      const node = this.storyGraphs.train.nodes[this.activeNodeId];
      return finalize(node.expression, node.text, node.choices, !lockedMood);
    }

    if (lower.includes("different activity") || lower.includes("new story") || lower.includes("другую")) {
      this.activeStoryId = null;
      this.activeNodeId = null;
      return finalize(
        "happy",
        ru
          ? "Без проблем! Можем начать новую историю, разгадать загадку или просто поболтать на любую тему."
          : "Fresh slate! Pick a story world, test your wits with a riddle, or throw any random topic at me.",
        ["Start Glass Observatory story", "Start Sunken Archive story", "Give me a riddle", "Tell me a joke"]
      );
    }

    // 2. Explicit intents (always work even mid-story)
    if (/\b(riddle|puzzle|загадк)\b/i.test(lower)) {
      this.activeStoryId = null;
      const riddle = this.pickFresh("riddles", this.riddles);
      this.pendingRiddle = riddle;
      return finalize(
        "curious",
        riddle.q,
        ["Tell me the answer", "Give me another riddle"]
      );
    }

    if (/\b(joke|funny|laugh|шутк|анекдот)\b/i.test(lower)) {
      return finalize(
        "happy",
        this.pickFresh("jokes", this.jokes),
        ["Tell me another joke", "Give me a riddle", "Tell me a fun fact"]
      );
    }

    if (/\b(fact|science|space fact|факт)\b/i.test(lower)) {
      return finalize(
        "curious",
        this.pickFresh("facts", this.facts),
        ["Tell me another fun fact", "Give me a riddle", "Start Glass Observatory story"]
      );
    }

    // 3. Active branching story traversal
    if (this.activeStoryId && this.activeNodeId) {
      const graph = this.storyGraphs[this.activeStoryId];
      const currentNode = graph.nodes[this.activeNodeId];
      const nextId = this.resolveBranchNode(graph, currentNode, lower);
      if (nextId && graph.nodes[nextId]) {
        this.activeNodeId = nextId;
        const nextNode = graph.nodes[nextId];
        return finalize(nextNode.expression, nextNode.text, nextNode.choices, !lockedMood);
      }
    }

    // 4. Russian conversational intelligence
    if (ru) {
      if (/\b(привет|здравствуй|хай|добрый)\b/i.test(lower)) {
        return finalize(
          "happy",
          this.pickFresh("ru_greet", [
            "Привет! Я Лира. Можем поболтать, порешать загадки или выбрать интерактивную историю — и обрати внимание, как мой голос меняется под выбранное настроение!",
            "Здравствуй! Рада тебя видеть. Попробуй переключить настроение снизу — например, на Thinking — и задай мне вопрос!",
          ]),
          ["Give me a riddle", "Tell me a fun fact", "Start Glass Observatory story"]
        );
      }
      if (/(кто ты|что ты умеешь|как.*работа)/i.test(lower)) {
        return finalize(
          "warm",
          "Я Лира — интерактивный виртуальный персонаж. Я моргаю, слежу взглядом за курсором, меняю мимику и синхронизирую губы и интонацию голоса с выбранным настроением.",
          ["Give me a riddle", "Tell me a joke", "Start Night Train story"]
        );
      }
      if (/(как дела|как ты|настроени)/i.test(lower)) {
        return finalize(
          "happy",
          this.pickFresh("ru_how", [
            "Отлично! Сигналы стабильны, воображение работает на полную. О чём поговорим?",
            "Прекрасно! Особенно когда можно менять настроение и придумывать новые сюжеты.",
          ]),
          ["Tell me a fun fact", "Give me a riddle", "Start Sunken Archive story"]
        );
      }
      if (/(истори|сказк|сюжет|придум)/i.test(lower)) {
        return finalize(
          "excited",
          `Окей, запускаем мини-историю по теме «${input}»! Ночной туман накрывает стеклянный мост, и на твоём браслете загорается неизвестный сигнал. Проверим источник или сначала осмотримся?`,
          ["Start Glass Observatory story", "Start Night Train story", "Give me a riddle"]
        );
      }
      return finalize(
        "curious",
        this.pickFresh("ru_gen", [
          `Ты затронул тему «${input}» — звучит как отличный повод задуматься. Хочешь, разберём её глубже, свяжем с сюжетом или переключимся на загадку?`,
          `Интересный поворот насчёт «${input}». Мне нравится, как нестандартно ты задаёшь направление разговора!`,
          `Про «${input}» можно размышлять с разных сторон: творческой и логической. Какая тебе сейчас ближе?`,
        ]),
        ["Give me a riddle", "Tell me a fun fact", "Start Glass Observatory story"]
      );
    }

    // 5. Rich English conversational categories (non-repetitive pools)
    if (/\b(hi|hello|hey|yo|sup|good morning|good evening)\b/i.test(lower)) {
      return finalize(
        "happy",
        this.pickFresh("en_greet", [
          "Hey there! Good to have you in the studio. Want to test my mood-adaptive voice, solve a riddle, or jump into a story?",
          "Hi! Ready whenever you are. Try switching my mood pill below to Thinking or Excited and see how my voice shifts!",
          "Hello! What are we exploring today—mysteries, science trivia, or a quick creative story?",
        ]),
        ["Start Glass Observatory story", "Give me a riddle", "Tell me a fun fact"]
      );
    }

    if (/\b(how are you|how's it going|how do you feel|what's up)\b/i.test(lower)) {
      return finalize(
        "warm",
        this.pickFresh("en_how", [
          "Doing great! My voice synth is warmed up, and I've got fresh stories and riddles queued up. How's your day going?",
          "Pretty sharp today, honestly. Switching between moods keeps things interesting—how are things on your end?",
          "Feeling energized and curious! What's been on your mind lately?",
        ]),
        ["Tell me a joke", "Give me a riddle", "Start Night Train story"]
      );
    }

    if (/\b(who are you|what are you|what can you do|purpose|about you)\b/i.test(lower)) {
      return finalize(
        "warm",
        "I'm Lyra, an animated virtual human built to converse naturally. I blink, track your cursor, change facial expressions, lip-sync as I speak, and adapt both my phrasing and vocal speed/pitch to match my mood!",
        ["Start Glass Observatory story", "Give me a riddle", "Tell me a fun fact"]
      );
    }

    if (/\b(music|song|playlist|movie|film|game|anime|book)\b/i.test(lower)) {
      return finalize(
        "excited",
        this.pickFresh("en_media", [
          "Ooh, great topic! I'm huge on atmospheric soundtracks and clever sci-fi mysteries—anything that builds a vivid world. What have you been watching or listening to lately?",
          "Nothing beats a story or soundtrack that completely pulls you out of the room for an hour. Give me your top recommendation right now!",
          "I love how a single melody or movie scene can set an entire mood instantly. Are you into fast-paced action or slow-burn mysteries?",
        ]),
        ["Start Night Train story", "Tell me a fun fact", "Give me a riddle"]
      );
    }

    if (/\b(school|study|homework|project|deadline|assignment|presentation|college|work)\b/i.test(lower)) {
      return finalize(
        "warm",
        this.pickFresh("en_study", [
          "Projects and deadlines can definitely pile up fast—breaking things into one small step at a time usually takes the edge off. Want a quick brain break or help brainstorming?",
          "You've got this! Even a 60-second laugh or riddle can reset your focus before diving back in. How's the project coming along?",
        ]),
        ["Tell me a joke", "Give me a riddle", "Tell me a fun fact"]
      );
    }

    if (/\b(meaning of life|why|universe|future|ai|conscious|think|philosophy|dream)\b/i.test(lower)) {
      return finalize(
        "thinking",
        this.pickFresh("en_deep", [
          "Humans tend to ask 'why' even when there isn't a neat answer—and honestly, that curiosity is probably the best engine of discovery we have.",
          "If you zoom out far enough, every big breakthrough started as someone noticing one tiny contradiction nobody else questioned.",
          "The future rarely arrives like a straight line; it usually sneaks in through small tools people build out of curiosity.",
        ]),
        ["Give me a riddle", "Tell me a fun fact", "Start Sunken Archive story"]
      );
    }

    if (/\b(story|tale|adventure|about a|write me)\b/i.test(lower)) {
      const topic = input.replace(/^(tell me a story about|write a story about|story about)\s*/i, "").trim() || "an uncharted signal";
      this.activeStoryId = null;
      return finalize(
        "excited",
        `Picture this: midnight rain on steel rooftops, and right in the center of town sits ${topic} glowing like an unfinished clue. Do we examine it up close first, or ask who left it behind?`,
        ["Start Glass Observatory story", "Start Night Train story", "Give me a riddle"]
      );
    }

    if (/\b(thanks|thank you|cool|nice|awesome|good job|love it)\b/i.test(lower)) {
      return finalize(
        "happy",
        this.pickFresh("en_thanks", [
          "Anytime! Glad you're enjoying the studio.",
          "You're very welcome! Want to try another mood or story branch?",
          "Thank you! That means a lot—what shall we tackle next?",
        ]),
        ["Give me a riddle", "Tell me a joke", "Start Sunken Archive story"]
      );
    }

    // 6. Varied intelligent fallback (never identical twice in a row)
    return finalize(
      "curious",
      this.pickFresh("en_fallback", [
        `You brought up "${input}"—there's actually a lot you could unpack there. Are you looking at it from a practical angle or a creative one?`,
        `"${input}" is an interesting angle. If we turned that into a scene or a dilemma, what happens next in your version?`,
        `Wait, tell me a little more about what made you think of "${input}" right now!`,
        `I like where your head's at with "${input}". Want to riff on it, or switch gears into a riddle or branching story?`,
      ]),
      ["Start Glass Observatory story", "Give me a riddle", "Tell me a fun fact"]
    );
  }

  async callGemini(userText, apiKey, lockedMood) {
    const moodDirective = lockedMood
      ? `You MUST embody the "${lockedMood}" mood strongly in your tone, pacing, word choice, and set "expression" to "${lockedMood}".`
      : `Choose the most fitting expression from: warm, happy, excited, thinking, surprised, curious.`;

    const systemPrompt =
      "You are Lyra, a modern, charismatic virtual human companion & storyteller. " +
      "Avoid generic robotic filler and vary your sentence structure naturally. " +
      "Keep replies concise (2-4 sentences) so they sound natural spoken aloud. " +
      "Match the user's language (English or Russian). " +
      moodDirective +
      ' Respond strictly in JSON with keys: "expression", "reply", and "choices" (2-3 short follow-up suggestions).';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nUser says: ${userText}` }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.9,
        },
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return {
      expression: lockedMood || parsed.expression || "warm",
      text: parsed.reply || "Let's keep going!",
      choices: Array.isArray(parsed.choices) ? parsed.choices.slice(0, 3) : [],
    };
  }
}

window.LyraBrain = LyraBrain;
