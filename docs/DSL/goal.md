# Overview

To construct a fair and engaging Player-versus-Player (PvP) bot competition, it is important to conduct a run down of the tools available to competitors. The most well built minecraft bot builder is the Mineflayer library. This libray gives bots advantages that do not merely make them "good" at the game. It allows allow them to operate on a completely different physical and informational level than a human player, fundamentally breaking the competitive integrity of skill-based combat. Although this is something that we would like to embrace because it is the point of building bots after all, we do have to nerf them in some way. This analysis will deconstruct the sources of overpowered-ness to justify the architectural decisions for a restrictive Domain-Specific Language (DSL).

# Which parts are OP/Unfun

## Entity Knowledge and Tracking

A bot has instantaneous access to a complete list of all loaded entities, including their precise position, velocity, health, and equipment. A human player must rely on visual and auditory cues, making inferences about an opponent's status. A Mineflayer bot simply queries a data structure.

## Block Knowledge

The bot can query the world around it with near-zero latency, finding any block type in milliseconds. This allows for perfect environmental awareness without the need for exploration or visual scanning.

## Deterministic Outcomes

If a bot beats another bot, then it will likely win every single time they fight because of how deterministic bots can be. This makes fights uninteresting, especially ones with longer multi-round fights.

# Goal

Our goal is to keep the inhuman aspects of building a bot interesting, while keeping strategy and higher level function the key focus. For example, having omniscent entity knowledge and tracking makes strategies like feints or ambushes pointless. Having perfect bot shots makes meele combat pointless, and being able to throw splash potions from anywhere in your inventory instantly makes having potions pointless. Some things we may want to keep would be near perfect execution of movement, instant reaction time, near infinite memory/thinking speed.

# Plans to nerf

## 1. Entity Knowledge and Tracking

- Never show 'secret' information about enemy (stuff like health, inventory status, position behind a wall)
  - but you can show stuff thats available through vision (position if in FOV, status effect, currently held weapon, etc..)
- Crouching & Behind wall: No position info, behind wall
- Projectile position and velocity obfuscated with an error value (uncertain projectile trajectory)

## 2. Block Knowledge

- Only able to know about the blocks in FOV

## 3. Deteministic Outcomes

- Add tiny amounts of error or delay to everything (bow shots, inventory management, etc..)

### Audio Queues

- Should provide description about what happend (opponent ate, placed blocks, shot an arrow)
- but it should have a large error value because its not realistic to pinpoint an action based on audio alone
