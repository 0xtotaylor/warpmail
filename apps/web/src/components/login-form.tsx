"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid gap-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                await signIn("google", { redirectTo: "/mail/inbox" });
              }}
            >
              Login with Google
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
