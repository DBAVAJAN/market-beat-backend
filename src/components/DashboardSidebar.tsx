import { useState } from "react";
import { Building2, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import type { Tables } from "@/integrations/supabase/types";

type Company = Tables<"companies">;

interface DashboardSidebarProps {
  companies: Company[];
  selectedCompany: Company | null;
  onCompanySelect: (company: Company) => void;
  isLoading: boolean;
}

export function DashboardSidebar({
  companies,
  selectedCompany,
  onCompanySelect,
  isLoading
}: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border z-50 transition-all duration-300 ease-in-out",
          "lg:static lg:z-auto",
          isCollapsed ? "-translate-x-full lg:w-16" : "w-80 lg:w-80"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className={cn("flex items-center gap-2", isCollapsed && "lg:justify-center lg:w-full")}>
            <Building2 className="h-6 w-6 text-sidebar-primary" />
            {!isCollapsed && (
              <h2 className="text-lg font-semibold text-sidebar-foreground">Stock Market</h2>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Company List */}
        <div className="flex-1 overflow-y-auto p-2">
          {!isCollapsed && (
            <div className="mb-3 px-2">
              <h3 className="text-sm font-medium text-sidebar-foreground/70 mb-2">
                Companies ({companies.length})
              </h3>
              <Separator className="bg-sidebar-border" />
            </div>
          )}
          
          <div className="space-y-1">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-sidebar-accent rounded-md animate-pulse" />
                ))}
              </div>
            ) : (
              companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => onCompanySelect(company)}
                  className={cn(
                    "w-full p-3 rounded-md text-left transition-all duration-200 hover:bg-sidebar-accent group",
                    selectedCompany?.id === company.id && "bg-sidebar-accent border border-sidebar-primary/20",
                    isCollapsed && "lg:p-2 lg:flex lg:justify-center"
                  )}
                >
                  <div className={cn("flex items-center gap-3", isCollapsed && "lg:flex-col lg:gap-1")}>
                    <div className={cn(
                      "w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0",
                      isCollapsed && "lg:w-6 lg:h-6 lg:text-xs"
                    )}>
                      {company.symbol.charAt(0)}
                    </div>
                    
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="secondary" 
                            className="text-xs font-mono bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/20"
                          >
                            {company.symbol}
                          </Badge>
                        </div>
                        <p className="text-sm text-sidebar-foreground font-medium mt-1 truncate">
                          {company.name}
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile toggle button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCollapsed(false)}
        className={cn(
          "fixed top-4 left-4 z-40 lg:hidden",
          !isCollapsed && "hidden"
        )}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Desktop collapse toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "fixed top-4 z-40 hidden lg:flex",
          isCollapsed ? "left-20" : "left-72"
        )}
      >
        <Menu className="h-4 w-4" />
      </Button>
    </>
  );
}