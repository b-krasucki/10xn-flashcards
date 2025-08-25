import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { OverlayLoader } from "./OverlayLoader";
import { toast } from "@/lib/utils/toast";
import { supabaseClient } from "@/db/supabase.client";

// Dynamiczna walidacja w zależności od trybu (logowanie/rejestracja)
const createAuthSchema = (isLogin: boolean) => {
  const baseSchema = z.object({
    email: z.string().min(1, "Adres e-mail jest wymagany").email("Nieprawidłowy format e-mail"),
    password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków").max(100, "Hasło jest za długie"),
  });

  if (isLogin) {
    return baseSchema;
  }

  // Dla rejestracji dodajemy pole confirmPassword z walidacją
  return baseSchema
    .extend({
      confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Hasła nie są identyczne",
      path: ["confirmPassword"],
    });
};

interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

interface AuthFormProps {
  onAuthSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
    reset,
  } = useForm<AuthFormData>({
    resolver: zodResolver(createAuthSchema(isLogin)),
    mode: "onBlur",
  });

  React.useEffect(() => {
    // Resetuj formularz przy zmianie trybu (logowanie/rejestracja)
    reset();
    setError(null);
    setFocus("email");
  }, [setFocus, isLogin, reset]);

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      let result;

      if (isLogin) {
        // Login with Supabase
        result = await supabaseClient.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
      } else {
        // Register with Supabase
        result = await supabaseClient.auth.signUp({
          email: data.email,
          password: data.password,
        });
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Check if email confirmation is required for new registrations
      if (!isLogin && result.data.user && !result.data.user.email_confirmed_at) {
        toast({
          title: "Sprawdź swoją skrzynkę pocztową",
          description: "Wysłaliśmy link potwierdzający na Twój adres e-mail",
          variant: "success",
        });
        // Switch to login mode after successful registration
        setIsLogin(true);
        return;
      }

      // Set session cookies for both login and successful registration
      if (result.data.session) {
        const { access_token, refresh_token } = result.data.session;

        // Set cookies for session persistence
        document.cookie = `sb-access-token=${encodeURIComponent(access_token)}; path=/; max-age=3600; SameSite=Strict; Secure`;
        document.cookie = `sb-refresh-token=${encodeURIComponent(refresh_token)}; path=/; max-age=604800; SameSite=Strict; Secure`;
      }

      toast({
        title: "Sukces",
        description: isLogin ? "Zalogowano pomyślnie" : "Konto zostało utworzone i zalogowano automatycznie",
        variant: "success",
      });

      if (onAuthSuccess) {
        onAuthSuccess();
      } else {
        // Redirect to dashboard for both login and registration
        window.location.href = "/";
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
      setError(errorMessage);

      toast({
        title: "Błąd",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* App Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img src="/app-icon.png" alt="10xn Flashcards" className="h-16 w-16 rounded-2xl shadow-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              10xn Flashcards
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Ucz się efektywnie z fiszkami</p>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">{isLogin ? "Zaloguj się" : "Utwórz konto"}</CardTitle>
            <CardDescription className="text-center">
              {isLogin
                ? "Wprowadź swoje dane, aby zalogować się do konta"
                : "Wprowadź swoje dane, aby utworzyć nowe konto"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adres e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="twoj@email.com"
                  {...register("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Hasło</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Pole potwierdzenia hasła - tylko dla rejestracji */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    aria-invalid={errors.confirmPassword ? "true" : "false"}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  />
                  {errors.confirmPassword && (
                    <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <Alert variant="destructive" role="alert">
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                aria-label={isLogin ? "Zaloguj się do konta" : "Utwórz nowe konto"}
              >
                {isLogin ? "Zaloguj się" : "Utwórz konto"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin((prev) => !prev)}
                className="text-sm cursor-pointer text-[#d3a9fa] underline-offset-4 hover:underline bg-transparent border-none p-2"
                disabled={isLoading}
              >
                {isLogin ? "Nie masz konta? Zarejestruj się" : "Masz już konto? Zaloguj się"}
              </button>
            </div>
          </CardContent>
        </Card>
        <OverlayLoader isVisible={isLoading} />
      </div>
    </div>
  );
};
