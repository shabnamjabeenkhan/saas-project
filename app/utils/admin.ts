import { redirect } from "react-router";
import { isFeatureEnabled } from "../../config";

// Add your admin email here
const ADMIN_EMAILS = [
  "shabnam.jabeen.1998@gmail.com", // Replace with your actual email
  "admin@tradeboostai.com",   // Add any additional admin emails
];

export async function requireAdmin(args: any) {
  const authEnabled = isFeatureEnabled("auth");

  if (!authEnabled) {
    // If auth is disabled, allow admin access for development
    return { isAdmin: true, user: null };
  }

  try {
    const { getAuth } = await import("@clerk/react-router/ssr.server");
    const { createClerkClient } = await import("@clerk/react-router/api.server");

    const auth = await getAuth(args);

    if (!auth || !("userId" in auth) || !auth.userId) {
      throw redirect("/sign-in");
    }

    const user = await createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY as string,
    }).users.getUser(auth.userId);

    const userEmail = user.emailAddresses?.[0]?.emailAddress;

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      throw redirect("/dashboard"); // Redirect non-admins to regular dashboard
    }

    return { isAdmin: true, user };
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Re-throw redirect responses
    }
    throw redirect("/sign-in");
  }
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}