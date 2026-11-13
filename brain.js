/**
 * LyraBrain — Dual-mode conversational & interactive storytelling engine.
 * Works 100% offline with branching stories and smart dialogue, plus optional Gemini API upgrade.
 */
class LyraBrain {
  constructor() {
    this.history = [];
    this.activeStory = null;
    this.storyStep = 0;

    this.stories = {
      observatory: {
        title: "The Clockwork Observatory",
        steps: [
          {
            expression: "curious",
            text: "A brass telescope hums at the top of the tower, aimed at a star that isn't on any map. Suddenly, a hidden drawer clicks open beside your elbow. Inside is a glowing star-key and a folded note. Which do you inspect first?",
            choices: ["Take the glowing star-key", "Read the folded note", "Look through the telescope"],
          },
          {
            expression: "surprised",
            text: "Whoa! The moment you touch it, the dome ceiling whirs and parts like a pocket watch, revealing a floating staircase of golden constellations! A tiny mechanical owl lands on the railing and tilts its head at you.",
            choices: ["Follow the owl up the stairs", "Ask the owl who built this", "Switch to another story"],
          },
          {
            expression: "excited",
            text: "You climb into the starlit gallery where forgotten stories drift like paper lanterns. The owl hoots softly and hands you the Constellation Quill—now you get to write the next star in the sky! What will you name your constellation?",
            choices: ["Name it after a brave traveler", "Start a new story", "Tell me a fun fact instead"],
          },
        ],
      },
      library: {
        title: "The Sunken Library of Aurelia",
        steps: [
          {
            expression: "warm",
            text: "We descend in a glass diving bell to a quiet underwater hall where bioluminescent jellyfish drift between marble bookshelves. An ancient waterproof tome floats toward you, glowing pale teal. Do you open it or follow the lantern fish deeper?",
            choices: ["Open the glowing tome", "Follow the lantern fish", "Tap the glass bell"],
          },
          {
            expression: "happy",
            text: "Inside the tome, the ink ripples like water and projects a hologram of an ancient sea-city! A friendly octopus librarian wearing tiny spectacles waves three tentacles in greeting.",
            choices: ["Ask the librarian for a secret", "Explore the hologram city", "Start a new story"],
          },
          {
            expression: "excited",
            text: "The librarian unlocks the Pearl Vault and gifts you a Singing Shell—whenever you whisper a wish into it, it echoes back a melody from the deep! That's a treasure few surface dwellers ever see.",
            choices: ["Start a new story", "Ask Lyra a question", "Tell me a joke"],
          },
        ],
      },
      skytram: {
        title: "Midnight at the Sky-Tram",
        steps: [
          {
            expression: "curious",
            text: "Rain taps against the brass windows of the cloud-level Sky-Tram. Across from you sits a traveler with a suitcase that occasionally purrs. As the tram approaches Cloud-Station 9, the lights flicker!",
            choices: ["Ask about the purring suitcase", "Check the conductor's cabin", "Look out into the clouds"],
          },
          {
            expression: "surprised",
            text: "The suitcase pops open and out hops a pocket-sized cloud-fox with shimmering silver fur! It sneezes a tiny spark of lightning, and the tram's lights instantly glow bright gold again.",
            choices: ["Pet the cloud-fox", "Offer it a cinnamon biscuit", "Start a new story"],
          },
          {
            expression: "happy",
            text: "The cloud-fox curls up happily on your scarf, purring like distant thunder, as the Sky-Tram glides safely into the floating harbor. What a cozy midnight voyage!",
            choices: ["Start a new story", "Invent a sci-fi story", "How do your expressions work?"],
          },
        ],
      },
    };
  }

  getWelcome() {
    return {
      expression: "warm",
      text: "Hello! I'm Lyra, your interactive AI storyteller. Pick a world to explore together, or talk to me by typing or using the microphone!",
      choices: [
        "The Clockwork Observatory",
        "The Sunken Library",
        "Midnight at the Sky-Tram",
        "Tell me a joke",
      ],
    };
  }

  async respond(userText) {
    const clean = userText.trim();
    if (!clean) return this.getWelcome();

    this.history.push({ role: "user", text: clean });

    const apiKey = localStorage.getItem("lyra_gemini_key") || "";
    if (apiKey.trim()) {
      try {
        const aiReply = await this.callGemini(clean, apiKey.trim());
        if (aiReply) {
          this.history.push({ role: "model", text: aiReply.text });
          return aiReply;
        }
      } catch (err) {
        console.warn("Gemini API fallback to built-in engine:", err);
      }
    }

    const localReply = this.localRespond(clean);
    this.history.push({ role: "model", text: localReply.text });
    return localReply;
  }

