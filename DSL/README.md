# BotForge Developer Documentation

Welcome to the BotForge project\! The goal of this system is to create advanced Minecraft bots by building layers of perception and action on top of the standard Mineflayer API. This document explains the architecture of `BotForge` and provides a guide for extending it with new capabilities.

---

## Core Architecture: The Sandboxed Bot 🛡️

The most important concept in BotForge is that you are not interacting with a normal Mineflayer bot. You are interacting with a **sandboxed version** of it, controlled by a JavaScript **Proxy**.

Think of it like this:

- The **real Mineflayer bot** is like a celebrity—powerful and with access to everything.
- Our **Proxy** is like the celebrity's personal assistant or security guard.

You, the developer, can only speak to the assistant (the Proxy). When you ask the assistant to do something (like `bot.chat('hello')`), the assistant checks its list of allowed actions.

1.  **If the action is on the list**, the assistant passes the request to the celebrity (the real bot), who then performs the action.
2.  **If the action is NOT on the list** (like trying to access `bot.entities` to see every entity on the server), the assistant stops the request right there and tells you it's not allowed.

This prevents the AI from "cheating" by using overpowered functions. It must rely on the limited, custom-built tools we give it, like `findNearestEnemy()`.

### How the Proxy Works Internally

The Proxy object wraps the real bot and uses a special `handler` object to intercept two fundamental operations:

#### 1\. The `get` Trap

This trap fires _every time_ your code tries to access a property (e.g., `bot.username` or `bot.on`).

- It checks the name of the property against an `allowedProperties` list.
- If the property is on the list, the trap fetches the real property from the original bot.
- Crucially, if the property is a **function** (like `chat` or `on`), the trap returns it **bound** to the original bot. This ensures the function works correctly internally without having its own operations blocked by the proxy.
- If the property is not on the list, the trap returns `undefined` and logs an error, effectively hiding it.

#### 2\. The `set` Trap

This trap fires _every time_ your code tries to change a property (e.g., `bot.username = 'new_name'`). Our current `set` trap is very simple: it just forwards the request to the real bot object. The primary security comes from the `get` trap; if an AI can't _get_ a dangerous property, it can't use it to _set_ anything.

## Core Architecture: The Factory Pattern

Instead of creating a complex class that `extends` the base Mineflayer `Bot`, we use a **factory pattern**. This is a common and robust approach when working with complex libraries.

Here's the workflow:

1.  Our `createBotForge()` function is the **single entry point** for creating a bot.
2.  Inside, it first creates a standard `mineflayer.createBot()` instance. This gives us a normal, fully-functional bot.
3.  It then instantiates one or more internal "manager" classes (like `SensoryManager`) that contain our custom logic. These managers are given a reference to the bot so they can listen to its events and access its data.
4.  Finally, it **augments** the original bot object by attaching the public methods from our managers directly onto it (e.g., `bot.findNearestEnemy = ...`).
5.  The function returns this "upgraded" bot, which we type as `BotForge` to give us TypeScript autocompletion for our new methods.

**Why this way?**

- **Non-Invasive:** We don't have to replicate Mineflayer's complex bot setup process or worry about breaking its internal state.
- **Modular:** It's incredibly easy to add new functionality. Want to add a "hearing" module? Just create a `HearingManager`, instantiate it in the factory, and attach its methods to the bot.
- **Clean API:** The end-user gets a single `bot` object with all the features built-in. They don't need to juggle multiple class instances.

---

## Component Breakdown

This section details every piece of the `BotForge.ts` file.

### Interfaces and Enums

These define the "shape" of our data. They are crucial for ensuring type safety and providing clear, predictable data structures for the bot's AI to use.

#### `PlayerHealthStatus` (enum)

A simple abstraction for a player's health. We use an enum instead of raw numbers (`0-20`) to force the AI to reason about states (`Healthy`, `Injured`) rather than just crunching numbers.

#### `TrackedPlayer` (interface)

This is the core data model for our perception system. It represents everything our bot "knows" about another player. Crucially, it enforces a "fog of war"—if a player isn't in line of sight, most of its properties become `null` or `Unknown`.

#### `BotForgeOptions` (interface)

This extends Mineflayer's standard `BotOptions` to allow us to pass in our own custom settings when creating the bot, like `sensory: { fovDegrees: 120 }`.

#### `BotForge` (interface)

This is the type definition for our final, "upgraded" bot. It tells TypeScript, "This object is a standard Mineflayer `Bot`, but it _also_ has these new methods."

```typescript
export interface BotForge extends Bot {
  getTrackedPlayers(): TrackedPlayer[];
  findNearestEnemy(): TrackedPlayer | null;
}
```

### `SensoryManager` (Internal Class)

This class contains all the logic for visual perception. It is **not exported** and should be considered an internal, private part of the module.

