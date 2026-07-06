import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CloudLightning,
  Bug,
  Leaf,
  Tractor,
  TrendingUp,
  LayoutGrid,
  ClipboardList,
  Users,
  MapPin,
  AlertTriangle,
  Database,
  Brain,
  BarChart2,
  Search,
  FileText,
  LayoutDashboard,
  Globe,
  BarChart,
  Map,
  Activity,
  Target,
  Gauge,
  BookOpen,
  Settings,
  Moon,
  Sun,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sprout,
  Thermometer,
  CalendarDays,
  X,
  Radar,
  Satellite,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ElementType };

const ROLE_NAV: Record<string, NavItem[]> = {
  farmer: [
    { label: "Weather Alerts",         href: "/weather-alerts",        icon: CloudLightning },
    { label: "Pest & Disease Warnings", href: "/pest-disease-warnings", icon: Bug },
    { label: "Crop Recommendations",   href: "/crop-recommendations",  icon: Sprout },
    { label: "Crop Monitoring",        href: "/crop-monitoring",       icon: Radar },
    { label: "Satellite Map",          href: "/sentinel-map",          icon: Satellite },
    { label: "My Farm",                href: "/my-farm",               icon: Tractor },
    { label: "Market Prices",          href: "/market-prices",         icon: TrendingUp },
  ],
  "extension worker": [
    { label: "Farm Management",   href: "/farm-management",   icon: LayoutGrid },
    { label: "Advisory Creation", href: "/advisory-creation", icon: ClipboardList },
    { label: "Farmer Directory",  href: "/farmer-directory",  icon: Users },
    { label: "Field Visits",      href: "/field-visits",      icon: MapPin },
    { label: "Crop Monitoring",   href: "/crop-monitoring",   icon: Radar },
    { label: "Satellite Map",     href: "/sentinel-map",      icon: Satellite },
    { label: "Alerts & Reports",  href: "/alerts-reports",    icon: AlertTriangle },
  ],
  researcher: [
    { label: "Data Hub",             href: "/data-hub",             icon: Database },
    { label: "AI Models",            href: "/ai-models",            icon: Brain },
    { label: "Crop Monitoring",      href: "/crop-monitoring",      icon: Radar },
    { label: "Satellite Map",        href: "/sentinel-map",         icon: Satellite },
    { label: "Statistical Analysis", href: "/statistical-analysis", icon: BarChart2 },
    { label: "Custom Queries",       href: "/custom-queries",       icon: Search },
    { label: "Research Outputs",     href: "/research-outputs",     icon: FileText },
    { label: "Weather Data",         href: "/weather-data",         icon: Thermometer },
  ],
  "maaif official": [
    { label: "Policy Dashboard",       href: "/policy-dashboard",       icon: LayoutDashboard },
    { label: "National Statistics",    href: "/national-statistics",    icon: Globe },
    { label: "Crop Monitoring",        href: "/crop-monitoring",        icon: Radar },
    { label: "Satellite Map",          href: "/sentinel-map",           icon: Satellite },
    { label: "Production Reports",     href: "/production-reports",     icon: BarChart },
    { label: "Pest & Disease Reports", href: "/pest-disease-reports",   icon: Bug },
    { label: "District Maps",          href: "/district-maps",          icon: Map },
  ],
  "development partner": [
    { label: "Monitoring Dashboard", href: "/monitoring-dashboard", icon: Activity },
    { label: "Impact Assessment",    href: "/impact-assessment",    icon: Target },
    { label: "Programme KPIs",       href: "/programme-kpis",       icon: Gauge },
    { label: "Beneficiary Tracking", href: "/beneficiary-tracking", icon: Users },
    { label: "Satellite Map",        href: "/sentinel-map",         icon: Satellite },
  ],
  "development partner": [
    { label: "Monitoring Dashboard", href: "/monitoring-dashboard", icon: Activity },
    { label: "Impact Assessment", href: "/impact-assessment", icon: Target },
    { label: "Programme KPIs", href: "/programme-kpis", icon: Gauge },
    { label: "Beneficiary Tracking", href: "/beneficiary-tracking", icon: Users },
  ],
  "public visitor": [
    { label: "Public Maps", href: "/public-maps", icon: Map },
    { label: "Agricultural Information", href: "/agricultural-information", icon: BookOpen },
    { label: "Seasonal Calendars", href: "/seasonal-calendars", icon: CalendarDays },
    { label: "Public Reports", href: "/public-reports", icon: FileText },
  ],
};

const ROLE_DISPLAY: Record<string, string> = {
  farmer: "Farmer",
  "extension worker": "Extension Worker",
  researcher: "Researcher",
  "maaif official": "MAAIF Official",
  "development partner": "Development Partner",
  "public visitor": "Public Visitor",
};

const APP_NAME    = "Uganda DDSS";
const APP_TAGLINE = "Climate-Smart Agriculture";

