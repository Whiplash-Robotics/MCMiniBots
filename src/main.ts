import mineflayer from "mineflayer";
import { SensoryModule } from "../DSL/src/opponent.js";
const bot = mineflayer.createBot({
  host: "localhost",
  port: 58368,
  username: "PvPBot",
});

bot.once("spawn", () => {
  console.log("Bot has spawned. Initializing SensoryModule.");
  const sensoryModule = new SensoryModule(bot, { fovDegrees: 180 });

  bot.on("physicTick", () => {
    const nearestEnemy = sensoryModule.findNearestEnemy();

    if (nearestEnemy) {
      if (nearestEnemy.isInLineOfSight) {
        console.log(
          `I see ${nearestEnemy.username}! ` +
            `Is Crouching: ${nearestEnemy.isCrouching}. ` +
            `health: ${nearestEnemy.healthStatus}. ` +
            `They are holding: ${nearestEnemy.heldItem?.displayName}.`
        );
      } else {
        console.log(
          `I've lost sight of ${nearestEnemy.username}. Last seen at ${nearestEnemy.position}`
        );
      }
    } else {
      console.log("Searching for targets...");
    }
  });
});
