import { createBotForge, BotForge } from "../../DSL/src/botforge.js"; // Adjusted import path
import mineflayer from "mineflayer";
const uniqueId = Math.random().toString(36).slice(2);
const cheater = mineflayer.createBot({
  host: "localhost",
  port: 3000,
  username: "CheaterBot" + uniqueId,
  version: "1.18.2",
});
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

// bot.on("spawn", () => {
//   bot.on("physicsTick", () => {
//     const target = bot.findNearestEnemy();
//     if (target) {
//       bot.attack(target.uuid);
//     }
//   });
// });
bot.on("spawn", () => {
  bot.chat("/gamemode survival");
  bot.chat("/tp 0 ~ 0");
  bot.chat("/clear");
  bot.chat("/give @s minecraft:diamond_sword 1");
  bot.chat("/give @s minecraft:diamond_axe 1");
  bot.setQuickBarSlot(0);
  bot.on("physicsTick", () => {
    if (bot.strongAttackCharged) {
      bot.setControlState("jump", true);
    } else {
      bot.setControlState("jump", false);
    }
    if (bot.inCritWindow) {
      const target = bot.findNearestEnemy();
      if (target) {
        bot.attack(target.uuid);
      }
    }
  });
});
