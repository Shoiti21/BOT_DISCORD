import { QueryType } from "discord-player";
import {
  AttachmentBuilder,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

const file = new AttachmentBuilder("./assets/thumbnail.gif");

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
    async run({ client, interaction }) {
      let url = null;
      let searchEngine = null;

      switch (await interaction.options.getSubcommand()) {
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
        throw {
          message: "Não foi encontrado o vídeo",
        };
      }

      const song = result.tracks[0];

      const queue = await client.player.createQueue(interaction.guild);

      if (!interaction.member.voice.channel) {
        throw {
          message:
            "Você precisa estar em um Voice Channel para usar este comando",
        };
      }

      if (!queue.connection) {
        await queue.connect(interaction.member.voice.channel);
      }

      await queue.addTrack(song);

      const embed = new EmbedBuilder()
        .setAuthor({ name: song.source.toUpperCase() })
        .setTitle(song.title)
        .setURL(song.url)
        .setDescription(`Foi adicionado à fila`)
        .addFields(
          { name: "Nome do Canal", value: song.author, inline: true },
          { name: "Duração", value: song.duration, inline: true }
        )
        .setThumbnail(song.thumbnail)
        .setImage("attachment://thumbnail.gif")
        .setTimestamp();

      if (!queue.playing) queue.play();

      await interaction.reply({
        embeds: [embed],
        files: [file],
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("pause")
      .setDescription("Pausar a música"),
    async run({ client, interaction }) {
      const queue = client.player.getQueue(interaction.guildId);

      if (!queue) {
        throw {
          message: "Não há músicas na fila",
        };
      }

      queue.setPaused(true);

      await interaction.reply("O som foi pausado.");
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("resume")
      .setDescription("Retoma a música"),
    async run({ client, interaction }) {
      const queue = client.player.getQueue(interaction.guildId);

      if (!queue) {
        throw {
          message: "Não há músicas na fila",
        };
      }

      queue.setPaused(false);

      await interaction.reply("O som foi retomado.");
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("skip")
      .setDescription("Ir para o próximo som"),
    async run({ client, interaction }) {
      const queue = await client.player.getQueue(interaction.guildId);

      if (!queue) {
        throw {
          message: "Não há músicas na fila",
        };
      }

      const nextSong = queue.tracks[0];

      queue.skip();

      if (nextSong) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Pulando...")
              .setDescription(
                `O próximo som será [${nextSong.title}](${nextSong.url})`
              )
              .setThumbnail(nextSong.thumbnail),
          ],
        });
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("info")
      .setDescription(
        "Exibe informações sobre os sons que está tocando no momento"
      ),
    async run({ client, interaction }) {
      const queue = client.player.getQueue(interaction.guildId);

      if (!queue) {
        throw {
          message: "Não há músicas na fila",
        };
      }

      let bar = queue.createProgressBar({
        queue: false,
        length: 19,
      });

      let embeds = [];

      if (queue.tracks.length != 0) {
        embeds = queue.tracks
          .map((song, index) => {
            return new EmbedBuilder().setDescription(
              `${index + 1}. [${song.title}](${song.url})`
            );
          })
          .reverse();
      }

      const currentSong = queue.current;

      embeds.push(
        new EmbedBuilder()
          .setThumbnail(currentSong.thumbnail)
          .setDescription(
            `Currently Playing [${currentSong.title}](${currentSong.url})\n\n` +
              bar
          )
      );

      await interaction.reply({
        embeds: embeds,
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("stop")
      .setDescription("Parar o bot e limpar a fila"),
    async run({ client, interaction }) {
      const queue = client.player.getQueue(interaction.guildId);

      if (!queue) {
        throw {
          message: "Não há músicas na fila",
        };
      }

      queue.destroy();
      await interaction.reply({
        embeds: [
          new EmbedBuilder().setTitle("Parando...").setDescription(`Até mais!`),
        ],
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
