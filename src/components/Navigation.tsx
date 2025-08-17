import React from "react";
import { 
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

interface NavigationProps {
  currentPath?: string;
}

const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: Home
  },
  {
    href: "/generate",
    label: "Generowanie",
    icon: Sparkles
  },
  {
    href: "/flashcards",
    label: "Moje talie",
    icon: BookOpen
  },
  {
    href: "/learn",
    label: "Sesja powtórek",
    icon: GraduationCap
  },
  {
    href: "/profile",
    label: "Profil",
    icon: User
  }
];

export const Navigation: React.FC<NavigationProps> = ({ currentPath = '/' }) => {
  
  return (
    <nav className="hidden md:flex items-center space-x-1">
      {navigationItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = currentPath === item.href || 
          (item.href !== '/' && currentPath.startsWith(item.href));
        
        return (
          <a
            key={item.href}
            href={item.href}
            className={`group relative flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg border ${
              isActive 
                ? 'text-white bg-white/15 border-white/30 shadow-lg shadow-white/10' 
                : 'text-white/80 border-transparent hover:text-white hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-white/5'
            }`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <IconComponent className={`h-4 w-4 transition-transform duration-200 ${
              isActive ? 'text-blue-300 scale-110' : 'group-hover:scale-110'
            }`} />
            <span className="relative">
              {item.label}
              {/* Subtle underline effect */}
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 ${
                isActive ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </span>
            {/* Active indicator dot */}
            {isActive && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
          </a>
        );
      })}
    </nav>
  );
};
