import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { CheckCircle, ExternalLink, Unlink } from "lucide-react";
import { toast } from "sonner";

export function GoogleAdsConnectionComponent() {
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = useQuery(api.googleAds.isConnected);
  const tokens = useQuery(api.googleAds.getTokens);
  const disconnect = useMutation(api.googleAds.disconnect);

  const handleConnect = () => {
    setIsConnecting(true);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth.google-ads`;
    const scope = 'https://www.googleapis.com/auth/adwords';

    const authUrl = new URL('https://accounts.google.com/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('response_type', 'code');

    window.location.href = authUrl.toString();
  };

  const handleDisconnect = async () => {
    try {
      await disconnect({});
      toast.success("Google Ads account disconnected");
    } catch (error) {
      toast.error("Failed to disconnect Google Ads account");
      console.error(error);
    }
  };

  if (isConnected === undefined) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isConnected ? (
        <Card className="bg-green-900/20 border-green-700">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <div>
              <CardTitle className="text-green-400 text-lg">Connected to Google Ads</CardTitle>
              <CardDescription>
                Your Google Ads account is successfully connected and authorized.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-300">
              <p><strong>Account ID:</strong> 909-963-3029</p>
              <p><strong>Connected:</strong> {tokens?.createdAt ? new Date(tokens.createdAt).toLocaleDateString() : 'Recently'}</p>
              <p><strong>Status:</strong> Active</p>
              {tokens?.expiresAt && new Date(tokens.expiresAt) < new Date() && <p className="text-yellow-400"><strong>Note:</strong> Token will be auto-refreshed</p>}
            </div>
            <Button
              onClick={handleDisconnect}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <Unlink className="w-4 h-4" />
              Disconnect
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Connect Google Ads Account</CardTitle>
            <CardDescription>
              Connect your Google Ads account to start syncing campaign data and managing your advertising.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-400">
              <p>When you connect your account, you'll be able to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>View real-time campaign performance</li>
                <li>Sync conversion data automatically</li>
                <li>Manage campaigns through the dashboard</li>
                <li>Access detailed analytics and insights</li>
              </ul>
            </div>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              {isConnecting ? "Connecting..." : "Connect Google Ads"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-gray-500">
        <p><strong>Security:</strong> We only request the minimum permissions needed for Google Ads management. Your credentials are securely encrypted and stored.</p>
      </div>
    </div>
  );
}