import { createBotForge, BotForge } from "../DSL/src/botforge.js"; // Adjusted import path

const bot: BotForge = createBotForge({
  host: "localhost",
  port: 3000,
  username: "AdminBot",
  version: "1.18.2",
  sensory: {
    fovDegrees: 180,
    viewDistance: 128,
  },
  sound: {
    maxSoundAge: 5000,
    fuzzyAngle: 10,
  },
});
