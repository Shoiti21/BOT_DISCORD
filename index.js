import * as dotenv from "dotenv";
import express from "express";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import commands from "./commands.js";
import { Player } from "discord-player";

dotenv.config();

const app = express();

app.get("/", (req, res) => {
  res.send("Ping!");
});

app.listen(8080, () => {
  console.log(`Ouvindo na porta 8080`);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});
client.commands = new Collection();
client.player = new Player(client, {
  ytdlOptions: {
    quality: "highestaudio",
    highWaterMark: 1 << 25,
  },
});

commands(client);

client.on("ready", () => {
  console.log(`Conectado no ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (
    !interaction.isChatInputCommand ||
    interaction.isButton() ||
    interaction.isModalSubmit()
  )
    return;

  try {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      throw { message: "Comando não configurado" };
    }
    await command.run({ client, interaction });
  } catch (error) {
    await interaction.reply({
      content: error.message || "Aconteceu algo",
      ephemeral: true,
    });
  }
});

client.login(process.env.TOKEN);
