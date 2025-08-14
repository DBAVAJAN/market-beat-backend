import { useState } from "react";
import { Search, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TopNavigationProps {
  onMenuToggle: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TopNavigation({ 
  onMenuToggle, 
  searchQuery, 
  onSearchChange 
}: TopNavigationProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-gradient-to-r from-primary to-primary/90 backdrop-blur-sm border-b border-primary/20">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Logo and Menu */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <div className="w-5 h-5 rounded bg-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-primary-foreground hidden sm:block">
              Market Beat
            </h1>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md mx-4 lg:mx-8">
          <div className={cn(
            "relative transition-all duration-300",
            isSearchFocused && "transform scale-105"
          )}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={cn(
                "pl-10 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60",
                "focus:bg-primary-foreground/20 focus:border-primary-foreground/40 focus:ring-primary-foreground/20",
                "transition-all duration-300"
              )}
            />
          </div>
        </div>

        {/* Right: User Profile */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-primary-foreground/10 hidden sm:flex"
          >
            <span className="text-sm">Welcome back!</span>
          </Button>
          
          <Avatar className="h-8 w-8 ring-2 ring-primary-foreground/20 hover:ring-primary-foreground/40 transition-all duration-300">
            <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      {/* Subtle glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent" />
    </nav>
  );
}