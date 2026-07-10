"use server";
import * as bcrypt from "bcrypt-ts";
import { cookies } from "next/headers";
import { generateJWT } from "./jwt";
import { getPayload } from "./jwt";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

export async function resetJWT(payload?: Omit<JWTPayload, "v">) {
  if (!payload) {
    const current = await getPayload();
    const userid = current?._id;
    if (!userid) throw new Error("User not found");

    const user = await fetchQuery(
      api.self.get,
      { userID: userid as Id<"users"> },
      {
        token: process.env.SERVER_JWT!,
      },
    );

    if (!user) throw new Error("User not found");
    payload = {
      _id: user._id,
      name: user.name,
    };
  }
  if (!payload) throw new Error("User not found");
  const cookie = await cookies();
  cookie.set("jwt", await generateJWT(payload), {
    httpOnly: true,
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  });
}

export async function login(name: string, password: string) {
  const user = await fetchQuery(
    api.auth.getUserFromName,
    { name },
    {
      token: process.env.SERVER_JWT!,
    },
  );
  if (!user) {
    console.debug("User not found during login for name:", name);
    return null;
  }
  // hash password and compare with db password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;
  // Update last login time
  await fetchMutation(
    api.auth.updateLastLogin,
    { userID: user._id },
    {
      token: process.env.SERVER_JWT!,
    },
  );
  await resetJWT(user);
  return user;
}

export async function register(input: { name: string; password: string }) {
  const hashedPassword = await hashPassword(input.password);

  await fetchMutation(
    api.auth.register,
    {
      name: input.name,
      password: hashedPassword,
    },
    {
      token: process.env.SERVER_JWT!,
    },
  );
}

export async function logout() {
  (await cookies()).delete("jwt");
  return true;
}
