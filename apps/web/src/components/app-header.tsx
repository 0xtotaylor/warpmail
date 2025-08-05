"use client";

import { useParams } from "next/navigation";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useEmails } from "@/context/EmailContext";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  const params = useParams();
  const { emails } = useEmails();
  const pathname = usePathname();
  const folder = ((params?.folder as string) || "Inbox").toLowerCase();

  const displayFolder = folder.charAt(0).toUpperCase() + folder.slice(1);

  const currentEmail = params.slug
    ? emails?.find((email) => email.id === params.slug)
    : null;

  return (
    <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbPage>{displayFolder}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {pathname === "/mail/compose"
                ? "New Message"
                : currentEmail?.from
                ? currentEmail?.from.name || currentEmail?.from.email
                : ""}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
