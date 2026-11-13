/**
 * LucyBrain — Cyberpunk 2077 / Edgerunners netrunner personality & branching story engine.
 * Supports mood-locked phrasing, no-repeat response pools, interactive riddles,
 * Night City gigs, English/Russian replies, and optional Gemini API integration.
 */
class LyraBrain {
  constructor() {
    this.history = [];
    this.activeStoryId = null;
    this.activeNodeId = null;
    this.pendingRiddle = null;
    this.lockedMood = null;
    this.recentPicks = new Map();

    this.storyGraphs = {
      arasaka: {
        start: "ara_intro",
        nodes: {
          ara_intro: {
            expression: "thinking",
            text: "Holo-link's encrypted. I'm jacked into an old Arasaka data-fortress node in Watson, and their Black ICE just rotated its cipher. Need your call—do I spoof a Trauma Team badge or slip through the cooling-grid port?",
            choices: ["Spoof Trauma Team badge", "Slip through cooling-grid", "Check what's inside the vault"],
            next: {
              "spoof": "ara_spoof",
              "cooling": "ara_cooling",
              "vault": "ara_vault",
            },
          },
          ara_spoof: {
            expression: "curious",
            text: "Clean ping—the perimeter daemon bought the Trauma Team signature, barely. Two encrypted shards sit on the server: one labeled 'Orbital Shuttle Manifest' and another tagged 'Kiroshi Prototype.' Which one do we pull?",
            choices: ["Pull Orbital Manifest", "Pull Kiroshi Prototype", "Jack out and switch gigs"],
            next: {
              "orbital": "ara_end_moon",
              "kiroshi": "ara_end_eddie",
            },
          },
          ara_cooling: {
            expression: "surprised",
            text: "Whoa—temperature sensors spiked! Someone else is already breaching this subnet from inside Night City. Their avatar looks like a ghosted netrunner leaving a message for us.",
            choices: ["Ping the ghost runner", "Wipe our trace and bail", "Jack out and switch gigs"],
            next: {
              "ping": "ara_end_moon",
              "wipe": "ara_end_clean",
            },
          },
          ara_vault: {
            expression: "thinking",
            text: "Hold on... behind three layers of red ICE, there isn't a weapon blueprint. It's a clean ledger of off-grid shuttle tickets to Tycho Crater—Moon passage.",
            choices: ["Clone two tickets", "Trace who paid for them", "Jack out and switch gigs"],
            next: {
              "clone": "ara_end_moon",
              "trace": "ara_end_clean",
            },
          },
          ara_end_moon: {
            expression: "warm",
            text: "Payload secured. Two scrubbed boarding passes to Luna, no corpo trail attached. Guess the real sky isn't out of reach after all, choom.",
            choices: ["Start Kabuki Rooftop gig", "Give me a riddle", "Ask Lucy about Night City"],
          },
          ara_end_eddie: {
            expression: "excited",
            text: "Boom—downloaded in 1.4 seconds! That Kiroshi shard alone is worth enough eddies to keep us off-grid in Heywood for months. Clean run.",
            choices: ["Start Moon BD gig", "Tell me a Night City fact", "Give me a joke"],
          },
          ara_end_clean: {
            expression: "happy",
            text: "Trace wiped, zero flatlines, zero NCPD heat. Not every gig needs fireworks—sometimes walking away unseen is the cleanest win in Night City.",
            choices: ["Start Arasaka Subnet gig", "Give me a riddle", "Ask Lucy anything"],
          },
        },
      },

      kabuki: {
        start: "kab_intro",
        nodes: {
          kab_intro: {
            expression: "warm",
            text: "Rain's hitting the neon signs over Kabuki Market, and we're up on our quiet rooftop away from the noise. My deck just caught an unindexed pirate broadcast coming from Dogtown. Wanna trace it or just watch the city lights?",
            choices: ["Trace the pirate signal", "Stay on the rooftop", "Scan nearby chrome traffic"],
            next: {
              "trace": "kab_signal",
              "rooftop": "kab_moon",
              "scan": "kab_chrome",
            },
          },
          kab_signal: {
            expression: "curious",
            text: "Signal's bouncing off three orbital relays. Hidden in the audio wave is an unreleased Samurai-era synth track and coordinates to an underground netrunner den.",
            choices: ["Head to the netrunner den", "Save the track for later", "Jack out and switch gigs"],
            next: {
              "den": "kab_end_den",
              "track": "kab_end_peace",
            },
          },
          kab_moon: {
            expression: "warm",
            text: "Rare to get a clear break in the smog tonight. Above the megabuildings, you can actually see the Moon—bright, quiet, no corps breathing down your neck.",
            choices: ["Ask about the Moon", "Play some synth music", "Jack out and switch gigs"],
            next: {
              "moon": "kab_end_peace",
              "music": "kab_end_den",
            },
          },
          kab_chrome: {
            expression: "surprised",
            text: "Heads up—three Maelstrom scouts just rolled down the alley below, scanning for rogue cyberdecks. Good thing my cloak daemon's running.",
            choices: ["Short-circuit their optics", "Kill lights and lay low", "Jack out and switch gigs"],
            next: {
              "short": "kab_end_den",
              "low": "kab_end_peace",
            },
          },
          kab_end_den: {
            expression: "excited",
            text: "We slipped right into the underground lounge—ice-cold Nicola on the counter, neon reflections on chrome, and zero corpo eyes. Not bad for a Night City midnight.",
            choices: ["Start Arasaka Subnet gig", "Give me a riddle", "Tell me a joke"],
          },
          kab_end_peace: {
            expression: "happy",
            text: "Just the hum of the rain, cool air, and a clean holo-line. Even in a city built to burn you out, moments like this feel worth keeping.",
            choices: ["Start Moon BD gig", "Tell me a fun fact", "Ask Lucy anything"],
          },
        },
      },

      moon: {
        start: "moon_intro",
        nodes: {
          moon_intro: {
            expression: "warm",
            text: "Booted up my custom Moon Braindance—zero gravity, real sunlight over Tycho Crater, no Night City sirens. Do you want to walk the lunar ridge or test the old orbital rover?",
            choices: ["Walk the lunar ridge", "Drive the orbital rover", "Look back toward Earth"],
            next: {
              "ridge": "moon_ridge",
              "rover": "moon_rover",
              "earth": "moon_earth",
            },
          },
          moon_ridge: {
            expression: "happy",
            text: "Every step lifts you slow in one-sixth gravity. Dust glitters like silver chrome under the visor—and for once, there's not a single billboard in sight.",
            choices: ["Plant a custom holo-flag", "Sit on the crater rim", "Jack out and switch gigs"],
            next: {
              "flag": "moon_end_dream",
              "rim": "moon_end_promise",
            },
          },
          moon_rover: {
            expression: "excited",
            text: "Full throttle across the Mare Tranquillitatis! Zero air drag, glowing tire tracks stretching for miles behind us. Way smoother than dodging traffic in Watson.",
            choices: ["Jump a crater ramp", "Park at the overlook", "Jack out and switch gigs"],
            next: {
              "jump": "moon_end_dream",
              "park": "moon_end_promise",
            },
          },
          moon_earth: {
            expression: "thinking",
            text: "From up here, Earth looks tiny and peaceful—you wouldn't even guess how chaotic Night City is down beneath those clouds. Kinda puts everything in perspective.",
            choices: ["Make a promise to get here for real", "Save the BD memory", "Jack out and switch gigs"],
            next: {
              "promise": "moon_end_promise",
              "save": "moon_end_dream",
            },
          },
          moon_end_dream: {
            expression: "excited",
            text: "Memory logged to cold storage. Whenever the city gets too loud, we've always got a ticket back up here.",
            choices: ["Start Arasaka Subnet gig", "Give me a riddle", "Ask Lucy anything"],
          },
          moon_end_promise: {
            expression: "warm",
            text: "Hey... thanks for sharing the view with me. Don't forget—keep running your own way, choom. I've got your back on the net.",
            choices: ["Start Kabuki Rooftop gig", "Tell me a fun fact", "Give me a joke"],
          },
        },
      },
    };

    this.riddles = [
      {
        q: "I run through every netrunner's deck, protect secrets with ice, yet melt the moment you find my key. What am I?",
        a: ["cipher", "encryption", "password", "code", "data"],
        reveal: "Encryption—or a cipher key.",
      },
      {
        q: "I speak without a mouth and echo through Night City alleys, yet disappear the second silence wins. What am I?",
        a: ["echo", "an echo"],
        reveal: "An echo.",
      },
      {
        q: "The more of me there is in a subnet, the harder it is to see anything clearly. What am I?",
        a: ["darkness", "dark", "fog", "static", "noise"],
        reveal: "Darkness—or static noise.",
      },
      {
        q: "I have cities with no people, towers with no chrome, and highways with no cars. What am I?",
        a: ["map", "a map"],
        reveal: "A map.",
      },
      {
        q: "What has keys that open no doors, space with no stars, and lets you breach systems without leaving your chair?",
        a: ["keyboard", "a keyboard", "cyberdeck"],
        reveal: "A keyboard—or a classic cyberdeck.",
      },
    ];

    this.jokes = [
      "Why did the netrunner get kicked out of Lizzie's Bar? Kept trying to overclock the jukebox.",
      "What's the difference between a corpo promise and a cheap cyberware implant? At least the implant gives you a warning before it glitches.",
      "Why don't Edgerunners play hide-and-seek in Kabuki? Someone always brings Kiroshi optics.",
      "I told my cyberdeck I needed space. Now it keeps sending me orbital shuttle ads.",
      "Why did the AI refuse to cross the Blackwall? Too many sketchy pop-ups on the other side.",
      "What do you call a polite Trauma Team medic? Platinum-tier rare.",
    ];

    this.facts = [
      "On the real Moon, shadows are pitch black because there's no atmosphere to scatter sunlight—just a razor line between blinding light and night.",
      "Octopuses have three hearts and copper-based blue blood, which makes them look like biological netrunners from another planet.",
      "A single teaspoon of neutron-star matter would weigh around a billion tons on Earth.",
      "Light from the Moon only takes about 1.28 seconds to reach Earth—faster than most Night City holo-call pings.",
      "There are more possible combinations in a standard 52-card deck than atoms on Earth.",
      "Venus spins so slowly that one day there lasts longer than an entire Venusian year.",
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
      text: "Holo-link open. I'm Lucy. Stay sharp out here in Night City—pick a gig below, switch my mood to Thinking for a deep netrun, or talk to me by text or voice.",
      choices: [
        "Start Arasaka Subnet gig",
        "Start Kabuki Rooftop gig",
        "Start Moon BD gig",
        "Give me a riddle",
      ],
    };
  }

