import { createBotForge, BotForge } from "../DSL/src/botforge.js"; // Adjusted import path

const bot: BotForge = createBotForge({
  host: "localhost",
  port: 3000,
  username: "PvPBot",
  sensory: {
    fovDegrees: 180,
    viewDistance: 128,
  },
});

bot.once("spawn", () => {
  console.log("BotForge has spawned with sensory capabilities.");
  bot.on("physicTick", () => {
    const nearestEnemy = bot.findNearestEnemy();
    if (nearestEnemy) {
      if (nearestEnemy.isInLineOfSight) {
        console.log(
          `I see ${nearestEnemy.username}! ` +
            `Is Crouching: ${nearestEnemy.isCrouching}. ` +
            `Health: ${nearestEnemy.healthStatus}. ` +
            `Holding: ${nearestEnemy.heldItem?.displayName}. ` +
            `Position: ${nearestEnemy.position}`
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
