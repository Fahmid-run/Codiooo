import { PlaygroundForm } from "@/components/room/room-form";
import React from "react";

function page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <PlaygroundForm></PlaygroundForm>
      </div>
    </div>
  );
}

export default page;
