import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  EmbedBuilder, 
  ChatInputCommandInteraction, 
  Interaction, 
  User 
} from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

const TOKEN: string = process.env.DISCORD_TOKEN ?? "";
const CLIENT_ID: string = process.env.CLIENT_ID ?? "";

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ DISCORD_TOKEN or CLIENT_ID is missing in environment variables.");
  process.exit(1);
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function times(n: number): string {
  return n === 1 ? "1 time" : `${n} times`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const crackPairMap = new Map<string, number>();
const crackHitMap = new Map<string, number>();
const duelPairMap = new Map<string, number>();
const duelHitMap = new Map<string, number>();
const meowMap = new Map<string, number>();

// Clean anime romance and cuddle animations requested in chat history
const CRACK_GIFS: string[] = [
  "https://giphy.com",
  "https://giphy.com",
  "https://giphy.com",
  "https://giphy.com",
  "https://giphy.com",
  "https://giphy.com",
  "https://giphy.com"
];

const DUEL_GIFS: string[] = [
  "https://giphy.com",
  "https://giphy.com",
  "https://giphy.com"
];

const MEOW_GIFS: string[] = [
  "https://giphy.com",
  "https://giphy.com",
  "https://giphy.com",
  "https://giphy.com",
  "https://giphy.com"
];

const DUEL_LINES = [
  (a: string, b: string) => `**🤺 ${a} has challenged ${b} to a friendly duel!**`,
  (a: string, b: string) => `**🏆 ${a} outmaneuvered ${b} in a strategic match!**`,
  (a: string, b: string) => `**✨ ${a} showed ${b} some impressive competitive skills!**`,
  (a: string, b: string) => `**⭐ ${a} won the round against ${b}!**`,
  (a: string, b: string) => `**🏅 ${a} and ${b} had an epic showdown!**`,
];

const MEOW_LINES_TARGET = [
  (a: string, b: string) => `**🐱 ${a} meows at ${b}!**`,
  (a: string, b: string) => `**🐾 ${a} jumps around ${b} like a playful kitten!**`,
  (a: string, b: string) => `**😸 ${a} nuzzles ${b} and goes meow~**`,
  (a: string, b: string) => `**🐱 ${a} looks for attention from ${b}!**`,
  (a: string, b: string) => `**🌸 ${a} sits near ${b} and meows softly!**`,
];

const MEOW_LINES_SOLO = [
  (a: string) => `**🐱 ${a} goes: meow~**`,
  (a: string) => `**😺 ${a} is feeling very catlike right now.**`,
  (a: string) => `**🐾 ${a} just unleashed a mighty meow into the void.**`,
  (a: string) => `**🌙 ${a} meows at the moon.**`,
];

const COMMANDS = [
  {
    name: "crack",
    description: "Crack on another user!",
    integration_types:, // User Install (DMs/GCs)
    contexts:,     // Guild, DM, Group DM
    options: [{ name: "user", description: "The user you want to crack on", type: 6, required: true }],
  },
  {
    name: "duel",
    description: "Challenge another user to a friendly duel!",
    integration_types:,
    contexts:,
    options: [{ name: "user", description: "The user you want to duel", type: 6, required: true }],
  },
  {
    name: "meow",
    description: "Meow! At someone or just into the void.",
    integration_types:,
    contexts:,
    options: [{ name: "user", description: "Who to meow at (optional)", type: 6, required: false }],
  },
];

async function registerCommands(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    console.log("📡 Registering commands globally across user contexts…");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: COMMANDS });
    console.log("✅ All context commands registered completely.");
  } catch (err) {
    console.error("❌ Failed to register commands: ", err);
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async (c) => {
  console.log(`🤖 Logged in as ${c.user.tag}`);
  await registerCommands();
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    if (interaction.commandName === "crack") await handleCrack(interaction);
    if (interaction.commandName === "duel") await handleDuel(interaction);
    if (interaction.commandName === "meow") await handleMeow(interaction);
  } catch (err) {
    console.error("❌ Execution Error:", err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "❌ An internal execution error occurred.", ephemeral: true });
    }
  }
});

async function handleCrack(interaction: ChatInputCommandInteraction): Promise<void> {
  const caller: User = interaction.user;
  const target: User = interaction.options.getUser("user", true);

  if (target.id === caller.id) {
    await interaction.reply({ content: "❌ You can't crack on yourself!", ephemeral: true });
    return;
  }
  if (target.bot) {
    await interaction.reply({ content: "❌ You can't crack on a bot!", ephemeral: true });
    return;
  }

  const ck = pairKey(caller.id, target.id);
  const pairCount = (crackPairMap.get(ck) ?? 0) + 1;
  crackPairMap.set(ck, pairCount);

  const globalCount = (crackHitMap.get(target.id) ?? 0) + 1;
  crackHitMap.set(target.id, globalCount);

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x2b2d31)
        .setDescription(`<@${target.id}>, <@${caller.id}> is cracking on you!\n\n${caller.username} and ${target.username} have cracked ${times(pairCount)}.`)
        .setImage(pick(CRACK_GIFS))
        .setFooter({ text: `${target.username} has been cracked ${times(globalCount)} total.` })
    ],
  });
}

async function handleDuel(interaction: ChatInputCommandInteraction): Promise<void> {
  const caller: User = interaction.user;
  const target: User = interaction.options.getUser("user", true);

  if (target.id === caller.id) {
    await interaction.reply({ content: "❌ You can't duel yourself!", ephemeral: true });
    return;
  }
  if (target.bot) {
    await interaction.reply({ content: "🤖 Bots don't participate in duels.", ephemeral: true });
    return;
  }

  const ck = pairKey(caller.id, target.id);
  const pairCount = (duelPairMap.get(ck) ?? 0) + 1;
  duelPairMap.set(ck, pairCount);

  const globalCount = (duelHitMap.get(target.id) ?? 0) + 1;
  duelHitMap.set(target.id, globalCount);

  const selectedDuelFn = pick(DUEL_LINES);
  const line = selectedDuelFn(`<@${caller.id}>`, `<@${target.id}>`);

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x00aaff)
        .setDescription(`${line}\n\n**${caller.username}** has challenged **${target.username}** **${times(pairCount)}**.`)
        .setImage(pick(DUEL_GIFS))
        .setFooter({ text: `${target.username} has been challenged ${times(globalCount)} in total.` })
    ],
  });
}

async function handleMeow(interaction: ChatInputCommandInteraction): Promise<void> {
  const caller: User = interaction.user;
  const target: User | null = interaction.options.getUser("user");

  const count = (meowMap.get(caller.id) ?? 0) + 1;
  meowMap.set(caller.id, count);

  let desc = "";
  if (target && target.id !== caller.id && !target.bot) {
    const selectedTargetFn = pick(MEOW_LINES_TARGET);
    desc = selectedTargetFn(`<@${caller.id}>`, `<@${target.id}>`);
  } else {
    const selectedSoloFn = pick(MEOW_LINES_SOLO);
    desc = selectedSoloFn(`<@${caller.id}>`);
  }

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xff9ecd)
        .setDescription(desc)
        .setImage(pick(MEOW_GIFS))
        .setFooter({ text: `${caller.username} has meowed ${times(count)}.` })
    ],
  });
}

client.login(TOKEN);
