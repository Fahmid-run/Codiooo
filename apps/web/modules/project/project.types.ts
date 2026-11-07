/**
 * Canonical Project type, mirroring the API response from
 * `project.service.ts` (Project with included projectOwner).
 * Dates are ISO strings as serialized by NextResponse.json.
 */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  projectOwnerId: string;
  projectOwner: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}
