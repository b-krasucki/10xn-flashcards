import React, { useState } from "react";
import { 
  Menu, 
  X, 
  Home, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  User 
} from "lucide-react";

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MobileMenuProps {
  currentPath?: string;
}

const navigationItems: NavigationItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/generate", label: "Generowanie", icon: Sparkles },
  { href: "/flashcards", label: "Moje talie", icon: BookOpen },
  { href: "/learn", label: "Sesja powtórek", icon: GraduationCap },
  { href: "/profile", label: "Profil", icon: User }
];

export const MobileMenu: React.FC<MobileMenuProps> = ({ currentPath = '/' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="md:hidden">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={toggleMenu}
        className="p-2 text-white hover:text-white/80 hover:bg-white/10 rounded-lg transition-all duration-200"
        aria-label={isOpen ? "Zamknij menu" : "Otwórz menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeMenu}
            aria-hidden="true"
          />
          
          {/* Menu panel */}
          <div className="fixed top-14 left-0 right-0 bg-black/90 backdrop-blur-lg border-b border-white/10 z-50 animate-in slide-in-from-top duration-200">
            <nav className="container py-4 space-y-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentPath === item.href || 
                  (item.href !== '/' && currentPath.startsWith(item.href));
                  
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'text-white bg-white/20 border-l-4 border-blue-400' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <IconComponent className={`h-5 w-5 ${isActive ? 'text-blue-300' : ''}`} />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto h-2 w-2 bg-blue-400 rounded-full animate-pulse"></div>
                    )}
                  </a>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </div>
  );
};
