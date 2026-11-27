import { StudioShell } from "@/features/studio/StudioShell";

export default async function ProjectStudioPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <StudioShell projectId={projectId} />;
}
