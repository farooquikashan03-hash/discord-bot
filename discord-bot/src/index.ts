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

const TOKEN: string = process.env.DISCORD_TOKEN ?? "";
const CLIENT_ID: string = process.env.CLIENT_ID ?? "";

if (!TOKEN || !CLIENT_ID) {
  console.error("❌  DISCORD_TOKEN or CLIENT_ID is missing in .env");
  process.exit(1);
}

function pairKey(a: string, b: string): string { return [a, b].sort().join("-"); }
function times(n: number): string { return n === 1 ? "1 time" : `${n} times`; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const crackPairMap = new Map<string, number>();
const crackHitMap  = new Map<string, number>();
const killPairMap  = new Map<string, number>();
const killHitMap   = new Map<string, number>();
const meowMap      = new Map<string, number>();

const CRACK_GIFS: string[] = [
  "https://media.giphy.com/media/kzvlq03sBvvI1Mlvo8/giphy.gif",
  "https://media.giphy.com/media/11cdgzuWqfckfglKvk/giphy.gif",
  "https://media.giphy.com/media/I69IQ10Vi9aAWaOkYn/giphy.gif",
  "https://media.giphy.com/media/12kfPoQHW4hGcU/giphy.gif",
  "https://media.giphy.com/media/C74mp4PIVFrzhCptRU/giphy.gif",
  "https://media.giphy.com/media/2VTTN8lnSexaZhJ150/giphy.gif",
  "https://media.giphy.com/media/wK0acYH9gXoiKInTKi/giphy.gif",
  "https://media.giphy.com/media/sCD9iKzcbuClTLd7wf/giphy.gif",
  "https://media.giphy.com/media/YP5uuhzbXfn9aJCadw/giphy.gif",
  "https://media.giphy.com/media/RmAX8NfmAlW6zW84Es/giphy.gif",
  "https://media.giphy.com/media/6gHALP81UuYmf4ZUs6/giphy.gif",
  "https://media.giphy.com/media/YqLjrgaKBrNsb80ik1/giphy.gif",
  "https://media.giphy.com/media/ciNN4YNQNncbe/giphy.gif",
  "https://media.giphy.com/media/vUrwEOLtBUnJe/giphy.gif",
  "https://media.giphy.com/media/o86KSJEPAvrzyF3HPU/giphy.gif",
  "https://media.giphy.com/media/zkppEMFvRX5FC/giphy.gif",
  "https://media.giphy.com/media/Mo122cd9G2xmKymanO/giphy.gif",
  "https://media.giphy.com/media/LDFtlGes4w0b5n815P/giphy.gif",
  "https://media.giphy.com/media/hdLU6GBi9DZKdzZlgn/giphy.gif",
  "https://media.giphy.com/media/pnJz2YUmt4kZkW0wxu/giphy.gif",
  "https://media.giphy.com/media/7z5ICi5kf3RXctLKwL/giphy.gif",
  "https://media.giphy.com/media/4dXreCHrMRLk2wN7YH/giphy.gif",
];

const KILL_GIFS: string[] = [
  "https://media.giphy.com/media/dc4UxTw2ueAbm/giphy.gif",
  "https://media.giphy.com/media/W70LEwFTHlg4ZzB7vl/giphy.gif",
  "https://media.giphy.com/media/d3Me4gCAPyZsA/giphy.gif",
  "https://media.giphy.com/media/wEeIdfjuhIfwhUq2be/giphy.gif",
  "https://media.giphy.com/media/XRr6w71DZxXig/giphy.gif",
  "https://media.giphy.com/media/19S5OnlvTz1KzQB2Jv/giphy.gif",
  "https://media.giphy.com/media/l925axfj7YFo68XH2v/giphy.gif",
  "https://media.giphy.com/media/EuYk9AYemhrDk8lh37/giphy.gif",
  "https://media.giphy.com/media/cTWuTC4HpOaPIEQXfQ/giphy.gif",
  "https://media.giphy.com/media/2oO4qbgXCG3YY/giphy.gif",
];

const MEOW_GIFS: string[] = [
  "https://media.giphy.com/media/l8vODjlQrm2YM/giphy.gif",
  "https://media.giphy.com/media/zTaWhCbgHI2kxZfgmr/giphy.gif",
  "https://media.giphy.com/media/td3fwl4I8261W/giphy.gif",
  "https://media.giphy.com/media/l3HrmFrUiYBm0qCKgd/giphy.gif",
  "https://media.giphy.com/media/FfbBHwOJwUCLGxodSA/giphy.gif",
  "https://media.giphy.com/media/5jbUB088YjtGU/giphy.gif",
  "https://media.giphy.com/media/l2QDTsTL2NhwOEAV2/giphy.gif",
  "https://media.giphy.com/media/MBUfqO9CYEtDq/giphy.gif",
  "https://media.giphy.com/media/kQxj0pd5uunST8lv32/giphy.gif",
  "https://media.giphy.com/media/ipxGb5koxBQWVAjmEF/giphy.gif",
  "https://media.giphy.com/media/sDudkzg2zMjDk7HKsB/giphy.gif",
  "https://media.giphy.com/media/BGpx4ljIl8Jiw/giphy.gif",
];

const KILL_LINES = [
  (a: string, b: string) => `**⚔️ ${a} just ended ${b}'s anime arc!**`,
  (a: string, b: string) => `**💀 ${a} deleted ${b} from existence!**`,
  (a: string, b: string) => `**🔪 ${a} sent ${b} to the shadow realm!**`,
  (a: string, b: string) => `**🩸 ${a} gave ${b} a one-way ticket to hell!**`,
  (a: string, b: string) => `**☠️ ${a} just committed a war crime against ${b}!**`,
  (a: string, b: string) => `**💥 ${a} obliterated ${b} without hesitation!**`,
  (a: string, b: string) => `**🗡️ ${a} cut ${b} down like a final boss!**`,
];

const MEOW_LINES_TARGET = [
  (a: string, b: string) => `**🐱 ${a} meows aggressively at ${b}!**`,
  (a: string, b: string) => `**🐾 ${a} pounces on ${b} like a cat!**`,
  (a: string, b: string) => `**😸 ${a} nuzzles ${b} and goes meow~**`,
  (a: string, b: string) => `**🐱 ${a} demands headpats from ${b}!**`,
  (a: string, b: string) => `**🌸 ${a} crawls into ${b}'s lap and meows!**`,
];

const MEOW_LINES_SOLO = [
  (a: string) => `**🐱 ${a} goes: meow~**`,
  (a: string) => `**😺 ${a} is feeling very catlike right now.**`,
  (a: string) => `**🐾 ${a} just unleashed a mighty meow into the void.**`,
  (a: string) => `**🌙 ${a} meows at the moon like a true neko.**`,
];

const COMMANDS = [
  {
    name: "crack",
    description: "Crack on another user!",
    integration_types: [1],
    contexts: [0, 1, 2],
    options: [{ name: "user", description: "The user you want to crack on", type: 6, required: true }],
  },
  {
    name: "kill",
    description: "Kill another user (anime style)!",
    integration_types: [1],
    contexts: [0, 1, 2],
    options: [{ name: "user", description: "The user you want to kill", type: 6, required: true }],
  },
  {
    name: "meow",
    description: "Meow! At someone or just into the void.",
    integration_types: [1],
    contexts: [0, 1, 2],
    options: [{ name: "user", description: "Who to meow at (optional)", type: 6, required: false }],
  },
];

async function registerCommands(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    console.log("📡  Registering commands globally…");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: COMMANDS });
    console.log("✅  All commands registered.");
  } catch (err) {
    console.error("❌  Failed to register commands:", err);
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async (c) => {
  console.log(`🤖  Logged in as ${c.user.tag}`);
  await registerCommands();
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    if (interaction.commandName === "crack") await handleCrack(interaction);
    if (interaction.commandName === "kill")  await handleKill(interaction);
    if (interaction.commandName === "meow")  await handleMeow(interaction);
  } catch (err) {
    console.error("Handler error:", err);
    if (!interaction.replied) {
      await interaction.reply({ content: "❌  Something went wrong.", ephemeral: true });
    }
  }
});

