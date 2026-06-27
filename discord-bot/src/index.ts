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

const coupleMap = new Map<string, number>();
const targetMap = new Map<string, number>();
const killMap   = new Map<string, number>();
const killTargetMap = new Map<string, number>();

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}
function times(n: number): string {
  return n === 1 ? "1 time" : `${n} times`;
}

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
  "https://media.giphy.com/media/19S5OnlvTz1KzQB2Jv/giphy.gif",
  "https://media.giphy.com/media/2oO4qbgXCG3YY/giphy.gif",
  "https://media.giphy.com/media/i3ikTK3ZwBy4uUH1Ot/giphy.gif",
  "https://media.giphy.com/media/wEeIdfjuhIfwhUq2be/giphy.gif",
  "https://media.giphy.com/media/W70LEwFTHlg4ZzB7vl/giphy.gif",
  "https://media.giphy.com/media/l925axfj7YFo68XH2v/giphy.gif",
  "https://media.giphy.com/media/EuYk9AYemhrDk8lh37/giphy.gif",
  "https://media.giphy.com/media/iHaDbbesKYT6M/giphy.gif",
  "https://media.giphy.com/media/SF84XwgZeRYfVNsLst/giphy.gif",
];

const MEOW_GIFS: string[] = [
  "https://media.giphy.com/media/ipxGb5koxBQWVAjmEF/giphy.gif",
  "https://media.giphy.com/media/I9XrL9Tc1jpe/giphy.gif",
  "https://media.giphy.com/media/Nysdvh6lajIc0/giphy.gif",
  "https://media.giphy.com/media/kQxj0pd5uunST8lv32/giphy.gif",
  "https://media.giphy.com/media/7iizPhPPgxJHa/giphy.gif",
  "https://media.giphy.com/media/sDudkzg2zMjDk7HKsB/giphy.gif",
  "https://media.giphy.com/media/xqIyNcR4BUS3u/giphy.gif",
  "https://media.giphy.com/media/jTf83ZnIn7A1dKRqvQ/giphy.gif",
  "https://media.giphy.com/media/EIXWGdjKzTFwEXSw66/giphy.gif",
  "https://media.giphy.com/media/U7EK2vwXv20oGmt4Ek/giphy.gif",
  "https://media.giphy.com/media/BGpx4ljIl8Jiw/giphy.gif",
  "https://media.giphy.com/media/QbOztUtvQPQ4LVlS65/giphy.gif",
];

function pick(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

const BASE = { integration_types: [1], contexts: [0, 1, 2] };
const USER_OPTION = { name: "user", description: "Target user", type: 6, required: true };

const COMMANDS = [
  {
    ...BASE,
    name: "crack",
    description: "Crack on another user!",
    options: [{ ...USER_OPTION, description: "The user you want to crack on" }],
  },
  {
    ...BASE,
    name: "kill",
    description: "Kill another user (anime style)!",
    options: [{ ...USER_OPTION, description: "The user you want to kill" }],
  },
  {
    ...BASE,
    name: "meow",
    description: "Meow at someone (or just meow)!",
    options: [{ ...USER_OPTION, description: "The user to meow at", required: false }],
  },
];

async function registerCommands(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    console.log("📡  Registering commands globally…");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: COMMANDS });
    console.log("✅  Commands registered.");
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
  if (interaction.commandName === "crack") return handleCrack(interaction);
  if (interaction.commandName === "kill")  return handleKill(interaction);
  if (interaction.commandName === "meow")  return handleMeow(interaction);
});

async function handleCrack(interaction: ChatInputCommandInteraction): Promise<void> {
  const caller: User = interaction.user;
  const target: User = interaction.options.getUser("user", true);

  if (target.id === caller.id) { await interaction.reply({ content: "❌  You can't crack on yourself!", ephemeral: true }); return; }
  if (target.bot) { await interaction.reply({ content: "❌  You can't crack on a bot!", ephemeral: true }); return; }

  const ck = pairKey(caller.id, target.id);
  const coupleCount = (coupleMap.get(ck) ?? 0) + 1; coupleMap.set(ck, coupleCount);
  const globalCount = (targetMap.get(target.id) ?? 0) + 1; targetMap.set(target.id, globalCount);

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setDescription(
      `**<@${target.id}>, <@${caller.id}> is cracking on you!**\n\n` +
      `**${caller.username}** and **${target.username}** have cracked **${times(coupleCount)}**.`
    )
    .setImage(pick(CRACK_GIFS))
    .setFooter({ text: `${target.username} has been cracked ${times(globalCount)}.` });

  await interaction.reply({ embeds: [embed] });
}

async function handleKill(interaction: ChatInputCommandInteraction): Promise<void> {
  const caller: User = interaction.user;
  const target: User = interaction.options.getUser("user", true);

  if (target.id === caller.id) { await interaction.reply({ content: "❌  You can't kill yourself!", ephemeral: true }); return; }
  if (target.bot) { await interaction.reply({ content: "❌  You can't kill a bot!", ephemeral: true }); return; }

  const ck = pairKey(caller.id, target.id);
  const killCount = (killMap.get(ck) ?? 0) + 1; killMap.set(ck, killCount);
  const totalKilled = (killTargetMap.get(target.id) ?? 0) + 1; killTargetMap.set(target.id, totalKilled);

  const embed = new EmbedBuilder()
    .setColor(0x8b0000)
    .setDescription(
      `**💀 <@${caller.id}> just killed <@${target.id}>!**\n\n` +
      `**${caller.username}** has killed **${target.username}** **${times(killCount)}**.`
    )
    .setImage(pick(KILL_GIFS))
    .setFooter({ text: `${target.username} has been killed ${times(totalKilled)} total.` });

  await interaction.reply({ embeds: [embed] });
}

async function handleMeow(interaction: ChatInputCommandInteraction): Promise<void> {
  const caller: User = interaction.user;
  const target: User | null = interaction.options.getUser("user");

  const embed = new EmbedBuilder()
    .setColor(0xffb6c1)
    .setImage(pick(MEOW_GIFS));

  if (target && target.id !== caller.id && !target.bot) {
    embed.setDescription(`**🐱 <@${caller.id}> meows at <@${target.id}>!**`);
  } else {
    embed.setDescription(`**🐱 <@${caller.id}> goes meow~**`);
  }

  await interaction.reply({ embeds: [embed] });
}

client.login(TOKEN);
