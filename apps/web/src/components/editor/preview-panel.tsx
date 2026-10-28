"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, ExternalLink } from "lucide-react";

interface PreviewPanelProps {
  previewUrl: string | null;
}

export default function PreviewPanel({ previewUrl }: PreviewPanelProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Tabs defaultValue="preview" className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b px-3">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="console">Console</TabsTrigger>
          </TabsList>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh preview"
              disabled={!previewUrl}
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Open preview in new tab"
              disabled={!previewUrl}
              onClick={() => {
                if (previewUrl) {
                  window.open(previewUrl, "_blank", "noopener,noreferrer");
                }
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="preview" className="mt-0 min-h-0 flex-1">
          {previewUrl ? (
            <iframe
              key={refreshKey}
              src={previewUrl}
              title="CodeLab live preview"
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              className="h-full w-full bg-white"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
              Start the development server to see your preview.
            </div>
          )}
        </TabsContent>

        <TabsContent value="console" className="mt-0 flex-1 p-4">
          <p className="text-sm text-muted-foreground">
            Browser console integration can be added next.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
