import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  EmbedBuilder,
  ChatInputCommandInteraction,
  Interaction,
  User,
} from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

// ─── Environment ─────────────────────────────────────────────────────────────

const TOKEN: string = process.env.DISCORD_TOKEN ?? "";
const CLIENT_ID: string = process.env.CLIENT_ID ?? "";

if (!TOKEN || !CLIENT_ID) {
  console.error("❌  DISCORD_TOKEN or CLIENT_ID is missing in .env");
  process.exit(1);
}

// ─── In-memory stat maps ──────────────────────────────────────────────────────

/** Couple crack count — key = sorted pair "id1-id2" */
const coupleMap = new Map<string, number>();

/** Global target crack count — key = target user ID */
const targetMap = new Map<string, number>();

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function times(n: number): string {
  return n === 1 ? "1 time" : `${n} times`;
}

// ─── Anime couple GIF pool ───────────────────────────────────────────────────

const GIFS: string[] = [
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExOTBmM2d3MTJyZTFtMHpubXVpYXpvdTkzb3dlZjFxYzF5MDB4ZXV5dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ciNN4YNQNncbe/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmN6dmNpZ2Juc2NvMmZ1OW4zNDJhaDJtd2Zzdmx3a2pmNXJhYmM3aSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Mo122cd9G2xmKymanO/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmN6dmNpZ2Juc2NvMmZ1OW4zNDJhaDJtd2Zzdmx3a2pmNXJhYmM3aSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/LDFtlGes4w0b5n815P/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmN6dmNpZ2Juc2NvMmZ1OW4zNDJhaDJtd2Zzdmx3a2pmNXJhYmM3aSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/hdLU6GBi9DZKdzZlgn/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2twYXVkczJ5dHF1NHhvZWI4aTB5ZXhqejg3YXZibTNnZ3o2ZTBpZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/pnJz2YUmt4kZkW0wxu/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGVpdTh2M3ZpMW9rZndpdjU1bTF4b2p1aHExaWhvbWc1b3JmbjRvOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/7z5ICi5kf3RXctLKwL/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGVpdTh2M3ZpMW9rZndpdjU1bTF4b2p1aHExaWhvbWc1b3JmbjRvOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/4dXreCHrMRLk2wN7YH/giphy.gif",
];

function randomGif(): string {
  return GIFS[Math.floor(Math.random() * GIFS.length)];
}

// ─── Command payload ─────────────────────────────────────────────────────────
// Using a raw object so we can include integration_types and contexts,
// which are not yet exposed on SlashCommandBuilder in all v14 patch versions.

const COMMAND = {
  name: "crack",
  description: "Crack on another user!",
  integration_types: [1],   // 1 = User Install (no server required)
  contexts: [0, 1, 2],      // 0 = Guild, 1 = Bot DM, 2 = Private/Group DM
  options: [
    {
      name: "user",
      description: "The user you want to crack on",
      type: 6,              // ApplicationCommandOptionType.User
      required: true,
    },
  ],
};

// ─── Register commands ────────────────────────────────────────────────────────

async function registerCommands(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    console.log("📡  Registering /crack command globally…");
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: [COMMAND],
    });
    console.log("✅  Command registered.");
  } catch (err) {
    console.error("❌  Failed to register command:", err);
  }
}

// ─── Client ───────────────────────────────────────────────────────────────────

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async (c) => {
  console.log(`🤖  Logged in as ${c.user.tag}`);
  await registerCommands();
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "crack") return;
  await handleCrack(interaction);
});

// ─── /crack handler ───────────────────────────────────────────────────────────

async function handleCrack(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const caller: User = interaction.user;
  const target: User = interaction.options.getUser("user", true);

  if (target.id === caller.id) {
    await interaction.reply({
      content: "❌  You can't crack on yourself!",
      ephemeral: true,
    });
    return;
  }

  if (target.bot) {
    await interaction.reply({
      content: "❌  You can't crack on a bot!",
      ephemeral: true,
    });
    return;
  }

  // Update stats
  const ck = pairKey(caller.id, target.id);
  const coupleCount = (coupleMap.get(ck) ?? 0) + 1;
  coupleMap.set(ck, coupleCount);

  const globalCount = (targetMap.get(target.id) ?? 0) + 1;
  targetMap.set(target.id, globalCount);

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setDescription(
      `**<@${target.id}>, <@${caller.id}> is cracking on you!**\n\n` +
      `**${caller.username}** and **${target.username}** have cracked **${times(coupleCount)}**.`
    )
    .setImage(randomGif())
    .setFooter({
      text: `${target.username} has been cracked ${times(globalCount)}.`,
    });

  await interaction.reply({ embeds: [embed] });
}

// ─── Start ────────────────────────────────────────────────────────────────────

client.login(TOKEN);
