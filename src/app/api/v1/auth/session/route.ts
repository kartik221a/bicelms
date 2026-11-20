import { handler, jsonOk } from "@/lib/api";
import { getSession } from "@/services/auth/session";
import { flags, dataProviderName } from "@/config/env";

export const GET = handler(async () => {
  const session = await getSession();
  return jsonOk({
    user: session,
    setupMode: flags.setupMode,
    dataProvider: dataProviderName,
    integrations: {
      firebase: flags.firebaseConfigured,
      razorpay: flags.razorpayConfigured,
      cloudinary: flags.cloudinaryConfigured,
      email: flags.emailConfigured,
    },
  });
});
