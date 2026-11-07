import { db } from "@codiooo/db/src";
import type { CreateRoomInput, UpdateRoomInput } from "./room.schema";
import { projectServices } from "../project/project.service";

async function getRoomWithProject(roomId: string) {
  return db.orm.public.CollaborationRoom.include("project")
    .include("projectOwner", (user) => user.select("id", "name", "email"))
    .where({ id: roomId })
    .first();
}

export const roomServices = {
  async getRoomsForUser(userId: string) {
    const accessibleProjectIds =
      await projectServices.getAccessibleProjectIds(userId);

    if (accessibleProjectIds.length === 0) return [];

    const rooms = await db.orm.public.CollaborationRoom.include("project")
      .include("projectOwner", (user) => user.select("id", "name", "email"))
      .where((room) => room.projectId.in(accessibleProjectIds))
      .orderBy((room) => room.createdAt.desc())
      .all();

    return rooms;
  },

  async getRoomByIdForUser(roomId: string, userId: string) {
    const room = await getRoomWithProject(roomId);

    if (!room) return null;

    const allowed = await projectServices.canAccessProject(
      room.projectId,
      userId,
    );
    if (!allowed) return null;

    return room;
  },

  async createRoomForUser(payload: CreateRoomInput, userId: string) {
    const allowed = await projectServices.canAccessProject(
      payload.projectId,
      userId,
    );
    if (!allowed) return "forbidden" as const;

    const room = await db.orm.public.CollaborationRoom.include("project")
      .include("projectOwner", (user) => user.select("id", "name", "email"))
      .create({
        name: payload.name,
        projectId: payload.projectId,
        projectOwnerId: userId,
      });

    return room;
  },

  async updateRoomForUser(
    roomId: string,
    userId: string,
    payload: UpdateRoomInput,
  ) {
    const room = await getRoomWithProject(roomId);

    if (!room) return null;
    if (room.projectOwnerId !== userId) return "forbidden" as const;

    const updated = await db.orm.public.CollaborationRoom.include("project")
      .include("projectOwner", (user) => user.select("id", "name", "email"))
      .where({ id: roomId })
      .update(payload);

    return updated;
  },

  async deleteRoomForUser(roomId: string, userId: string) {
    const room = await getRoomWithProject(roomId);

    if (!room) return null;
    if (room.projectOwnerId !== userId) return "forbidden" as const;

    await db.orm.public.CollaborationRoom.where({ id: roomId }).delete();

    return { id: roomId };
  },
};