function NavContent({
  isCollapsed,
  onNavClick,
}: {
  isCollapsed: boolean;
  onNavClick?: () => void;
}) {
  const location = useLocation();
  const { themeMode, setThemeMode } = useTheme();
  const { user, logout } = useAuth();
  const isDark = themeMode === "dark";

  const normalizedRole = (user?.role ?? "").toLowerCase();
  const navItems = ROLE_NAV[normalizedRole] ?? [];

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  const navLinkClass = (href: string) =>
    cn(
      "group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 py-2.5",
      isCollapsed ? "justify-center px-2 mx-1" : "px-3 mx-2",
      isActive(href)
        ? "bg-primary/15 text-primary shadow-sm border border-primary/20"
        : "text-muted-foreground hover:bg-white/8 hover:text-foreground"
    );

  const bottomBtnClass = cn(
    "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 py-2.5 w-full",
    isCollapsed ? "justify-center px-2 mx-1" : "px-3 mx-2",
    "text-muted-foreground hover:bg-white/8 hover:text-foreground"
  );

  return (
    <>
      {/* Section label */}
      {!isCollapsed && navItems.length > 0 && (
        <div className="px-5 pt-4 pb-1">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50 select-none">
            Menu
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-1 space-y-0.5 scrollbar-none">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            title={isCollapsed ? item.label : undefined}
            onClick={onNavClick}
            className={navLinkClass(item.href)}
          >
            <item.icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            {!isCollapsed && (
              <span className="truncate leading-none">{item.label}</span>
            )}
            {!isCollapsed && isActive(item.href) && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="pt-2 pb-3 space-y-0.5 border-t border-border/30">
        {/* Theme toggle */}
        <button
          onClick={() => setThemeMode(isDark ? "light" : "dark")}
          title={isCollapsed ? (isDark ? "Light Mode" : "Dark Mode") : undefined}
          className={bottomBtnClass}
        >
          {isDark ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          {!isCollapsed && (
            <span className="truncate">{isDark ? "Light Mode" : "Dark Mode"}</span>
          )}
        </button>

        {/* Settings */}
        <Link
          to="/settings"
          title={isCollapsed ? "Settings" : undefined}
          onClick={onNavClick}
          className={navLinkClass("/settings")}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="truncate">Settings</span>}
        </Link>

        {/* Logout */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              title={isCollapsed ? "Logout" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 py-2.5 w-full",
                isCollapsed ? "justify-center px-2 mx-1" : "px-3 mx-2",
                "text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">Logout</span>}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of Uganda DDSS?
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={logout}>Sign Out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Avatar footer — expanded */}
        {!isCollapsed && user && (
          <div className="mx-2 mt-2 px-3 py-3 rounded-xl bg-white/5 border border-border/20 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-sm font-bold ring-2 ring-primary/30">
              {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {user.name ?? user.email}
              </p>
              <p className="text-xs text-primary/80 truncate mt-0.5">
                {ROLE_DISPLAY[normalizedRole] ?? normalizedRole}
              </p>
            </div>
          </div>
        )}

        {/* Collapsed avatar dot */}
        {isCollapsed && user && (
          <div className="mx-auto mt-2 h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold ring-2 ring-primary/30">
            {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </>
  );
}

// Mobile-only top header (hamburger + logo + Sheet drawer)
export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden sticky top-0 z-40 flex items-center gap-3 px-4 h-14 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <button
        onClick={() => setOpen(true)}
        title="Open menu"
        className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <Leaf className="h-4 w-4 text-primary" />
        </div>
        <span className="font-heading font-bold text-foreground text-base leading-tight">
          {APP_NAME}
          <span className="text-primary ml-1 text-xs font-sans font-normal opacity-70">
            {APP_TAGLINE}
          </span>
        </span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-card/95 backdrop-blur-2xl border-border/40"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="h-14 flex items-center justify-between px-4 border-b border-border/30 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Leaf className="h-4 w-4 text-primary" />
              </div>
              <span className="font-heading font-bold text-foreground text-base">
                {APP_NAME}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col h-[calc(100%-3.5rem)]">
            <NavContent isCollapsed={false} onNavClick={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Desktop-only glass panel floating shell sidebar
export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        // Hidden on mobile, flex column on desktop
        "hidden md:flex flex-col relative",
        // Floating object: margins lift it off the edges
        "m-3 mr-2 rounded-3xl",
        // Frosted glass — the shell itself reads as a single wet, lit sheet
        "backdrop-blur-2xl backdrop-saturate-150 bg-card/55",
        // Hairline outer border + soft inner ring
        "border border-border/40 ring-1 ring-inset ring-white/10",
        // Pronounced shadow for depth
        "shadow-2xl",
        // Layout
        "shrink-0 overflow-hidden",
        // Width transition
        "transition-[width] duration-300 ease-out",
        isCollapsed ? "w-16" : "w-[220px]"
      )}
    >
      {/* Bright top hairline highlight — iOS-26 / visionOS wet-glass energy */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.55) 35%, rgba(255,255,255,0.80) 50%, rgba(255,255,255,0.55) 65%, transparent 95%)",
        }}
      />
      {/* Soft inner top glow — diffuse light source on the glass surface */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 rounded-t-3xl"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.055) 0%, transparent 100%)",
        }}
      />

      {/* Logo / branding header */}
      <div
        className={cn(
          "flex items-center h-14 shrink-0 border-b border-border/30 px-4 relative z-20",
          isCollapsed ? "justify-center" : "justify-between gap-2"
        )}
      >
        {/* Logo mark */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Leaf className="h-4 w-4 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="font-heading font-bold text-foreground text-base leading-none truncate block">
                {APP_NAME}
              </span>
              <span className="text-[10px] text-primary/70 font-sans tracking-wide uppercase">
                {APP_TAGLINE}
              </span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed((c) => !c)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "h-6 w-6 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors shrink-0",
            isCollapsed && "mx-auto"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Nav + bottom — sits in normal flow above the glow overlays */}
      <div className="flex flex-col flex-1 overflow-hidden relative z-20">
        <NavContent isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}

export default Sidebar;
