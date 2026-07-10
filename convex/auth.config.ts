import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "grosse-time-tracker",
      issuer: "https://time.cupcake-cloud.de",
      jwks: process.env.JWT_PUBLIC_JWKS!,
      algorithm: "RS256",
    },
  ],
} as AuthConfig;
