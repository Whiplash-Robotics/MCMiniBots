import { createBotForge, BotForge } from "../DSL/src/botforge.js"; // Adjusted import path
import { TrackedPlayer } from "../DSL/src/types.js";

const bot: BotForge = createBotForge({
  host: "localhost",
  port: 3000,
  username: "AdminBot",
  version: "1.21.4",
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
  bot.chat("/gamemode survival");
  bot.chat("/tp @s 0 56 0"); // Use @s for self
  bot.chat("/clear @s");
  bot.chat("/give @s minecraft:bow{Unbreakable:1} 1"); // Give an unbreakable bow
  bot.chat("/give @s minecraft:crossbow{Unbreakable:1} 1"); // Give an unbreakable bow
  bot.chat("/give @s minecraft:arrow 64");

  bot.setQuickBarSlot(0);

  // bot.setControlState("forward", true);
  bot.setControlState("sprint", true);
});

// Listen for chat messages to trigger the shot
bot.on("chat", async (username, message) => {
  // Ignore messages from the bot itself
  if (username === bot.username) return;

  if (message === "shoot") {
    // Find the nearest player to shoot at
    const target = bot.findNearestEnemy();

    if (!target) {
      bot.chat("I don't see anyone to shoot.");
      return;
    }

    await shootAtTarget(target);
  }
});

async function shootAtTarget(target: TrackedPlayer) {
  // 1. Look at the target
  // We aim at their head by adding their height to the position.
  await bot.lookAt(target.position!.offset(0, 2, 0));
  bot.chat(`Aiming at ${target.username}...`);

  // 2. Charge the bow (hold right-click)
  bot.activateItem();

  // 3. Wait for the bow to charge (1.2 seconds is a good full charge)
  setTimeout(() => {
    // 4. Release the bow (release right-click)
    bot.deactivateItem();
    bot.chat("Fired! 🏹");
    bot.setQuickBarSlot(bot.quickBarSlot === 0 ? 1 : 0);
  }, 1200);
}

bot.on("kicked", (reason) => {
  console.log(reason);
});

bot.on("error", (err) => console.log(err));
