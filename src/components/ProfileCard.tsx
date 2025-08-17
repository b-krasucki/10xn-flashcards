import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/lib/utils/toast";
import { OverlayLoader } from "./OverlayLoader";
import { supabaseClient } from "@/db/supabase.client";

interface UserProfile {
  email: string;
  created_at: string;
  total_flashcards: number;
  total_generations: number;
}

export const ProfileCard: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoadingProfile(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError || !user) {
          toast({
            title: "Błąd",
            description: "Nie można pobrać danych użytkownika",
            variant: "destructive",
          });
          return;
        }

        // Fetch user statistics
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch user stats');
        }
        
        const dashboardData = await response.json();
        
        setUserProfile({
          email: user.email || "Brak adresu e-mail",
          created_at: user.created_at || new Date().toISOString(),
          total_flashcards: dashboardData.totalFlashcards || 0,
          total_generations: dashboardData.recentGenerations?.length || 0
        });
        
      } catch (error) {
        toast({
          title: "Błąd",
          description: "Wystąpił błąd podczas pobierania profilu",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Błąd",
        description: "Hasło musi mieć co najmniej 6 znaków",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Błąd",
        description: "Hasła nie są identyczne",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update password with Supabase
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: "Sukces",
        description: "Hasło zostało zmienione",
        variant: "success",
      });
      
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch (error) {
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Wystąpił błąd podczas zmiany hasła",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      // Call real API to delete account
      const response = await fetch('/api/deleteAccount', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }
      
      toast({
        title: "Konto usunięte",
        description: "Twoje konto zostało trwale usunięte wraz ze wszystkimi danymi",
        variant: "success",
      });
      
      // Clear any remaining session data
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure';
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure';
      
      // Redirect to auth page
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
    } catch (error) {
      console.error('Account deletion error:', error);
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Wystąpił błąd podczas usuwania konta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Sign out with Supabase
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Clear session cookies
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure';
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure';
      
      toast({
        title: "Wylogowano",
        description: "Zostałeś pomyślnie wylogowany",
        variant: "success",
      });
      
      // Redirect to auth page
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas wylogowywania",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              <span>Ładowanie profilu...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <span>Nie można załadować danych profilu</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" alt={`Avatar użytkownika ${userProfile.email}`} />
              <AvatarFallback className="text-lg">
                {getInitials(userProfile.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Informacje o profilu</CardTitle>
              <CardDescription>
                Twoje dane konta i statystyki
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Adres e-mail</Label>
              <p className="text-sm font-medium mt-1">{userProfile.email}</p>
            </div>
            <div>
              <Label>Data rejestracji</Label>
              <p className="text-sm font-medium mt-1">
                {new Date(userProfile.created_at).toLocaleDateString("pl-PL")}
              </p>
            </div>
            <div>
              <Label>Liczba fiszek</Label>
              <p className="text-sm font-medium mt-1">{userProfile.total_flashcards}</p>
            </div>
            <div>
              <Label>Liczba generacji</Label>
              <p className="text-sm font-medium mt-1">{userProfile.total_generations}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Zmiana hasła</CardTitle>
          <CardDescription>
            Aktualizuj swoje hasło, aby zachować bezpieczeństwo konta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isChangingPassword ? (
            <Button onClick={() => setIsChangingPassword(true)} className="cursor-pointer">
              Zmień hasło
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nowe hasło</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Potwierdź hasło</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleChangePassword} disabled={isLoading} className="cursor-pointer">
                  Zapisz hasło
                </Button>
                <Button 
                  onClick={() => {
                    setIsChangingPassword(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  variant="outline"
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  Anuluj
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Akcje konta</CardTitle>
          <CardDescription>
            Zarządzaj swoim kontem lub wyloguj się
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button onClick={handleLogout} variant="outline" disabled={isLoading} className="cursor-pointer">
              Wyloguj się
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isLoading} className="cursor-pointer">
                  Usuń konto
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Usuń konto</AlertDialogTitle>
                  <AlertDialogDescription>
                    Czy na pewno chcesz usunąć swoje konto? Ta akcja jest nieodwracalna i 
                    spowoduje trwałe usunięcie wszystkich Twoich danych, w tym fiszek i postępów w nauce.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">Anuluj</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                  >
                    Usuń trwale
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Uwaga:</strong> Usunięcie konta spowoduje trwałą utratę wszystkich danych. 
              Ta operacja nie może być cofnięta.
            </p>
          </div>
        </CardContent>
      </Card>

      <OverlayLoader isVisible={isLoading} />
    </div>
  );
};
