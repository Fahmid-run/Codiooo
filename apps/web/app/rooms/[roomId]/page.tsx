import CollaborativeEditor from "@/components/editor/CollaborativeEditor";

interface RoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  return (
    <main className="h-screen w-full bg-background">
      <CollaborativeEditor roomId={roomId} />
    </main>
  );
}