async function handleCrack(interaction: ChatInputCommandInteraction): Promise<void> {
  const caller: User = interaction.user;
  const target: User = interaction.options.getUser("user", true);
  if (target.id === caller.id) { await interaction.reply({ content: "❌  You can't crack on yourself!", ephemeral: true }); return; }
  if (target.bot) { await interaction.reply({ content: "❌  You can't crack on a bot!", ephemeral: true }); return; }

  const ck = pairKey(caller.id, target.id);
  const pairCount   = (crackPairMap.get(ck) ?? 0) + 1; crackPairMap.set(ck, pairCount);
  const globalCount = (crackHitMap.get(target.id) ?? 0) + 1; crackHitMap.set(target.id, globalCount);

  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x2b2d31)
      .setDescription(`**<@${target.id}>, <@${caller.id}> is cracking on you!**\n\n**${caller.username}** and **${target.username}** have cracked **${times(pairCount)}**.`)
      .setImage(pick(CRACK_GIFS))
      .setFooter({ text: `${target.username} has been cracked ${times(globalCount)} total.` })],
  });
}

async function handleKill(interaction: ChatInputCommandInteraction): Promise<void> {
  const caller: User = interaction.user;
  const target: User = interaction.options.getUser("user", true);
  if (target.id === caller.id) { await interaction.reply({ content: "💀  You can't kill yourself — who would do the killing?", ephemeral: true }); return; }
  if (target.bot) { await interaction.reply({ content: "🤖  Bots don't die. Nice try.", ephemeral: true }); return; }

  const ck = pairKey(caller.id, target.id);
  const pairCount   = (killPairMap.get(ck) ?? 0) + 1; killPairMap.set(ck, pairCount);
  const globalCount = (killHitMap.get(target.id) ?? 0) + 1; killHitMap.set(target.id, globalCount);

  const line = pick(KILL_LINES)(`<@${caller.id}>`, `<@${target.id}>`);
  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x8b0000)
      .setDescription(`${line}\n\n**${caller.username}** has killed **${target.username}** **${times(pairCount)}**.`)
      .setImage(pick(KILL_GIFS))
      .setFooter({ text: `${target.username} has died ${times(globalCount)} in total. rip 💀` })],
  });
}

async function handleMeow(interaction: ChatInputCommandInteraction): Promise<void> {
  const caller: User = interaction.user;
  const target: User | null = interaction.options.getUser("user");

  const count = (meowMap.get(caller.id) ?? 0) + 1;
  meowMap.set(caller.id, count);

  const desc = (target && target.id !== caller.id && !target.bot)
    ? pick(MEOW_LINES_TARGET)(`<@${caller.id}>`, `<@${target.id}>`)
    : pick(MEOW_LINES_SOLO)(`<@${caller.id}>`);

  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setColor(0xff9ecd)
      .setDescription(desc)
      .setImage(pick(MEOW_GIFS))
      .setFooter({ text: `${caller.username} has meowed ${times(count)}.` })],
  });
}

client.login(TOKEN);
