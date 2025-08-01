import { createBotForge, BotForge } from "../DSL/src/botforge.js"; // Adjusted import path
import mineflayer from "mineflayer";
// const cheater = mineflayer.createBot({
//   host: "localhost",
//   port: 3000,
//   username: "CheaterBot",
//   version: "1.18.2",
// });
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

bot.on("spawn", () => {
  bot.on("physicsTick", () => {
    const target = bot.findNearestEnemy();
    if (target) {
      bot.attack(target.uuid);
    }
  });
});
