"use client";

import type { FormEvent} from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@acme/auth/client";
import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import { cn } from "~/lib/utils";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  async function handleSendOTP(e: FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Send OTP to the user's email
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      setOtpSent(true);
    } catch (err) {
      console.error(err);
      setError("Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOTP(e: FormEvent) {
    e.preventDefault();

    // Validate OTP format
    if (!otp) {
      setError("Please enter the verification code");
      return;
    }

    // Ensure OTP is exactly 6 digits
    if (!/^\d{6}$/.test(otp)) {
      setError("Verification code must be 6 digits");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Verify OTP and sign in
      let success = false;
      let errorMessage =
        "Invalid verification code. Please try again or request a new code.";

      try {
        const response = await fetch("/api/auth/sign-in/email-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp,
          }),
        });

        // Check if the response was successful (status code 2xx)
        if (response.ok) {
          success = true;
        } else {
          // If response is not ok, try to get error message
          try {
            const errorData = await response.json();
            if (errorData?.message) {
              errorMessage = errorData.message;
            }
          } catch (jsonError) {
            // If we can't parse the JSON, use the default error message
            console.error("Error parsing JSON:", jsonError);
          }

          // Set the error message immediately
          setError(errorMessage);

          // Throw an error to prevent continuing
          throw new Error(errorMessage);
        }
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        // Set the error message
        setError(errorMessage);
        throw fetchError;
      }

      // Only proceed if verification was successful
      if (success) {
        // Redirect to the homepage after successful login
        router.push("/");
        router.refresh();
      } else {
        // This should not happen, but just in case
        setError(errorMessage);
        throw new Error("Verification failed");
      }
    } catch (err: any) {
      console.error("Verification error:", err);

      // Make sure we have an error message set
      if (!error) {
        setError(
          "Invalid verification code. Please try again or request a new code.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setIsLoading(true);

      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/login",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to sign in with Google");
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          {!otpSent ? (
            <form className="p-6 md:p-8" onSubmit={handleSendOTP}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Welcome back</h1>
                  <p className="text-balance text-muted-foreground">
                    Enter your email to receive a verification code
                  </p>
                </div>
                {error && (
                  <div className="rounded bg-red-100 p-2 text-center text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send verification code"}
                </Button>

                <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                  <span className="relative z-10 bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="flex w-full items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                  >
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Sign in with Google
                </Button>

                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <a href="/signup" className="underline underline-offset-4">
                    Sign up
                  </a>
                </div>
              </div>
            </form>
          ) : (
            <form className="p-6 md:p-8" onSubmit={handleVerifyOTP}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Verify your email</h1>
                  <p className="text-balance text-muted-foreground">
                    Enter the verification code sent to {email}
                  </p>
                </div>
                {error && (
                  <div className="rounded bg-red-100 p-2 text-center text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isLoading}
                    className="text-center text-xl tracking-widest"
                    maxLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify and sign in"}
                </Button>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setOtpSent(false)}
                    disabled={isLoading}
                  >
                    Back to email
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleSendOTP}
                    disabled={isLoading}
                  >
                    Request new code
                  </Button>
                </div>
              </div>
            </form>
          )}
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
