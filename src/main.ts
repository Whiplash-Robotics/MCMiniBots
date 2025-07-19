import { createBotForge, BotForge } from "../DSL/src/botforge.js"; // Adjusted import path

const bot: BotForge = createBotForge({
  host: "localhost",
  port: 51358,
  username: "PvPBot1",
  version: "1.17.1",
  sensory: {
    fovDegrees: 180,
    viewDistance: 128,
  },
  sound: {
    maxSoundAge: 5000,
    fuzzyAngle: 10,
  },
});

bot.once("spawn", () => {
  let lastProcessedSoundTimestamp = 0;
  console.log("BotForge has spawned with sensory capabilities.");
  bot.on("physicTick", () => {
    const nearestEnemy = bot.findNearestEnemy();
    if (nearestEnemy) {
      if (nearestEnemy.isInLineOfSight) {
        // console.log(
        //   `I see ${nearestEnemy.username}! ` +
        //     `Is Crouching: ${nearestEnemy.isCrouching}. ` +
        //     `Health: ${nearestEnemy.healthStatus}. ` +
        //     `Holding: ${nearestEnemy.heldItem?.displayName}. ` +
        //     `Position: ${nearestEnemy.position}`
        // );
      } else {
        // console.log(
        //   `I've lost sight of ${nearestEnemy.username}. Last seen at ${nearestEnemy.position}`
        // );
      }
    } else {
      // console.log("Searching for targets...");
    }
  });
  bot.on("physicsTick", () => {
    const allRecentSounds = bot.getRecentSounds();

    const newSounds = allRecentSounds.filter(
      (sound) => sound.timestamp > lastProcessedSoundTimestamp
    );

    if (newSounds.length > 0) {
      for (const sound of newSounds) {
        console.log(
          `Heard new sound: ${
            sound.soundName
          } from near ${sound.position.toString()}`
        );
      }
      lastProcessedSoundTimestamp = newSounds[newSounds.length - 1].timestamp;
    }
  });
});
