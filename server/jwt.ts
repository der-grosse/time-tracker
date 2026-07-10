"use server";
import * as jwt from "jose";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { cookies } from "next/headers";
// These should be set as environment variables in your deployment platform
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;

const privateKeyStr = JWT_PRIVATE_KEY!;
const publicKeyStr = JWT_PUBLIC_KEY!;

let publicKey: CryptoKey | null = null;
let privateKey: CryptoKey | null = null;

async function loadKeys() {
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    // Skip this during build time
    return;
  }
  try {
    publicKey = publicKey ?? (await jwt.importSPKI(publicKeyStr, "RS256"));
    privateKey = privateKey ?? (await jwt.importPKCS8(privateKeyStr, "RS256"));
  } catch (error) {
    console.error("Error loading JWT keys:", error);
    throw new Error(
      "Failed to load JWT keys. Please ensure your keys are in the correct PEM format.",
    );
  }
}

// Load keys when the module is imported
loadKeys().catch((error) => {
  console.error("Failed to initialize JWT keys:", error);
});

export async function verifyJWT(token: string) {
  if (!token) return null;
  if (!publicKey) {
    throw new Error("JWT public key not initialized");
  }
  try {
    const decoded = await jwt.jwtVerify<AllJWTPayloads>(token, publicKey, {
      algorithms: ["RS256"],
    });
    if (!("v" in decoded.payload) || decoded.payload.v !== "2.0") {
      console.info("Unsupported JWT version:", decoded.payload);
      (await cookies()).delete("jwt");
      return null;
    }
    return decoded.payload as JWTPayload;
  } catch (err) {
    (await cookies()).delete("jwt");
    console.info("JWT verification failed:", err);
    return null;
  }
}

export async function generateJWT(user: Omit<JWTPayload, "v">) {
  if (!privateKey) {
    throw new Error("JWT private key not initialized");
  }
  const token = await new jwt.SignJWT({
    v: "2.0",
    _id: user._id,
    name: user.name,
  } satisfies JWTPayload)
    .setSubject(user._id.toString())
    .setProtectedHeader({ alg: "RS256", kid: "grosse-time-tracker-1" })
    .setAudience("grosse-time-tracker")
    .setIssuer("https://time.cupcake-cloud.de")
    .setIssuedAt(new Date(Date.now() - 60 * 1000)) // Set issued at 1 minute in the past to account for clock skew between convex and server
    .setExpirationTime(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))
    .sign(privateKey);
  return token;
}

export async function getPayload() {
  const token = await getJWT();
  if (!token) return null;
  const payload = await verifyJWT(token);
  if (!payload) return null;
  return payload;
}

export async function getJWT() {
  const token = (await cookies()).get("jwt")?.value;
  return token;
}
