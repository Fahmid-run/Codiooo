type ProjectLike = {
  projectOwnerId: string;
  projectMembers?: Array<{ userId: string }>;
};

export function canAccessProject(project: ProjectLike, userId: string) {
  if (!userId) return false;
  if (project.projectOwnerId === userId) return true;
  return (project.projectMembers ?? []).some(
    (member) => member.userId === userId,
  );
}

export function canModifyProject(project: ProjectLike, userId: string) {
  if (!userId) return false;
  return project.projectOwnerId === userId;
}
