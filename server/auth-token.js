import jwt from "jsonwebtoken";
import { env } from "./env.js";

export function signUser(user) {
  return jwt.sign(
    {
      sub: user.id,
      tid: user.tenant_id,
      bid: user.branch_id,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: "12h" }
  );
}

export function readAuth(request) {
  const header = request.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw Object.assign(new Error("Sign in required"), { statusCode: 401 });
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    throw Object.assign(new Error("Session expired"), { statusCode: 401 });
  }
}
