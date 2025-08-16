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

const authSchema = z.object({
  email: z.string().min(1, "Adres e-mail jest wymagany").email("Nieprawidłowy format e-mail"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków").max(100, "Hasło jest za długie"),
});

type AuthFormData = z.infer<typeof authSchema>;

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
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    mode: "onBlur",
  });

  React.useEffect(() => {
    setFocus("email");
  }, [setFocus, isLogin]);

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

      if (!isLogin && result.data.user && !result.data.user.email_confirmed_at) {
        toast({
          title: "Sprawdź swoją skrzynkę pocztową",
          description: "Wysłaliśmy link potwierdzający na Twój adres e-mail",
          variant: "success",
        });
        return;
      }

      // For login, set session cookies
      if (isLogin && result.data.session) {
        const { access_token, refresh_token } = result.data.session;
        
        // Set cookies for session persistence
        document.cookie = `sb-access-token=${encodeURIComponent(access_token)}; path=/; max-age=3600; SameSite=Strict; Secure`;
        document.cookie = `sb-refresh-token=${encodeURIComponent(refresh_token)}; path=/; max-age=604800; SameSite=Strict; Secure`;
      }

      toast({
        title: "Sukces",
        description: isLogin ? "Zalogowano pomyślnie" : "Konto zostało utworzone",
        variant: "success",
      });

      if (onAuthSuccess) {
        onAuthSuccess();
      } else {
        // Default redirect to home page
        window.location.href = '/';
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
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Zaloguj się" : "Utwórz konto"}
          </CardTitle>
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
              onClick={() => {
                setIsLogin(prev => !prev);
                setError(null);
              }}
              className="text-sm cursor-pointer text-primary underline-offset-4 hover:underline bg-transparent border-none p-2"
              disabled={isLoading}
            >
              {isLogin
                ? "Nie masz konta? Zarejestruj się"
                : "Masz już konto? Zaloguj się"}
            </button>
          </div>
        </CardContent>
      </Card>
      <OverlayLoader isVisible={isLoading} />
    </div>
  );
};
