import CollaborativeEditor from "@/components/editor/CollaborativeEditor";

interface RoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  return (
    <main className="h-screen w-full bg-[#1e1e1e]">
      <CollaborativeEditor roomId={roomId} />
    </main>
  );
}
