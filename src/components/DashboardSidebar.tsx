import { useState } from "react";
import { Building2, Menu, X, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Tables } from "@/integrations/supabase/types";

type Company = Tables<"companies">;

interface DashboardSidebarProps {
  companies: Company[];
  selectedCompany: Company | null;
  onCompanySelect: (company: Company) => void;
  isLoading: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  searchQuery: string;
}

export function DashboardSidebar({
  companies,
  selectedCompany,
  onCompanySelect,
  isLoading,
  isCollapsed,
  onToggle,
  searchQuery
}: DashboardSidebarProps) {
  // Filter companies based on search query
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCompanyInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  const getCompanyColor = (symbol: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-cyan-500',
      'bg-gradient-to-br from-purple-500 to-pink-500', 
      'bg-gradient-to-br from-green-500 to-emerald-500',
      'bg-gradient-to-br from-orange-500 to-red-500',
      'bg-gradient-to-br from-indigo-500 to-purple-500',
    ];
    const index = symbol.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-80"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border bg-sidebar">
          <div className={cn("flex items-center gap-3", isCollapsed && "lg:justify-center lg:w-full")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-semibold text-sidebar-foreground">Companies</h2>
                <p className="text-xs text-sidebar-foreground/60">{filteredCompanies.length} stocks</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Company List */}
        <ScrollArea className="flex-1 px-2 py-4">
          {!isCollapsed && searchQuery && (
            <div className="mb-3 px-2">
              <p className="text-sm text-sidebar-foreground/60">
                {filteredCompanies.length} result{filteredCompanies.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
              <Separator className="mt-2 bg-sidebar-border" />
            </div>
          )}
          
          <div className="space-y-1">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 bg-sidebar-accent rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              filteredCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => onCompanySelect(company)}
                  className={cn(
                    "w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-sidebar-accent hover:shadow-md group relative",
                    "hover:border-l-4 hover:border-l-primary hover:pl-5",
                    selectedCompany?.id === company.id && "bg-sidebar-accent border-l-4 border-l-primary pl-5 shadow-hover",
                    isCollapsed && "lg:p-2 lg:flex lg:justify-center lg:hover:pl-2 lg:hover:border-l-0"
                  )}
                >
                  <div className={cn("flex items-center gap-3", isCollapsed && "lg:flex-col lg:gap-1")}>
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md",
                      getCompanyColor(company.symbol),
                      isCollapsed && "lg:w-8 lg:h-8 lg:text-xs",
                      "group-hover:scale-110 transition-transform duration-200"
                    )}>
                      {getCompanyInitials(company.name)}
                    </div>
                    
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Badge 
                            variant="secondary" 
                            className="text-xs font-mono bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
                          >
                            {company.symbol}
                          </Badge>
                          {selectedCompany?.id === company.id && (
                            <div className="w-2 h-2 rounded-full bg-primary animate-glow" />
                          )}
                        </div>
                        <p className="text-sm text-sidebar-foreground font-medium truncate group-hover:text-primary transition-colors duration-200">
                          {company.name}
                        </p>
                        <p className="text-xs text-sidebar-foreground/60 mt-0.5">
                          {company.symbol} • Active
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Hover effect indicator */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-1 h-6 bg-primary rounded-full" />
                  </div>
                </button>
              ))
            )}
            
            {!isLoading && filteredCompanies.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <p className="text-sidebar-foreground/60 text-sm">No companies found</p>
                <p className="text-sidebar-foreground/40 text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-sidebar-border bg-sidebar">
            <div className="text-xs text-sidebar-foreground/60 text-center">
              Market Beat Dashboard
            </div>
          </div>
        )}
      </div>
    </>
  );
}