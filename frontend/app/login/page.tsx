"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Sun, Moon, MessageSquare, Mail } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/user-api";

type LoginStep = "email" | "otp";

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, token, login } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user && token) {
      router.push("/chat");
    }
  }, [user, token, router]);

  const isValidNTUEmail = (email: string) => {
    return (
      email.endsWith("@e.ntu.edu.sg") && email.length > "@e.ntu.edu.sg".length
    );
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNTUEmail(email)) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        toast.error("Failed to send OTP", {
          description: error.message,
        });
      } else {
        setStep("otp");
        toast.success("OTP sent", {
          description: `OTP sent to ${email}`,
        });
      }
    } catch (error) {
      toast.error("Network error", {
        description: "Please check your connection and try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when 6th digit is entered
    if (value && index === 5) {
      const finalOtp = newOtp.join("");
      if (finalOtp.length === 6) {
        // Auto-submit after a brief delay to show the last digit
        setTimeout(() => {
          handleOtpVerification(finalOtp);
        }, 100);
      }
    }
  };

  // Extract OTP verification logic into separate function
  const handleOtpVerification = async (otpCode: string) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "email",
      });

      if (error) {
        toast.error("Invalid OTP", {
          description: "Please check your code and try again.",
        });
        setOtp(["", "", "", "", "", ""]);
        // Focus the first OTP input after clearing
        setTimeout(() => {
          const firstInput = document.getElementById("otp-0");
          firstInput?.focus();
        }, 100);
      } else if (data.user) {
        // Call backend user management to check/create user
        try {
          const userData = await loginUser(email);

          // Generate a mock JWT token (in real app, this comes from your backend)
          const mockToken = `educhat_token_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          // Login user with persistent token and role info
          login(email, mockToken);

          toast.success("Login successful", {
            description: `Welcome to EduChat!`,
          });
        } catch (error) {
          toast.error("User management error", {
            description: "Failed to process user login",
          });
        }
      }
    } catch (error) {
      toast.error("Network error", {
        description: "Please check your connection and try again",
      });
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        const firstInput = document.getElementById("otp-0");
        firstInput?.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) return;
    await handleOtpVerification(otpCode);
  };

  const handleUseAnotherEmail = () => {
    setStep("email");
    setEmail("");
    setOtp(["", "", "", "", "", ""]);
  };

  // Don't render if already logged in (will redirect)
  if (user && token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header with theme toggle */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
        </div>

        <Card className="shadow-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your NTU email"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Button
                  type="submit"
                  className={`w-full py-4 text-lg font-medium transition-all duration-200 rounded-sm ${
                    isValidNTUEmail(email) && !isLoading
                      ? "bg-blue-600 hover:bg-blue-700 dark:bg-gray-600 dark:hover:bg-gray-500 text-white"
                      : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={!isValidNTUEmail(email) || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending OTP...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Mail className="w-4 h-5 mr-2" />
                      Get OTP
                    </div>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                    Enter the 6-digit code sent to {email}
                  </p>
                  <div className="flex space-x-2 justify-center">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-12 text-center text-lg font-semibold bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                      />
                    ))}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-gray-600 dark:hover:bg-gray-500 text-white py-3 text-lg font-medium transition-all duration-200"
                  disabled={otp.join("").length !== 6 || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 p-0"
                    onClick={handleUseAnotherEmail}
                  >
                    Use a different email
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
