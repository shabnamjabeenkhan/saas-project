import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";

const DEVELOPMENT_MODE = import.meta.env.VITE_DEVELOPMENT_MODE === "true";

export default function GoogleAdsCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const processedRef = useRef<string | null>(null); // Track processed OAuth code
  const hasSucceededRef = useRef(false); // Track if we've successfully connected

  const saveGoogleAdsTokens = useMutation(api.googleAds.saveTokens);
  const exchangeCodeForTokens = useAction(api.googleAds.exchangeCodeForTokens);

  useEffect(() => {
    const handleCallback = async () => {
      // Get authorization code first to use as processing key
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      
      // Prevent duplicate processing: if we've already processed this code, skip
      if (processedRef.current === code) {
        console.log('⏭️ OAuth callback already processed, skipping duplicate execution');
        return;
      }
      
      // If we're processing a code, mark it as processed immediately to prevent race conditions
      if (code) {
        processedRef.current = code;
      }
      
      // Check for error in URL params
      if (error) {
        setStatus('error');
        setErrorMessage(`OAuth error: ${error}`);
        toast.error(`OAuth failed: ${error}`);
        return;
      }

      // Get authorization code
      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received');
        toast.error('No authorization code received');
        return;
      }

      if (DEVELOPMENT_MODE) {
        // Development mode: simulate successful token exchange
        console.log('🔧 Development mode: Simulating Google Ads OAuth callback');

        setTimeout(async () => {
          try {
            // Save mock tokens to Convex
            await saveGoogleAdsTokens({
              accessToken: 'mock_access_token_dev',
              refreshToken: 'mock_refresh_token_dev',
              expiresAt: Date.now() + (3600 * 1000), // 1 hour from now
              scope: 'https://www.googleapis.com/auth/adwords',
            });

            setStatus('success');
            hasSucceededRef.current = true;
            toast.success('Google Ads connected successfully! (Development Mode)', { id: 'google-ads-connected' });

            // Redirect after short delay
            setTimeout(() => {
              navigate('/dashboard/campaigns', { replace: true });
            }, 2000);
          } catch (error) {
            setStatus('error');
            setErrorMessage('Failed to save tokens');
            toast.error('Failed to save connection');
            console.error('Failed to save mock tokens:', error);
          }
        }, 1500);
        return;
      }

      // Production mode: Real token exchange
      try {
        const redirectUri = `${window.location.origin}/auth.google-ads`;
        const result = await exchangeCodeForTokens({ code, redirectUri });

        if (result.success) {
          // Save the tokens we got from the action
          await saveGoogleAdsTokens({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            expiresAt: Date.now() + (result.expiresIn * 1000),
            scope: result.scope,
          });

          setStatus('success');
          hasSucceededRef.current = true;
          toast.success('Google Ads connected successfully!', { id: 'google-ads-connected' });

          // Redirect after short delay
          setTimeout(() => {
            navigate('/dashboard/campaigns', { replace: true });
          }, 2000);
        } else {
          throw new Error('Token exchange failed');
        }

      } catch (error) {
        // Only update error state if we haven't already succeeded
        // (prevents showing error after successful connection)
        if (!hasSucceededRef.current) {
          setStatus('error');
          const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
          setErrorMessage(errorMsg);
          
          // Check if this is a "code already used" error (common with duplicate executions)
          if (errorMsg.includes('Bad Request') || errorMsg.includes('invalid_grant') || errorMsg.includes('code already used')) {
            toast.error('OAuth code already used. Connection may have already succeeded.');
          } else {
            toast.error('Failed to connect Google Ads');
          }
          console.error('OAuth callback error:', error);
        } else {
          // Silently ignore errors if we've already succeeded
          console.log('⚠️ OAuth callback error after successful connection (likely duplicate execution):', error);
        }
      }
    };

    handleCallback();
    // Only depend on searchParams - other dependencies are stable Convex hooks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleRetry = () => {
    navigate('/dashboard/campaigns', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
      <Card className="bg-[#1a1a1a] border-gray-800 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && <Loader2 className="w-12 h-12 text-primary animate-spin" />}
            {status === 'success' && <CheckCircle className="w-12 h-12 text-green-500" />}
            {status === 'error' && <AlertTriangle className="w-12 h-12 text-red-500" />}
          </div>
          <CardTitle className="text-white">
            {status === 'loading' && 'Connecting to Google Ads...'}
            {status === 'success' && 'Successfully Connected!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Processing your Google Ads authorization...'}
            {status === 'success' && 'Your Google Ads account has been connected. Redirecting you back to the dashboard.'}
            {status === 'error' && 'There was an issue connecting your Google Ads account.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-sm text-red-400">{errorMessage}</p>
              </div>
              <Button
                onClick={handleRetry}
                className="w-full"
                variant="outline"
              >
                Return to Dashboard
              </Button>
            </div>
          )}
          {status === 'loading' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {DEVELOPMENT_MODE ? 'Simulating connection...' : 'This may take a few seconds...'}
              </p>
            </div>
          )}
          {status === 'success' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                You'll be redirected automatically in a moment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}