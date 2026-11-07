import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";

import { apiError, handleApiError } from "../src/lib/utils";
import {
  canAccessProject,
  canModifyProject,
} from "../modules/project/access";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../modules/project/project.schema";
import {
  createRoomSchema,
  updateRoomSchema,
} from "../modules/room/room.schema";

describe("project authorization rules", () => {
  const project = {
    projectOwnerId: "owner-1",
    projectMembers: [{ userId: "member-1" }],
  };

  it("allows the owner to access and modify", () => {
    assert.equal(canAccessProject(project, "owner-1"), true);
    assert.equal(canModifyProject(project, "owner-1"), true);
  });

  it("allows members to access but not modify", () => {
    assert.equal(canAccessProject(project, "member-1"), true);
    assert.equal(canModifyProject(project, "member-1"), false);
  });

  it("denies strangers", () => {
    assert.equal(canAccessProject(project, "stranger"), false);
    assert.equal(canModifyProject(project, "stranger"), false);
  });

  it("denies empty user ids", () => {
    assert.equal(canAccessProject(project, ""), false);
    assert.equal(canModifyProject(project, ""), false);
  });

  it("handles projects without loaded members", () => {
    assert.equal(canAccessProject({ projectOwnerId: "a" }, "a"), true);
    assert.equal(canAccessProject({ projectOwnerId: "a" }, "b"), false);
  });
});

describe("request validation", () => {
  it("strips a spoofed projectOwnerId from room payloads", () => {
    const parsed = createRoomSchema.parse({
      name: "Room A",
      projectId: "proj-1",
      projectOwnerId: "attacker-id",
    });

    assert.deepEqual(parsed, { name: "Room A", projectId: "proj-1" });
    assert.equal("projectOwnerId" in parsed, false);
  });

  it("rejects room payloads without projectId", () => {
    assert.throws(() => createRoomSchema.parse({ name: "Room A" }), ZodError);
  });

  it("rejects empty room update payloads", () => {
    assert.throws(() => updateRoomSchema.parse({}), ZodError);
    assert.deepEqual(updateRoomSchema.parse({ name: "New" }), {
      name: "New",
    });
  });

  it("rejects empty project update payloads", () => {
    assert.throws(() => updateProjectSchema.parse({}), ZodError);
  });

  it("validates project creation payloads", () => {
    assert.throws(
      () => createProjectSchema.parse({ name: "x" }),
      ZodError,
    );
    assert.deepEqual(
      createProjectSchema.parse({ name: "Valid Name" }),
      { name: "Valid Name", description: "" },
    );
  });
});

describe("error sanitization", () => {
  it("does not leak internal error messages on 500s", async () => {
    const response = handleApiError(new Error("db password=hunter2 at pg://x"));
    assert.equal(response.status, 500);

    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Internal server error");
    assert.equal(JSON.stringify(body).includes("hunter2"), false);
  });

  it("maps validation errors to 400", async () => {
    const response = handleApiError(
      createRoomSchema.safeParse({}).error as ZodError,
    );
    assert.equal(response.status, 400);

    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });

  it("maps malformed JSON to 400", async () => {
    const response = handleApiError(new SyntaxError("Unexpected token"));
    assert.equal(response.status, 400);

    const body = await response.json();
    assert.equal(body.message, "Invalid JSON body");
  });

  it("keeps the consistent error envelope", async () => {
    const response = apiError("Unauthorized", 401);
    assert.equal(response.status, 401);

    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), [
      "data",
      "errors",
      "message",
      "success",
    ]);
    assert.equal(body.success, false);
    assert.equal(body.data, null);
  });
});
