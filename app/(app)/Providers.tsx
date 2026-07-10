"use client";
import { ConvexClientProvider } from "@/components/context/ConvexClientProvider";
import { UserProvider } from "@/components/context/UserContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { logout } from "@/server/auth";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Link from "next/link";

export interface ProvidersProps {
  children: React.ReactNode;
  jwt?: string;
}

export default function Providers(props: Readonly<ProvidersProps>) {
  return (
    <ConvexClientProvider>
      <Authenticated>
        <UserProvider jwt={props.jwt}>
          {props.children}
          <Toaster />
        </UserProvider>
      </Authenticated>
      <Unauthenticated>
        <div className="m-4">
          <h2 className="mb-2 text-2xl font-bold">You are not logged in</h2>
          <p className="text-md">Please log in to access the app.</p>
          <Link href="/login">
            <Button
              className="mt-4"
              onClick={async () => {
                await logout();
              }}
            >
              Log In
            </Button>
          </Link>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="p-4 h-dvh">
          <Skeleton className="w-full h-full" />
        </div>
      </AuthLoading>
    </ConvexClientProvider>
  );
}
