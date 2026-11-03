import { Server } from "@hocuspocus/server";

const server = new Server({
  port: 1234,

  async onConnect({ documentName }) {
    console.log(`Connected to room: ${documentName}`);
  },

  async onDisconnect({ documentName }) {
    console.log(`Disconnected from room: ${documentName}`);
  },
});

server.listen();

console.log("Collaboration server running on ws://localhost:1234");
