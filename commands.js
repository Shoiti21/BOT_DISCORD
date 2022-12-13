import { REST, Routes, SlashCommandBuilder } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

const commandsList = [
  {
    data: new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Replies with Pong!"),
    async execute(interaction) {
      await interaction.reply("Pong!");
    },
  },
];

const Commands = (client) => {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  const commands = [];

  commandsList.forEach((command) => {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  });

  rest.put(
    Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
    {
      body: commands,
    }
  );
};

export default Commands;
