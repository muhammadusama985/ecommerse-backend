import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;
const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

function splitName(fullName = "") {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: "Guest", lastName: "User" };
  }

  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] || "Guest",
    lastName: parts.slice(1).join(" ") || "User",
  };
}

async function verifyGoogleToken(token) {
  if (!googleClient) {
    throw new Error("Google login is not configured yet.");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();

  return {
    provider: "google",
    providerId: payload.sub,
    email: payload.email,
    firstName: payload.given_name || splitName(payload.name).firstName,
    lastName: payload.family_name || splitName(payload.name).lastName,
    avatar: payload.picture || "",
  };
}

async function verifyFacebookToken(token) {
  if (!env.facebookAppId || !env.facebookAppSecret) {
    throw new Error("Facebook login is not configured yet.");
  }

  const appToken = `${env.facebookAppId}|${env.facebookAppSecret}`;
  const debugResponse = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(appToken)}`,
  );
  const debugPayload = await debugResponse.json();
  const debugData = debugPayload.data || {};

  if (!debugResponse.ok || !debugData.is_valid || debugData.app_id !== env.facebookAppId) {
    throw new Error("Facebook token is invalid.");
  }

  const profileResponse = await fetch(
    `https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture&access_token=${encodeURIComponent(token)}`,
  );
  const profile = await profileResponse.json();

  if (!profileResponse.ok || !profile.id) {
    throw new Error("Unable to fetch Facebook profile.");
  }

  return {
    provider: "facebook",
    providerId: profile.id,
    email: profile.email,
    firstName: profile.first_name || "Facebook",
    lastName: profile.last_name || "User",
    avatar: profile.picture?.data?.url || "",
  };
}

async function verifyAppleToken(token, profile = {}) {
  if (!env.appleClientId) {
    throw new Error("Apple login is not configured yet.");
  }

  const { payload } = await jwtVerify(token, appleJwks, {
    issuer: "https://appleid.apple.com",
    audience: env.appleClientId,
  });

  const derivedName = splitName(`${profile.firstName || ""} ${profile.lastName || ""}`);

  return {
    provider: "apple",
    providerId: payload.sub,
    email: payload.email || profile.email,
    firstName: profile.firstName || derivedName.firstName,
    lastName: profile.lastName || derivedName.lastName,
    avatar: "",
  };
}

async function verifySocialLogin({ provider, token, profile }) {
  if (provider === "google") {
    return verifyGoogleToken(token);
  }

  if (provider === "facebook") {
    return verifyFacebookToken(token);
  }

  if (provider === "apple") {
    return verifyAppleToken(token, profile);
  }

  throw new Error("Unsupported social login provider.");
}

function createRandomPassword() {
  return `${crypto.randomBytes(18).toString("hex")}Aa1!`;
}

export { verifySocialLogin, createRandomPassword };
