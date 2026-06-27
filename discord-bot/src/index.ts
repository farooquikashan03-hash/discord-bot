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

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function times(n: number): string {
  return n === 1 ? "1 time" : `${n} times`;
}

const GIFS: string[] = [
  // your picks
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
  // your originals
  "https://media.giphy.com/media/Mo122cd9G2xmKymanO/giphy.gif",
  "https://media.giphy.com/media/LDFtlGes4w0b5n815P/giphy.gif",
  "https://media.giphy.com/media/hdLU6GBi9DZKdzZlgn/giphy.gif",
  "https://media.giphy.com/media/pnJz2YUmt4kZkW0wxu/giphy.gif",
  "https://media.giphy.com/media/7z5ICi5kf3RXctLKwL/giphy.gif",
  "https://media.giphy.com/media/4dXreCHrMRLk2wN7YH/giphy.gif",
];

function randomGif(): string {
  return GIFS[Math.floor(Math.random() * GIFS.length)];
}

const COMMAND = {
  name: "crack",
  description: "Crack on another user!",
  integration_types: [1],
  contexts: [0, 1, 2],
  options: [
    {
      name: "user",
      description: "The user you want to crack on",
      type: 6,
      required: true,
    },
  ],
};

async function registerCommands(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    console.log("📡  Registering /crack command globally…");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [COMMAND] });
    console.log("✅  Command registered.");
  } catch (err) {
    console.error("❌  Failed to register command:", err);
  }
}

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

async function handleCrack(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const caller: User = interaction.user;
  const target: User = interaction.options.getUser("user", true);

  if (target.id === caller.id) {
    await interaction.reply({ content: "❌  You can't crack on yourself!", ephemeral: true });
    return;
  }
  if (target.bot) {
    await interaction.reply({ content: "❌  You can't crack on a bot!", ephemeral: true });
    return;
  }

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
    .setFooter({ text: `${target.username} has been cracked ${times(globalCount)}.` });

  await interaction.reply({ embeds: [embed] });
}

client.login(TOKEN);
