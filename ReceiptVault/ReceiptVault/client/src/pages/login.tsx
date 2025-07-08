import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { googleAuth } from "@/lib/google-auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if we're returning from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      let errorMessage = "Authentication failed. Please try again.";
      switch (error) {
        case 'token_failed':
          errorMessage = "Failed to get access token. Please try signing in again.";
          break;
        case 'reauth_needed':
          errorMessage = "Please sign in again to refresh your authentication.";
          break;
        case 'code_expired':
          errorMessage = "Authorization code expired. Please try signing in again.";
          break;
        case 'no_code':
          errorMessage = "No authorization code received. Please try again.";
          break;
      }
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      // Clear the error parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code) {
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setIsLoading(true);
    try {
      await googleAuth.handleCallback(code);
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      setLocation('/');
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast({
        title: "Authentication Failed",
        description: "Please try signing in again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const authUrl = await googleAuth.getAuthUrl();
      
      // For Replit iframe environment, use direct navigation
      if (window.top !== window.self) {
        // We're in an iframe, redirect the top window
        window.top!.location.href = authUrl;
      } else {
        // Direct navigation for normal browsers
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        title: "Sign In Failed",
        description: "Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Receipt className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Receipt Manager</h1>
            <p className="text-gray-600">
              Capture and store your receipts securely in Google Drive
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Signing in...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              Having trouble? Try using a personal Google account and make sure your OAuth consent screen is set to "External" → "Testing" mode.
            </p>
            
            <p className="text-xs text-gray-500 text-center">
              By signing in, you agree to store receipts in your Google Drive account
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
