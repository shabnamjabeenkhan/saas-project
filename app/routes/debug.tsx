import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function Debug() {
  const currentUser = useQuery(api.debug.getCurrentUserInfo);
  const allOnboardingData = useQuery(api.debug.getAllOnboardingData);
  const allUsers = useQuery(api.debug.getAllUsers);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Debug Information</h1>

        {/* Current User */}
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Current User</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-gray-300">
              {JSON.stringify(currentUser, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* All Onboarding Data */}
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">All Onboarding Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allOnboardingData?.map((data, index) => (
                <div key={index} className="border border-gray-700 rounded p-4">
                  <div className="mb-2">
                    <span className="font-medium text-white">User ID: </span>
                    <span className="text-gray-300">{data.userId}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium text-white">Completed: </span>
                    <span className={data.isComplete ? "text-green-400" : "text-red-400"}>
                      {data.isComplete ? "✅ Yes" : "❌ No"}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium text-white">Business: </span>
                    <span className="text-gray-300">{data.businessName || "Not set"}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium text-white">Email: </span>
                    <span className="text-gray-300">{data.email || "Not set"}</span>
                  </div>
                  {data.completedAt && (
                    <div className="mb-2">
                      <span className="font-medium text-white">Completed At: </span>
                      <span className="text-gray-300">
                        {new Date(data.completedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Users */}
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allUsers?.map((user, index) => (
                <div key={index} className="border border-gray-700 rounded p-4">
                  <div className="mb-2">
                    <span className="font-medium text-white">Token Identifier: </span>
                    <span className="text-gray-300">{user.tokenIdentifier}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium text-white">Name: </span>
                    <span className="text-gray-300">{user.name || "Not set"}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium text-white">Email: </span>
                    <span className="text-gray-300">{user.email || "Not set"}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}