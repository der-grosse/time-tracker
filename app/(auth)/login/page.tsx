"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/server/auth";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleX } from "lucide-react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function Login() {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const [loading, setLoading] = useState(false);

  return (
    <form
      className="h-screen flex flex-col items-center justify-center w-full gap-4"
      onSubmit={async (e) => {
        try {
          e.preventDefault();
          setError(false);
          setLoading(true);

          const user = await login(username, password);

          if (!mounted.current) return;

          setError(!user);

          if (user) {
            router.push("/");
          }
        } catch (e) {
          toast.error("An unexpected error occurred. Please try again.");
          console.error("Error logging in:", e);
        } finally {
          if (mounted.current) {
            setLoading(false);
          }
        }
      }}
    >
      <h1 className="text-3xl font-extrabold text-foreground text-center">
        Login
        <br />
        <span className="text-muted-foreground text-lg font-normal">der-grosse time-tracker</span>
      </h1>
      <Input
        type="text"
        placeholder="Username"
        autoComplete="username"
        autoFocus
        className="w-full max-w-[20rem]"
        value={username}
        onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
      />
      <Input
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        className="w-full max-w-[20rem]"
        value={password}
        onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
      />
      <Button type="submit" variant="default" className="w-full max-w-[20rem]" disabled={loading}>
        {loading ? <Spinner /> : "Login"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:text-primary/90 hover:underline">
          Create an account
        </Link>
      </p>

      <p className="text-lg text-destructive min-h-[2rem]">
        {error && (
          <>
            <CircleX className="w-5 h-5 inline align-sub mr-1" />
            Invalid password
          </>
        )}
      </p>
    </form>
  );
}
