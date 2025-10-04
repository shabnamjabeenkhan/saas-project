import { SignIn } from "@clerk/react-router";
import { Navigate } from "react-router";
import { isFeatureEnabled, isServiceEnabled } from "../../config";

export default function SignInPage() {
  // Redirect if auth is not enabled
  if (!isFeatureEnabled('auth') || !isServiceEnabled('clerk')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <SignIn />
    </div>
  );
}
