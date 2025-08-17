import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabaseClient } from "@/db/supabase.client";
import { toast } from "@/lib/utils/toast";

interface UserData {
  email: string;
}

export const UserMenu: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user");

        if (!response.ok) {
          if (response.status === 401) {
            // User not authenticated - this is normal for UserMenu

            return;
          }
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const userData = await response.json();

        setUserData({
          email: userData.email || "user@example.com",
        });
      } catch {
        // Silent error handling for user data fetch
        // Silent error handling - UserMenu should gracefully handle auth errors
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const getInitials = (email: string) => {
    return email.split("@")[0].substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      // Clear session cookies
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure";
      document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure";

      toast({
        title: "Wylogowano",
        description: "Zostałeś pomyślnie wylogowany",
        variant: "success",
      });

      // Redirect to auth page
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1000);
    } catch {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas wylogowywania",
        variant: "destructive",
      });
    }
  };

  const handleProfileClick = () => {
    window.location.href = "/profile";
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-full bg-gray-300 animate-pulse"></div>
      </div>
    );
  }

  if (!userData) {
    // If no user data, don't render anything (user is not logged in)
    return null;
  }

  return (
    <div className="flex items-center space-x-3">
      {/* User Avatar with Profile Link */}
      <Button
        variant="ghost"
        className="relative h-8 w-8 rounded-full p-0 hover:bg-white/10 cursor-pointer"
        onClick={handleProfileClick}
        title={`Profil użytkownika: ${userData.email}`}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src="" alt={`Avatar użytkownika ${userData.email}`} />
          <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {getInitials(userData.email)}
          </AvatarFallback>
        </Avatar>
      </Button>

      {/* Logout Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="text-white hover:bg-white/10 hover:text-white cursor-pointer"
        title="Wyloguj się"
      >
        <LogOut className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Wyloguj</span>
      </Button>
    </div>
  );
};
