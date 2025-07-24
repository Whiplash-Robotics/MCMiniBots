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

bot.once("spawn", () => {
  let lastProcessedSoundTimestamp = 0;
  console.log("BotForge has spawned with sensory capabilities.");

  // The main logic loop that runs on every physics tick.
  bot.on("physicsTick", () => {
    const allRecentSounds = bot.getRecentSounds();

    // Filter out sounds that have already been processed.
    const newSounds = allRecentSounds.filter(
      (sound) => sound.timestamp > lastProcessedSoundTimestamp
    );

    // If there are new sounds, only process the single most recent one
    // to avoid sending too many commands at once (chat spam).
    if (newSounds.length > 0) {
      // Get the last sound in the array, which is the most recent one.
      const mostRecentSound = newSounds[newSounds.length - 1];

      console.log(
        `Heard new sound: ${
          mostRecentSound.soundName
        } from near ${mostRecentSound.position.toString()}`
      );

      // Construct and execute the /particle command for only the most recent sound.
      const { x, y, z } = mostRecentSound.position;
      const particleCommand = `/summon minecraft:marker ${x} ${y} ${z} {Tags:["noise"]}`;
      bot.chat(particleCommand);

      // Update the timestamp to the sound we just processed.
      // This ensures we don't re-process any sounds from this tick.
      lastProcessedSoundTimestamp = mostRecentSound.timestamp;
    }
  });
});

bot.on("kicked", (reason, loggedIn) => {
  console.error("The bot was kicked from the server.");
  try {
    const reasonJson = JSON.parse(reason);
    console.error("Reason:", JSON.stringify(reasonJson, null, 2));
  } catch (e) {
    console.error("Reason:", reason);
  }
  console.error(`Was the bot logged in? ${loggedIn}`);
});
