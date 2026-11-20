import { handler, jsonOk } from "@/lib/api";
import { logout } from "@/services/auth/auth.service";

export const POST = handler(async () => {
  await logout();
  return jsonOk({ loggedOut: true });
});
