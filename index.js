import * as dotenv from "dotenv";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import commands from "./commands.js";

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

commands(client);

client.on("ready", () => {
  console.log(`Conectado no ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      throw { mensange: "Comando não configurado" };
    }
    await command.execute(interaction);
  } catch (error) {
    await interaction.reply({
      content: error.mensange,
      ephemeral: true,
    });
  }
});

client.login(process.env.TOKEN);