- `constructor(bot, options)`: When created, it stores a reference to the main `bot` instance and sets up its configuration (view distance, FOV). Most importantly, it subscribes its `updateTrackedPlayers` method to the bot's `'physicsTick'` event. This makes it the "heartbeat" of our sensory system.
- `private updateTrackedPlayers()`: This is the core loop. On every tick, it iterates through all players the bot knows about, determines if they are visible using `isPlayerVisible()`, and updates the `trackedPlayers` map with either fresh, real-time data or stale, limited data.
- `private isPlayerVisible(playerEntity)`: A helper function that performs two checks:
  1.  **Angle Check:** Is the player within the bot's field-of-view cone?
  2.  **Raycast Check:** Is the line of sight between the bot's "eyes" and the player's torso blocked by any terrain?
- `public getTrackedPlayers()`: A simple public getter that returns all currently tracked players.
- `public findNearestEnemy()`: A utility method that filters and sorts the tracked players to find the closest one.

### `createBotForge()` (Factory Function)

This is the **only function you should import** into your main application file (`main.ts`).

```typescript
export function createBotForge(options: BotForgeOptions): BotForge;
```

It orchestrates the entire setup process as described in the architecture section. It takes all the standard bot options plus our custom ones, creates the bot, initializes the `SensoryManager`, hooks everything together, and returns the final, powerful `BotForge` object.

---

## How to Extend BotForge 🧠

Let's add a new capability: **detecting sounds**, like footsteps or breaking blocks.

### Step 1: Define Your Data Structure

First, decide what data your new module will provide. We'll create an interface for a "sound event."

```typescript
// In BotForge.ts, add a new interface
export interface SoundEvent {
  readonly type: "footstep" | "block_break" | "player_hurt";
  readonly position: Vec3;
  readonly sourceUsername?: string; // Who made the sound?
  readonly timestamp: number;
}
```

### Step 2: Create a New Manager Class

Create a new internal manager class, similar to `SensoryManager`, to handle the logic.

```typescript
// In BotForge.ts, add a new internal class
class HearingManager {
  private readonly bot: Bot;
  private recentSounds: SoundEvent[] = [];
  private readonly maxSoundAge = 5000; // Sounds expire after 5 seconds

  constructor(bot: Bot) {
    this.bot = bot;

    // Hook into a relevant Mineflayer event.
    // 'entityEffect' could work for hurt sounds, others might need packets.
    // For this example, let's pretend there's an event for footsteps.
    this.bot.on("playerStep", (player) => {
      // NOTE: 'playerStep' is a hypothetical event for this example.
      // You might need to listen to raw packets for real implementation.
      const newSound: SoundEvent = {
        type: "footstep",
        position: player.position.clone(),
        sourceUsername: player.username,
        timestamp: Date.now(),
      };
      this.addSound(newSound);
    });
  }

  private addSound(sound: SoundEvent) {
    this.recentSounds.push(sound);
    // Prune old sounds to keep the list from growing forever
    const now = Date.now();
    this.recentSounds = this.recentSounds.filter(
      (s) => now - s.timestamp < this.maxSoundAge
    );
  }

  // Define the public method that the end-user will call
  public getRecentSounds = (): SoundEvent[] => {
    return this.recentSounds;
  };
}
```

### Step 3: Integrate into the Factory

Now, update `createBotForge` to use your new `HearingManager`.

1.  **Update the `BotForge` interface** to include your new method.
    ```typescript
    export interface BotForge extends Bot {
      getTrackedPlayers(): TrackedPlayer[];
      findNearestEnemy(): TrackedPlayer | null;
      getRecentSounds(): SoundEvent[]; // <-- Add this line
    }
    ```
2.  **Instantiate and attach** it inside the `createBotForge` function.

    ```typescript
    export function createBotForge(options: BotForgeOptions): BotForge {
      const { sensory, ...botOptions } = options;
      const bot = mineflayer.createBot(botOptions);

      // Existing sensory manager
      const sensoryManager = new SensoryManager(bot, sensory);

      // --- NEW ---
      // 1. Initialize the new manager
      const hearingManager = new HearingManager(bot);
      // --- END NEW ---

      const botForge = bot as BotForge;
      botForge.getTrackedPlayers = sensoryManager.getTrackedPlayers;
      botForge.findNearestEnemy = sensoryManager.findNearestEnemy;

      // --- NEW ---
      // 2. Attach the new public method
      botForge.getRecentSounds = hearingManager.getRecentSounds;
      // --- END NEW ---

      return botForge;
    }
    ```

That's it\! Now in `main.ts`, you can call `bot.getRecentSounds()` and the bot will have a whole new sense to reason with. This modular pattern makes it easy to keep adding more complex behaviors without making the codebase messy.
