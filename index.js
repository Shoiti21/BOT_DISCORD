import express from "express";
import * as dotenv from "dotenv";
import { verifyKeyMiddleware } from "discord-interactions";

dotenv.config();

const app = express();

app.listen(process.env.PORT, () => {
  console.log(`Conectado na porta ${process.env.PORT}`);
});

app.post(
  "/interactions",
  verifyKeyMiddleware(process.env["TOKEN"]),
  (req, res) => {
    const message = req.body;

    if (type === InteractionType.PING) {
      return res.send({ type: InteractionResponseType.PONG });
    }

    if (message.type === InteractionType.APPLICATION_COMMAND) {
      res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Hello world",
        },
      });
    }
  }
);
