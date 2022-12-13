import * as dotenv from "dotenv";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import commands from "./commands.js";
import { Player } from "discord-player";

dotenv.config();

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
