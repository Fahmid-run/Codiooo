/**
 * Canonical Room type, mirroring the API response from
 * `room.service.ts` (CollaborationRoom with included project
 * and projectOwner). Dates are ISO strings as serialized by
 * NextResponse.json.
 */
export interface Room {
  id: string;
  name: string;
  status: string;
  projectId: string;
  projectOwnerId: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
  };
  projectOwner: {
    id: string;
    name: string;
    email: string;
  };
}
