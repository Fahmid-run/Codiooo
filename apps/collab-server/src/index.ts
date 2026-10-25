import { Server } from "@hocuspocus/server";

const server = new Server({
  port: 1234,

  async onConnect({ documentName }: { documentName: any }) {
    console.log(`Client connected to room: ${documentName}`);
  },
});

server.listen();

console.log("Collab server running on port 1234");
