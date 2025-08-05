import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { EmailProvider } from "@/context/EmailContext";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function EmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EmailProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "350px",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <Suspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center z-50">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              </div>
            }
          >
            <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </EmailProvider>
  );
}
