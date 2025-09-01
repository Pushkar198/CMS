import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

const DUMMY_ACCOUNTS = [
  { username: 'admin', role: 'admin', description: 'Full access to all features' },
  { username: 'maker', role: 'maker', description: 'Access to dashboard, page flow, media library' },
  { username: 'checker', role: 'checker', description: 'Maker access + approval dashboard' },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isLoggingIn, loginError } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [customUsername, setCustomUsername] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [useCustomLogin, setUseCustomLogin] = useState(false);

  const handleRoleLogin = (roleAccount: typeof DUMMY_ACCOUNTS[0]) => {
    login({
      username: roleAccount.username,
      password: 'password123', // Default password for all dummy accounts
    }, {
      onSuccess: () => {
        setLocation('/dashboard');
      },
    });
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUsername || !customPassword) return;

    login({
      username: customUsername,
      password: customPassword,
    }, {
      onSuccess: () => {
        setLocation('/dashboard');
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to AI Website Builder</CardTitle>
          <CardDescription>
            Choose a test account or enter custom credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loginError && (
            <Alert variant="destructive">
              <AlertDescription>{loginError.message}</AlertDescription>
            </Alert>
          )}

          {!useCustomLogin ? (
            <>
              <div className="space-y-3">
                <Label>Quick Login (Test Accounts)</Label>
                {DUMMY_ACCOUNTS.map((account) => (
                  <div
                    key={account.username}
                    className="border rounded-lg p-3 space-y-2 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleRoleLogin(account)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium capitalize">{account.username}</div>
                      <Button 
                        size="sm" 
                        disabled={isLoggingIn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRoleLogin(account);
                        }}
                      >
                        {isLoggingIn ? 'Logging in...' : 'Login'}
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">{account.description}</div>
                    <div className="text-xs text-gray-500">Password: password123</div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setUseCustomLogin(true)}
                  className="text-sm"
                >
                  Use Custom Credentials
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="flex-1"
                >
                  {isLoggingIn ? 'Logging in...' : 'Login'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUseCustomLogin(false)}
                >
                  Back
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}