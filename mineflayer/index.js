const mineflayer = require("mineflayer");

const bot = mineflayer.createBot({
  host: "localhost", // Minecraft server IP
  port: 62610, // Minecraft server port
  username: "Penis_Jelq", // A more neutral and descriptive name
  // password: "your-password" // uncomment and set if you are connecting to an online-mode server
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function giveAndEquip(itemName, destination) {
  try {
    bot.chat(`/give ${bot.username} ${itemName} 1`);
    console.log(`Gave the bot: ${itemName}`);
    await sleep(500); // Wait for the server to process the command and update inventory

    const item = bot.inventory.findInventoryItem(itemName);
    if (item) {
      await bot.equip(item, destination);
      console.log(`Bot equipped ${itemName}`);
    } else {
      console.log(
        `Error: Could not find ${itemName} in inventory after giving it.`
      );
    }
  } catch (err) {
    console.log(
      `An error occurred while trying to give or equip ${itemName}: ${err.message}`
    );
  }
}

const followAndAttackPlayer = () => {
  const playerEntity = bot.nearestEntity((entity) => entity.type === "player");

  if (!playerEntity) {
    bot.clearControlStates();
    return;
  }

  // Look at the player's head
  const pos = playerEntity.position.offset(0, playerEntity.height, 0);
  bot.lookAt(pos);

  bot.p;
  // Simple pathfinding and movement
  bot.setControlState("forward", true);
  bot.setControlState("sprint", true);
  bot.setControlState("jump", true);

  // Attack if close enough
  if (bot.entity.position.distanceTo(playerEntity.position) < 3) {
    bot.attack(playerEntity);
  }
};

const equipFullGear = async () => {
  bot.chat("/gamemode survival");

  console.log("Equipping gear...");
  await giveAndEquip("diamond_helmet", "head");
  await giveAndEquip("diamond_chestplate", "torso");
  await giveAndEquip("diamond_leggings", "legs");
  await giveAndEquip("diamond_boots", "feet");
  await giveAndEquip("diamond_sword", "hand");
  console.log("Gear equipped.");
};

bot.once("spawn", async () => {
  console.log("Bot has spawned for the first time.");
  // Wait for the world to load and for the bot to be ready

  await bot.waitForChunksToLoad();
  await sleep(1000);
  await equipFullGear();
  // Start the main loop
  bot.on("physicsTick", followAndAttackPlayer);
});

bot.on("death", () => {
  console.log("Bot has died.");
  // The 'respawn' event will be automatically handled.
});

bot.on("respawn", async () => {
  console.log("Bot has respawned.");
  bot.clearControlStates();
  await sleep(500);
  await equipFullGear();
});

bot.on("error", console.error);
