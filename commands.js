import { QueryType } from "discord-player";
import { EmbedBuilder, REST, Routes, SlashCommandBuilder } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

const commandsList = [
  {
    data: new SlashCommandBuilder()
      .setName("play")
      .setDescription("Tocar vídeo/música")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("url")
          .setDescription("Carregar por URL")
          .addStringOption((option) =>
            option
              .setName("url")
              .setDescription("O endereço do vídeo")
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("search")
          .setDescription("Procurar com base nas palavras-chave")
          .addStringOption((option) =>
            option
              .setName("terms")
              .setDescription("As palavras-chave de pesquisa")
              .setRequired(true)
          )
      ),
    run: async ({ client, interaction }) => {
      let url = null;
      let searchEngine = null;

      switch (interaction.options.getSubcommand()) {
        case "url":
          url = interaction.options.getString("url");
          searchEngine = QueryType.YOUTUBE_VIDEO;
          break;
        case "search":
          url = interaction.options.getString("terms");
          searchEngine = QueryType.AUTO;
          break;
      }

      const result = await client.player.search(url, {
        requestedBy: interaction.user,
        searchEngine: searchEngine,
      });

      if (result.tracks.length === 0) {
        return interaction.reply("Não foi encontrado o vídeo");
      }

      const song = result.tracks[0];

      const queue = await client.player.createQueue(interaction.guild);

      if (interaction.member.voice.channel && !queue.connection) {
        await queue.connect(interaction.member.voice.channel);
      } else {
        return interaction.reply(
          "Você precisa estar em um Voice Channel para usar este comando"
        );
      }

      await queue.addTrack(song);

      const embed = new EmbedBuilder()
        .setDescription(
          `**[${song.title}](${song.url})** foi adicionado à fila`
        )
        .setThumbnail(song.thumbnail)
        .setFooter({ text: `Duração: ${song.duration}` });

      if (!queue.playing) queue.play();

      await interaction.reply({
        embeds: [embed],
      });
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