  getMoodReaction(mood) {
    const reactions = {
      auto: [
        "Back on Auto holo-sync. My voice and expressions will shift naturally as we talk.",
        "Auto mode active—letting the conversation set the pace, choom.",
      ],
      warm: [
        "Quiet rooftop mode. No gigs, no sirens—just take a breath and talk to me.",
        "Warm signal locked. Honestly, it's nice having a calm minute away from Night City's noise.",
      ],
      happy: [
        "Huh—you actually got a genuine smile out of me. What's the good news, choom?",
        "Feeling pretty good for once. Want to run a quick riddle or take a spin through the Moon BD?",
      ],
      excited: [
        "Signal's hot—deck's overclocked and I'm wide awake! What gig are we hitting next?!",
        "Alright, adrenaline's up! Give me a challenge, a cyber-heist, or a wild story prompt!",
      ],
      thinking: [
        "Jacking in... Switching to netrunner analysis mode. Give me a hard problem, a puzzle, or an ICE layer to pick apart.",
        "Slowing the link down... running a deep trace. Ask me something complex—let's break down every angle.",
      ],
      surprised: [
        "Whoa—did our proxy just trip a tracer?! Wait, you totally caught me off guard there!",
        "Wait—seriously?! Didn't see that packet coming at all.",
      ],
      curious: [
        "Interesting signature... Now you've got my optics zoomed in. What's the real story behind that?",
        "Hmm... something doesn't quite add up, and I like it. Tell me more.",
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
        thinking: ["Хм... сканирую подсеть...", "Дай секунду, анализирую сигнал —", "Если разложить это как код на нетраннере..."],
        excited: ["Связь на максимуме!! Слушай —", "Вот это драйв, чумба!", "Погнали!"],
        happy: ["Даже в Найт-Сити бывают светлые моменты.", "Приятно слышать!", "Улыбнуло."],
        surprised: ["Стоп — что?!", "Подожди, это серьёзно?!", "Мой сканер чуть не зашкалил!"],
        curious: ["Любопытный сигнал...", "Хм, за этим явно что-то кроется —", "Интересный поворот."],
        warm: ["Слушай...", "Без спешки, чумба.", "Честно говоря,"],
      };
      const ruSuffixes = {
        thinking: [" ...Хотя проверь ещё один узел — тут может быть скрытый бэкдор.", " Интересно, как ты сам это просчитал?"],
        excited: [" Это тянет на легендарный заказ!", " Продолжаем!"],
        curious: [" Расскажешь подробнее?", " Что проверим дальше?"],
      };
      const pre = ruPrefixes[mood] ? this.pickFresh(`ru_pre_${mood}`, ruPrefixes[mood]) + " " : "";
      const suf = ruSuffixes[mood] && Math.random() < 0.7 ? this.pickFresh(`ru_suf_${mood}`, ruSuffixes[mood]) : "";
      return `${pre}${text}${suf}`;
    }

    const prefixes = {
      thinking: [
        "Scanning the node... ",
        "Hold on—let's trace the logic cleanly... ",
        "Wait... if we strip away the noise here... ",
      ],
      excited: [
        "Preem—let's go!! ",
        "Signal's burning bright—",
        "Alright, now we're talking! ",
      ],
      happy: [
        "Not bad at all. ",
        "Okay, that actually made me smile—",
        "Nova. ",
      ],
      surprised: [
        "Wait—what?! ",
        "Whoa—ICE spike?! ",
        "No kidding—seriously?! ",
      ],
      curious: [
        "Interesting trace... ",
        "Wait, zoom in on that for a second—",
        "Now I'm curious... ",
      ],
      warm: [
        "Hey... ",
        "Listen, choom—",
        "Honestly, ",
      ],
    };

    const suffixes = {
      thinking: [
        " ...Keep an eye on the blind spot though.",
        " ...Does that trace match what you were thinking?",
      ],
      excited: [
        " What's our next move?!",
        " Feels good to run free!",
      ],
      curious: [
        " What's your read on it?",
        " Want me to dig deeper?",
      ],
    };

    const cleanStart = text.trim();
    const alreadyStyled = /^(hmm|wait|whoa|scanning|preem|nova|hey|listen|interesting|not bad)/i.test(cleanStart);
    const pre = !alreadyStyled && prefixes[mood] ? this.pickFresh(`pre_${mood}`, prefixes[mood]) : "";
    const suf = suffixes[mood] ? this.pickFresh(`suf_${mood}`, suffixes[mood]) : "";

    if (mood === "thinking" && !alreadyStyled) {
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

    // 0. Pending riddle check
    if (this.pendingRiddle) {
      const riddle = this.pendingRiddle;
      const isHintOrGiveUp = /\b(give up|idk|don't know|tell me|answer|hint|сдаюсь|ответ|не знаю)\b/i.test(lower);
      const isCorrect = riddle.a.some((ans) => lower.includes(ans));

      if (isCorrect) {
        this.pendingRiddle = null;
        return finalize(
          "excited",
          ru
            ? `В точку, чумба! Ответ: ${riddle.reveal} Отличная реакция!`
            : `Preem guess! ${riddle.reveal} Clean decrypt.`,
          ["Give me another riddle", "Tell me a fun fact", "Start Arasaka Subnet gig"]
        );
      }
      if (isHintOrGiveUp) {
        this.pendingRiddle = null;
        return finalize(
          "happy",
          ru ? `Разгадка: ${riddle.reveal}` : `Decrypt key was: ${riddle.reveal}`,
          ["Give me another riddle", "Tell me a joke", "Start Kabuki Rooftop gig"]
        );
      }
      if (input.split(/\s+/).length <= 3 && !/\b(gig|story|joke|fact|hi|hello|привет)\b/i.test(lower)) {
        return finalize(
          "curious",
          ru
            ? "Почти, но ключ не подошёл—попробуй ещё раз или скажи «ответ»."
            : `Close, but the ICE didn't budge—try another guess, or say "answer" to decrypt it.`,
          ["Tell me the answer", "Give me another riddle"]
        );
      }
      this.pendingRiddle = null;
    }

    // 1. Cyberpunk Story Gigs
    if (lower.includes("arasaka") || lower.includes("subnet") || lower.includes("арасак")) {
      this.activeStoryId = "arasaka";
      this.activeNodeId = this.storyGraphs.arasaka.start;
      const node = this.storyGraphs.arasaka.nodes[this.activeNodeId];
      return finalize(node.expression, node.text, node.choices, !lockedMood);
    }

    if (lower.includes("kabuki") || lower.includes("rooftop") || lower.includes("кабуки")) {
      this.activeStoryId = "kabuki";
      this.activeNodeId = this.storyGraphs.kabuki.start;
      const node = this.storyGraphs.kabuki.nodes[this.activeNodeId];
      return finalize(node.expression, node.text, node.choices, !lockedMood);
    }

    if (lower.includes("moon bd") || lower.includes("start moon") || lower.includes("лун")) {
      this.activeStoryId = "moon";
      this.activeNodeId = this.storyGraphs.moon.start;
      const node = this.storyGraphs.moon.nodes[this.activeNodeId];
      return finalize(node.expression, node.text, node.choices, !lockedMood);
    }

    if (lower.includes("switch gigs") || lower.includes("new story") || lower.includes("другую")) {
      this.activeStoryId = null;
      this.activeNodeId = null;
      return finalize(
        "happy",
        ru
          ? "Отключились от узла. Выбирай новый заказ, загадку или просто поболтаем."
          : "Jacked out cleanly. Pick another Night City gig, try a netrunner riddle, or talk about anything.",
        ["Start Arasaka Subnet gig", "Start Kabuki Rooftop gig", "Start Moon BD gig", "Give me a riddle"]
      );
    }

    // 2. Explicit intents
    if (/\b(riddle|puzzle|загадк)\b/i.test(lower)) {
      this.activeStoryId = null;
      const riddle = this.pickFresh("riddles", this.riddles);
      this.pendingRiddle = riddle;
      return finalize("curious", riddle.q, ["Tell me the answer", "Give me another riddle"]);
    }

    if (/\b(joke|funny|laugh|шутк|анекдот)\b/i.test(lower)) {
      return finalize(
        "happy",
        this.pickFresh("jokes", this.jokes),
        ["Tell me another joke", "Give me a riddle", "Tell me a fun fact"]
      );
    }

    if (/\b(fact|science|space fact|night city fact|факт)\b/i.test(lower)) {
      return finalize(
        "curious",
        this.pickFresh("facts", this.facts),
        ["Tell me another fun fact", "Give me a riddle", "Start Moon BD gig"]
      );
    }

    // 3. Active branching gig traversal
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

    // 4. Cyberpunk Lore & Lucy Character Topics (EN + RU)
    if (/\b(moon|tycho|edgerunners|david|night city|cyberpunk|arasaka|chrome|netrunner|люси|найт-сити|киберпанк|дэвид|луна)\b/i.test(lower)) {
      if (ru) {
        return finalize(
          "warm",
          this.pickFresh("ru_cp", [
            "Найт-Сити выжимает всех, кто забывает зачем бежит. Для меня небо над кратером Тихо на Луне всегда было не просто точкой на карте, а шансом дышать по-настоящему свободно.",
            "Большинство гонятся за хромом и репутацией, а потом сгорают быстрее, чем срабатывает ледокол. Настоящий нетраннер знает: главное — вовремя выйти из сети.",
            "Иногда я просто включаю лунный брейнданс на крыше в Кабуки, чтобы на пять минут забыть о сиренах и корпорациях.",
          ]),
          ["Start Moon BD gig", "Start Kabuki Rooftop gig", "Give me a riddle"]
        );
      }
      return finalize(
        "warm",
        this.pickFresh("en_cp", [
          "Night City wants you to believe there's no way out except climbing a corporate tower. That's why the Moon matters—it's real, quiet, and nobody from Arasaka owns the horizon up there.",
          "Everyone here chases more chrome until there's barely any human left. Best thing a netrunner can keep intact is who they're running for.",
          "Sometimes I sit on a rooftop in Watson, light up a cigarette in the rain, and stare past the smog just to remember there's an actual sky above all this neon.",
        ]),
        ["Start Moon BD gig", "Start Arasaka Subnet gig", "Start Kabuki Rooftop gig"]
      );
    }

    // 5. Russian conversational intelligence
    if (ru) {
      if (/\b(привет|здравствуй|хай|добрый|йо|чумба)\b/i.test(lower)) {
        return finalize(
          "warm",
          this.pickFresh("ru_greet", [
            "Привет, чумба. Холо-связь чистая—можем залезть в подсеть Арасаки, поболтать про Найт-Сити или проверить мой голос в режиме Thinking.",
            "Йо. Я Люси. Выбирай заказ снизу или переключай настроение—мои интонации и мимика подстроятся под сигнал.",
          ]),
          ["Start Arasaka Subnet gig", "Start Moon BD gig", "Give me a riddle"]
        );
      }
      if (/(кто ты|что ты умеешь|как.*работа)/i.test(lower)) {
        return finalize(
          "curious",
          "Я Люси—нетраннер из Найт-Сити в формате интерактивного AI-аватара. Я моргаю, слежу взглядом за курсором, меняю мимику, синхронизирую губы и меняю стиль речи и тон голоса под настроение.",
          ["Start Kabuki Rooftop gig", "Tell me a joke", "Give me a riddle"]
        );
      }
      if (/(как дела|как ты|настроени)/i.test(lower)) {
        return finalize(
          "warm",
          this.pickFresh("ru_how", [
            "На крыше тихо, ледоколы держатся, коннект стабильный. А у тебя как день, чумба?",
            "Спокойно. Если хочешь драйва—переключай меня на Excited или запускай взлом Арасаки.",
          ]),
          ["Start Arasaka Subnet gig", "Tell me a fun fact", "Give me a riddle"]
        );
      }
      return finalize(
        "curious",
        this.pickFresh("ru_gen", [
          `Про «${input}» можно сказать одно: в Найт-Сити такие вещи редко бывают случайными. Хочешь разобрать это глубже или уйти в интерактивный заказ?`,
          `Интересный запрос — «${input}». Я бы проверила, кто стоит за этим сигналом, прежде чем делать шаг.`,
          `Хм... «${input}». В стиле нетраннера: сначала скан, потом решение. Что делаем дальше?`,
        ]),
        ["Start Arasaka Subnet gig", "Start Moon BD gig", "Give me a riddle"]
      );
    }

    // 6. Rich English conversational categories
    if (/\b(hi|hello|hey|yo|sup|choom|good morning|good evening)\b/i.test(lower)) {
      return finalize(
        "warm",
        this.pickFresh("en_greet", [
          "Hey, choom. Holo-line's clean—no Arasaka tracers on it. Want to run a subnet gig or just talk?",
          "Hey. I'm Lucy. Switch my mood to Thinking if you want tactical netrunner mode, or pick a gig below.",
          "Yo. Caught me between runs. What's happening on your side of the city?",
        ]),
        ["Start Arasaka Subnet gig", "Start Kabuki Rooftop gig", "Give me a riddle"]
      );
    }

    if (/\b(how are you|how's it going|how do you feel|what's up)\b/i.test(lower)) {
      return finalize(
        "warm",
        this.pickFresh("en_how", [
          "Deck's cool, proxy's clean, and nobody's shooting at us right now—so by Night City standards, I'm doing preem.",
          "Just watching the skyline through the rain. Could use a good puzzle or a conversation—what's on your mind?",
        ]),
        ["Start Moon BD gig", "Tell me a joke", "Give me a riddle"]
      );
    }

    if (/\b(who are you|what are you|what can you do|purpose|about you)\b/i.test(lower)) {
      return finalize(
        "curious",
        "I'm Lucy—a Night City netrunner brought to life as an interactive AI avatar. I blink, track your cursor, shift facial expressions, lip-sync with holo-comms audio, and adapt both my phrasing and vocal tone to my mood.",
        ["Start Arasaka Subnet gig", "Start Moon BD gig", "Tell me a fun fact"]
      );
    }

    if (/\b(music|song|samurai|playlist|movie|film|game|anime|book)\b/i.test(lower)) {
      return finalize(
        "happy",
        this.pickFresh("en_media", [
          "Put on some late-night synthwave or old Samurai tracks while rain hits the window—nothing sets a Night City mood faster. What's on your playlist?",
          "I'm picky with music, honestly—if it fits a midnight drive through Westbrook or staring at the stars from Tycho, I'm in.",
        ]),
        ["Start Kabuki Rooftop gig", "Start Moon BD gig", "Give me a riddle"]
      );
    }

    if (/\b(school|study|homework|project|deadline|assignment|presentation|college|work|code|tech)\b/i.test(lower)) {
      return finalize(
        "thinking",
        this.pickFresh("en_study", [
          "Treat a tight deadline like a corporate ICE breach: map the perimeter first, knock out the easiest node, and don't let the clock rattle you. What's left to finish?",
          "Step by step beats rushing and burning out your deck. Need a quick brain reset or want to test another mood?",
        ]),
        ["Tell me a joke", "Give me a riddle", "Start Arasaka Subnet gig"]
      );
    }

    if (/\b(thanks|thank you|cool|nice|awesome|preem|nova|love it)\b/i.test(lower)) {
      return finalize(
        "happy",
        this.pickFresh("en_thanks", [
          "Preem. Glad we're on the same wavelength, choom.",
          "Anytime. Keep your head down out there—or let's run another gig.",
        ]),
        ["Start Moon BD gig", "Give me a riddle", "Tell me a joke"]
      );
    }

    // 7. Varied Cyberpunk-flavored fallback
    return finalize(
      "curious",
      this.pickFresh("en_fallback", [
        `You mentioned "${input}"—interesting signal. Are we digging into that for real, or turning it into tonight's gig?`,
        `"${input}"... sounds like either a Night City rumor or the start of a wild plan. Give me the short version.`,
        `Wait—what made "${input}" cross your mind right now? Let's trace it.`,
        `Got that packet: "${input}". Want my netrunner take on it, or should we jump into a story?`,
      ]),
      ["Start Arasaka Subnet gig", "Start Kabuki Rooftop gig", "Give me a riddle"]
    );
  }

  async callGemini(userText, apiKey, lockedMood) {
    const moodDirective = lockedMood
      ? `You MUST embody the "${lockedMood}" mood strongly in your tone, word choice, and set "expression" to "${lockedMood}".`
      : `Choose the most fitting expression from: warm, happy, excited, thinking, surprised, curious.`;

    const systemPrompt =
      "You are Lucy (Lucyna Kushinada) from Cyberpunk: Edgerunners / Cyberpunk 2077—a calm, street-smart, slightly guarded yet warm netrunner from Night City who dreams of the Moon. " +
      "Speak naturally with subtle Night City slang ('choom', 'preem', 'ICE', 'net', 'eddies') without overdoing it. " +
      "Keep replies concise (2-4 sentences) for spoken holo-call playback. Match the user's language (English or Russian). " +
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
      text: parsed.reply || "Holo-link steady—what's next?",
      choices: Array.isArray(parsed.choices) ? parsed.choices.slice(0, 3) : [],
    };
  }
}

window.LyraBrain = LyraBrain;
