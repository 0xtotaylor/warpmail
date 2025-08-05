"use client";

import Link from "next/link";
import * as React from "react";
import Image from "next/image";
import { useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter, useParams } from "next/navigation";
import {
  ArchiveX,
  File,
  Inbox,
  Send,
  Trash2,
  Reply,
  ReplyAll,
  Forward,
  Trash,
  Pen,
} from "lucide-react";

import { FolderType } from "@/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { NavUser } from "@/components/nav-user";
// import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { formatDate } from "@/lib/utils";
// import { Switch } from "@/components/ui/switch";
import { useEmails } from "@/context/EmailContext";
import { Skeleton } from "@/components/ui/skeleton";

const data = {
  navMain: [
    {
      title: "Inbox",
      url: "#",
      icon: Inbox,
      isActive: true,
      folder: FolderType.inbox,
    },
    {
      title: "Drafts",
      url: "#",
      icon: File,
      isActive: false,
      folder: FolderType.drafts,
    },
    {
      title: "Sent",
      url: "#",
      icon: Send,
      isActive: false,
      folder: FolderType.sent,
    },
    {
      title: "Spam",
      url: "#",
      icon: ArchiveX,
      isActive: false,
      folder: FolderType.spam,
    },
    {
      title: "Trash",
      url: "#",
      icon: Trash2,
      isActive: false,
      folder: FolderType.trash,
    },
  ],
};

// Separate component for the theme-aware logo
const ThemeAwareLogo = () => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a default logo or placeholder during SSR
    return (
      <Image
        src="/icon-light.svg"
        alt="WarpMail Logo"
        width={12}
        height={12}
        className="size-6"
      />
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;
  const logoSrc =
    currentTheme === "dark" ? "/icon-dark.svg" : "/icon-light.svg";

  return (
    <Image
      src={logoSrc}
      alt="WarpMail Logo"
      width={12}
      height={12}
      className="size-6"
    />
  );
};

const EmailSkeletons = () => (
  <>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
      <div key={i} className="flex flex-col gap-2 p-4 border-b last:border-b-0">
        <div className="flex items-center justify-between w-full">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[60px]" />
        </div>
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[260px]" />
      </div>
    ))}
  </>
);

export function AppSidebar() {
  const params = useParams();
  const router = useRouter();
  const { searchEmails, setComposeData } = useEmails();
  const currentFolder = params.folder
    ? ((params.folder as string).toLowerCase() as FolderType)
    : FolderType.inbox;

  const [activeItem, setActiveItem] = React.useState(
    data.navMain.find((item) => item.folder === currentFolder) ||
      data.navMain[0]
  );

  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredEmails = React.useMemo(() => {
    // For compose route, show inbox emails
    const targetLabel = params.folder === "compose" ? "inbox" : currentFolder;
    return searchEmails(searchTerm, targetLabel);
  }, [currentFolder, searchTerm, params.folder, searchEmails]);

  // Prefetch all mail folders
  React.useEffect(() => {
    data.navMain.forEach((item) => {
      router.prefetch(`/mail/${item.folder.toLowerCase()}`);
    });
  }, [router]);

  const handleFolderClick = useCallback(
    (item: (typeof data.navMain)[0]) => {
      setSearchTerm("");
      router.push(`/mail/${item.folder.toLowerCase()}`);
    },
    [router]
  );

  React.useEffect(() => {
    setActiveItem(
      data.navMain.find((item) => item.folder === currentFolder) ||
        data.navMain[0]
    );
  }, [currentFolder]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
  };

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
    >
      {/* This is the first sidebar */}
      <Sidebar
        collapsible="none"
        className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <Link href="/mail/inbox">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                    <ThemeAwareLogo />
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {/* Rest of the sidebar content remains the same */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={{ children: "Compose", hidden: false }}
                    onClick={() => router.push("/mail/compose")}
                    className="px-2.5 md:px-2"
                  >
                    <Pen className="w-4 h-4" />
                    <span>{"Compose"}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{ children: item.title, hidden: false }}
                      onClick={() => handleFolderClick(item)}
                      isActive={activeItem.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex min-w-[5%]">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">
              {activeItem.title}
            </div>
            {/* <Label className="flex items-center gap-2 text-sm">
              <span>Unread</span>
              <Switch className="shadow-none" />
            </Label> */}
          </div>
          <SidebarInput
            placeholder="Type to search..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {filteredEmails.length > 0 ? (
                filteredEmails.map((mail) => {
                  const isSelected = mail.id === params.slug;
                  const sender = mail.from;

                  return (
                    <ContextMenu key={mail.id}>
                      <ContextMenuTrigger>
                        <Link
                          href={`/mail/${currentFolder}/${mail.id}`}
                          className={cn(
                            "flex flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            isSelected &&
                              "bg-sidebar-accent text-sidebar-accent-foreground"
                          )}
                        >
                          <div className="flex w-full items-center gap-2">
                            <span className="truncate flex-1">
                              {sender?.name || sender?.email}
                            </span>
                            <span className="flex-shrink-0 text-xs">
                              {formatDate(mail.date)}
                            </span>
                          </div>
                          <span className="font-medium truncate w-11/12">
                            {mail.subject}
                          </span>
                          <span className="line-clamp-2 w-[260px] whitespace-break-spaces text-xs">
                            {mail.snippet}
                          </span>
                        </Link>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-64">
                        <ContextMenuItem
                          inset
                          onClick={() => {
                            setComposeData({
                              subject: mail.subject,
                              from: mail.from,
                            });
                            router.push("/mail/compose");
                          }}
                        >
                          Reply
                          <ContextMenuShortcut>
                            <Reply className="mr-2 h-4 w-4" />
                          </ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem
                          inset
                          onClick={() => {
                            setComposeData({
                              subject: mail.subject,
                              from: mail.from,
                            });
                            router.push("/mail/compose");
                          }}
                        >
                          Reply all
                          <ContextMenuShortcut>
                            <ReplyAll className="mr-2 h-4 w-4" />
                          </ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem
                          inset
                          onClick={() => {
                            setComposeData({
                              subject: `Fwd: ${mail.subject}`,
                              from: mail.from,
                              template: mail.text || mail.snippet,
                            });
                            router.push("/mail/compose");
                          }}
                        >
                          Forward
                          <ContextMenuShortcut>
                            <Forward className="mr-2 h-4 w-4" />
                          </ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem inset>
                          Delete
                          <ContextMenuShortcut>
                            <Trash className="mr-2 h-4 w-4" />
                          </ContextMenuShortcut>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })
              ) : currentFolder === FolderType.inbox ? (
                <EmailSkeletons />
              ) : null}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
