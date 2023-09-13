import jwt from "@tsndr/cloudflare-worker-jwt";
import { add, getUnixTime } from "date-fns";
import { User } from "../db/schema";

export const tokenTypes = {
  ACCESS: "access",
  REFRESH: "refresh",
  RESET_PASSWORD: "resetPassword",
  VERIFY_EMAIL: "verifyEmail",
} as const;

export type TokenType = (typeof tokenTypes)[keyof typeof tokenTypes];

export type TokenConfig = {
  accessExpirationMinutes: number;
  refreshExpirationDays: number;
  secret: string;
};

export const generateToken = async (
  userId: number,
  type: TokenType,
  expires: Date,
  secret: string,
  isEmailVerified: boolean | null = false
) => {
  const payload = {
    sub: userId.toString(),
    exp: getUnixTime(expires),
    iat: getUnixTime(new Date()),
    type,
    isEmailVerified,
  };
  return jwt.sign(payload, secret);
};

export const generateUserTokens = async (
  user: User,
  jwtConfig: TokenConfig
) => {
  const now = new Date();

  const accessTokenExpires = add(now, {
    minutes: jwtConfig.accessExpirationMinutes,
  });
  const accessToken = await generateToken(
    user.id,
    tokenTypes.ACCESS,
    accessTokenExpires,
    jwtConfig.secret,
    user.isEmailVerified
  );
  const refreshTokenExpires = add(now, {
    days: jwtConfig.refreshExpirationDays,
  });
  const refreshToken = await generateToken(
    user.id,
    tokenTypes.REFRESH,
    refreshTokenExpires,
    jwtConfig.secret,
    user.isEmailVerified
  );
  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires,
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires,
    },
  };
};
