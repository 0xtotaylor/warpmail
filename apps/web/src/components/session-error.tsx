import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";

export default function SessionError() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      toast({
        title: "Session expired",
        description: "Please sign in again to continue",
        variant: "destructive",
      });
      router.push("/login");
    }
  }, [session?.error, toast, router]);

  return null;
}
