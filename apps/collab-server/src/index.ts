import { config } from "./env.js";
import { createCollabServer } from "./server.js";

const server = createCollabServer({
  port: config.port,
  collabTokenSecret: config.collabTokenSecret,
});

server.listen(config.port);

console.log(`Collaboration server running on ws://localhost:${config.port}`);