  localRespond(input) {
    const lower = input.toLowerCase();

    // Story starters
    if (lower.includes("observatory") || lower.includes("clockwork")) {
      this.activeStory = "observatory";
      this.storyStep = 0;
      return this.stories.observatory.steps[0];
    }
    if (lower.includes("sunken") || lower.includes("library") || lower.includes("aurelia")) {
      this.activeStory = "library";
      this.storyStep = 0;
      return this.stories.library.steps[0];
    }
    if (lower.includes("sky-tram") || lower.includes("sky tram") || lower.includes("midnight")) {
      this.activeStory = "skytram";
      this.storyStep = 0;
      return this.stories.skytram.steps[0];
    }
    if (lower.includes("new story") || lower.includes("another story") || lower.includes("reset")) {
      this.activeStory = null;
      this.storyStep = 0;
      return {
        expression: "happy",
        text: "Ooh, a fresh page! Which adventure should we open next, or would you like to invent your own theme?",
        choices: ["The Clockwork Observatory", "The Sunken Library", "Midnight at the Sky-Tram"],
      };
    }

    const hasExplicitIntent =
      /\b(joke|fact|who are you|what can you do|purpose|expression|blink|mouth|surprised|thinking)\b/.test(lower);

    // Advance active story if user clicked a choice or responded in-story without switching topic
    if (this.activeStory && this.stories[this.activeStory] && !hasExplicitIntent) {
      const story = this.stories[this.activeStory];
      const current = story.steps[this.storyStep];
      const matchedChoice =
        current &&
        current.choices.some((c) => lower.includes(c.toLowerCase().slice(0, 10)));

      if (matchedChoice || this.storyStep < story.steps.length - 1) {
        if (this.storyStep < story.steps.length - 1) {
          this.storyStep += 1;
          return story.steps[this.storyStep];
        }
      }
    }

    // Conversational intents
    if (/\b(hi|hello|hey|greetings|good morning|good afternoon)\b/.test(lower)) {
      return {
        expression: "happy",
        text: "Hey there! It's wonderful to see you. Ready to dive into an interactive story, or do you just want to chat?",
        choices: ["The Clockwork Observatory", "The Sunken Library", "What can you do?"],
      };
    }

    if (lower.includes("who are you") || lower.includes("what can you do") || lower.includes("purpose")) {
      return {
        expression: "warm",
        text: "I'm Lyra, an animated virtual storyteller! I blink, track your cursor with my eyes, change facial expressions, and move my mouth in sync with my voice while we co-create stories together.",
        choices: ["How do your expressions work?", "Midnight at the Sky-Tram", "Tell me a joke"],
      };
    }

    if (lower.includes("expression") || lower.includes("blink") || lower.includes("mouth")) {
      return {
        expression: "excited",
        text: "Watch closely! My eyebrows, eyes, blush, and lips morph smoothly between warm, happy, excited, thinking, surprised, and curious—and my mouth animates syllable by syllable as I speak!",
        choices: ["Show me surprised!", "The Clockwork Observatory", "Tell me a fun fact"],
      };
    }

    if (lower.includes("surprised")) {
      return {
        expression: "surprised",
        text: "Whoa—did you see that?! My eyebrows shot right up! Pretty expressive for an observatory keeper, right?",
        choices: ["Now look thinking", "The Sunken Library", "Tell me a joke"],
      };
    }

    if (lower.includes("thinking")) {
      return {
        expression: "thinking",
        text: "Hmm... let me ponder the mysteries of the cosmos for a moment. Every good story starts with a curious question!",
        choices: ["Invent a sci-fi story", "The Clockwork Observatory"],
      };
    }

    if (lower.includes("joke")) {
      const jokes = [
        "Why did the star go to school? Because it wanted to be a little brighter!",
        "What do you call a sleeping dinosaur in a library? A dino-snore!",
        "Why don't astronomers ever get lonely? Because they always have plenty of space!",
      ];
      return {
        expression: "happy",
        text: jokes[Math.floor(Math.random() * jokes.length)],
        choices: ["Tell me another joke", "The Clockwork Observatory", "Midnight at the Sky-Tram"],
      };
    }

    if (lower.includes("fun fact") || lower.includes("fact")) {
      return {
        expression: "curious",
        text: "Here's a cosmic fact: a single day on Venus is actually longer than a whole year on Venus, because it spins extraordinarily slowly! Doesn't that sound like a setting for a fantasy novel?",
        choices: ["Midnight at the Sky-Tram", "The Sunken Library", "Tell me a joke"],
      };
    }

    if (lower.includes("sci-fi") || lower.includes("space") || lower.includes("dragon") || lower.includes("story")) {
      return {
        expression: "excited",
        text: `Ooh, a custom tale about "${input}"! Picture this: as twilight settles over the silver spires, a lone traveler spots a shimmering signal pulsing from beyond the horizon. Do we investigate the signal or decode its message first?`,
        choices: ["Investigate the signal", "Decode the message", "Start a new story"],
      };
    }

    if (lower.includes("investigate") || lower.includes("decode") || lower.includes("brave")) {
      return {
        expression: "happy",
        text: "Bold choice! Inside the glowing beacon, you discover a star-map leading to three uncharted worlds—and your name is already written on the compass. What a brilliant beginning!",
        choices: ["The Clockwork Observatory", "The Sunken Library", "Tell me a fun fact"],
      };
    }

    // Thoughtful general fallback
    return {
      expression: "curious",
      text: `You mentioned "${input}"—I love that spark of imagination! Would you like me to weave that into an adventure, or explore one of my observatory worlds?`,
      choices: ["The Clockwork Observatory", "The Sunken Library", "Midnight at the Sky-Tram"],
    };
  }

  async callGemini(userText, apiKey) {
    const systemPrompt =
      "You are Lyra, an expressive, warm, imaginative AI Storyteller avatar. " +
      "Keep replies concise (2-4 sentences) so they are fun to listen to aloud. " +
      'Respond strictly in JSON with keys: "expression" (one of: warm, happy, excited, thinking, surprised, curious), ' +
      '"reply" (your spoken text), and "choices" (array of 2-3 short follow-up choice strings).';

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
          temperature: 0.8,
        },
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return {
      expression: parsed.expression || "warm",
      text: parsed.reply || "Let's continue our story!",
      choices: Array.isArray(parsed.choices) ? parsed.choices.slice(0, 3) : [],
    };
  }
}

window.LyraBrain = LyraBrain;
