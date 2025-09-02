import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, Mail, User, Eye, EyeOff, CheckCircle } from 'lucide-react';

export function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'auth' | 'otp' | 'email-sent'>('auth');
  const [otpValue, setOtpValue] = useState('');
  const [phoneForOTP, setPhoneForOTP] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  
  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const { signIn, signUp, verifyOTP, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);

      if (error) {
        // Handle specific authentication errors with user-friendly messages
        let errorMessage = "Invalid email or password";
        
        if (error.message?.includes('Email not confirmed')) {
          errorMessage = "Please check your email and click the confirmation link before signing in.";
        } else if (error.message?.includes('Invalid login')) {
          errorMessage = "Invalid email or password. Please check your credentials.";
        } else if (error.message?.includes('Too many requests')) {
          errorMessage = "Too many login attempts. Please wait a moment and try again.";
        }

        toast({
          title: "Unable to sign in",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully"
      });

      navigate('/');
    } catch (error) {
      toast({
        title: "Sign in error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signUp(signupEmail, signupPassword, signupPhone, signupName);

      if (error) {
        if (error.message?.includes('User already registered')) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive"
          });
          // Pre-fill login form and switch to login tab
          setLoginEmail(signupEmail);
          setActiveTab('login');
        } else {
          toast({
            title: "Unable to create account",
            description: error.message || "Failed to create account. Please try again.",
            variant: "destructive"
          });
        }
        return;
      }

      // Show email sent confirmation
      setStep('email-sent');
      
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });

    } catch (error) {
      toast({
        title: "Creation error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await verifyOTP(phoneForOTP, otpValue);

      if (error) {
        toast({
          title: "OTP Verification Failed",
          description: error.message || "Invalid or expired OTP",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Phone Verified!",
        description: "Your account has been created successfully"
      });

      navigate('/');
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Email sent confirmation screen
  if (step === 'email-sent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription className="text-base">
              We've sent a confirmation link to <strong>{signupEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Click the link in your email to verify your account, then return here to sign in.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-2">Next steps:</p>
              <ol className="text-sm text-muted-foreground space-y-1 text-left list-decimal list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the confirmation link</li>
                <li>Return here and sign in</li>
              </ol>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              onClick={() => {
                setStep('auth');
                setLoginEmail(signupEmail); // Pre-fill login form
                setActiveTab('login');
              }}
              className="w-full"
            >
              Continue to Sign In
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setStep('auth')}
              className="w-full"
            >
              Back to Sign Up
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Verify Phone Number</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to {phoneForOTP}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleOTPVerification}>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <InputOTP 
                  value={otpValue} 
                  onChange={setOtpValue}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || otpValue.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setStep('auth')}
                className="w-full"
              >
                Back to Signup
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 rounded bg-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Market Beat</CardTitle>
          <CardDescription>
            Sign in to access your stock dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full relative z-10" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="pr-10"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full relative z-10 min-h-[2.5rem]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}