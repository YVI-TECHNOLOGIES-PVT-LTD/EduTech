import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Menu,
  X,
  ChevronDown,
  GraduationCap,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_STRUCTURE, NOTIFICATIONS, EXTERNAL_URLS, SCHOOL_INFO } from "@/lib/public-constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const location = useLocation();

  const unreadCount = NOTIFICATIONS.filter((n) => n.isNew).length;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveMenu(null);
  }, [location.pathname]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Academics", href: "#", hasMenu: true, menuKey: "academics" },
    { label: "Admissions", href: "#", hasMenu: true, menuKey: "admissions" },
    { label: "Campus Life", href: "#", hasMenu: true, menuKey: "campusLife" },
    { label: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          // Force white background on form pages
          location.pathname.includes('/admissions/apply') || location.pathname.includes('/app/')
            ? "bg-white shadow-md py-2"
            : isScrolled
              ? "bg-white/95 backdrop-blur-md shadow-md py-2 lg:py-3 xl:py-4"
              : "bg-transparent py-4 lg:py-3 xl:py-6"
        )}
      >
        <div className="container-custom">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className={cn(
                "w-12 h-12 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                (location.pathname.includes('/admissions/apply') || location.pathname.includes('/app/') || isScrolled)
                  ? "bg-primary"
                  : "bg-white/20 backdrop-blur-sm"
              )}>
                <GraduationCap className={cn(
                  "w-7 h-7 lg:w-5 lg:h-5 xl:w-7 xl:h-7 transition-colors",
                  (location.pathname.includes('/admissions/apply') || location.pathname.includes('/app/') || isScrolled)
                    ? "text-gold"
                    : "text-white"
                )} />
              </div>
              <div>
                <span className={cn(
                  "font-display text-xl lg:text-lg xl:text-xl font-bold block leading-tight transition-colors whitespace-nowrap",
                  (location.pathname.includes('/admissions/apply') || location.pathname.includes('/app/') || isScrolled)
                    ? "text-primary"
                    : "text-white"
                )}>
                  {SCHOOL_INFO.name}
                </span>
                <span className={cn(
                  "text-xs tracking-wide transition-colors",
                  (location.pathname.includes('/admissions/apply') || location.pathname.includes('/app/') || isScrolled)
                    ? "text-muted-foreground"
                    : "text-white/80"
                )}>
                  Est. {SCHOOL_INFO.established}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 lg:gap-0.5 xl:gap-2">
              {navLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.hasMenu && setActiveMenu(link.menuKey!)}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  {link.hasMenu ? (
                    <button
                      className={cn(
                        "flex items-center gap-1 px-4 py-2 lg:px-2 lg:py-1.5 xl:px-4 xl:py-2 rounded-lg font-medium transition-all duration-200 lg:text-sm xl:text-base whitespace-nowrap",
                        (location.pathname.includes('/admissions/apply') || location.pathname.includes('/app/') || isScrolled)
                          ? "text-foreground/80 hover:text-foreground hover:bg-muted/50"
                          : "text-white/90 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {link.label}
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        activeMenu === link.menuKey && "rotate-180"
                      )} />
                    </button>
                  ) : (
                    <Link
                      to={link.href}
                      className={cn(
                        "px-4 py-2 lg:px-2 lg:py-1.5 xl:px-4 xl:py-2 rounded-lg font-medium transition-all duration-200 lg:text-sm xl:text-base whitespace-nowrap",
                        isActive(link.href)
                          ? (location.pathname.includes('/admissions/apply') || location.pathname.includes('/app/') || isScrolled)
                            ? "bg-muted text-primary"
                            : "bg-white/20 text-white"
                          : (location.pathname.includes('/admissions/apply') || location.pathname.includes('/app/') || isScrolled)
                            ? "text-foreground/80 hover:text-foreground hover:bg-muted/50"
                            : "text-white/90 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {link.label}
                    </Link>
                  )}

                  {/* Mega Menu */}
                  <AnimatePresence>
                    {link.hasMenu && activeMenu === link.menuKey && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 top-full pt-2"
                      >
                        <div className="bg-white rounded-xl shadow-lg border border-border p-4 min-w-[300px]">
                          <div className="space-y-1">
                            {NAV_STRUCTURE[link.menuKey as keyof typeof NAV_STRUCTURE].items.map(
                              (item) => (
                                <Link
                                  key={item.title}
                                  to={item.href}
                                  target={(item as any).external ? "_blank" : undefined}
                                  rel={(item as any).external ? "noopener noreferrer" : undefined}
                                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                                >
                                  <div className="flex-1">
                                    <div className="font-semibold text-foreground flex items-center gap-2">
                                      {item.title}
                                      {(item as any).external && (
                                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                      {item.description}
                                    </p>
                                  </div>
                                </Link>
                              )
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={cn(
                  "relative p-2 rounded-lg transition-colors",
                  (location.pathname.includes('/admissions/apply') || location.pathname.includes('/app/') || isScrolled)
                    ? "hover:bg-muted"
                    : "hover:bg-white/10"
                )}
              >
                <Bell className={cn(
                  "w-5 h-5",
                  (location.pathname.includes('/admissions/apply') || location.pathname.includes('/app/') || isScrolled)
                    ? "text-foreground"
                    : "text-white"
                )} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {/* Login Button */}
              <Link
                to={EXTERNAL_URLS.LOGIN}
                className="hidden sm:block"
              >
                <Button
                  variant={(location.pathname.includes('/admissions/apply') || location.pathname.includes('/app/') || isScrolled) ? "outline" : "heroOutline"}
                  size="sm"
                >
                  Login
                </Button>
              </Link>

              {/* Apply Now CTA */}
              <Link
                to={EXTERNAL_URLS.ADMISSION_REGISTRATION}
                className="hidden md:block"
              >
                <Button variant="cta" size="sm">
                  Apply Now
                </Button>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={cn(
                  "lg:hidden p-2 rounded-lg transition-colors",
                  isScrolled
                    ? "hover:bg-muted"
                    : "hover:bg-white/10"
                )}
              >
                {isMobileMenuOpen ? (
                  <X className={cn("w-6 h-6", isScrolled ? "text-foreground" : "text-white")} />
                ) : (
                  <Menu className={cn("w-6 h-6", isScrolled ? "text-foreground" : "text-white")} />
                )}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Notification Drawer */}
      <AnimatePresence>
        {isNotificationOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => setIsNotificationOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b bg-primary text-primary-foreground">
                  <div>
                    <h2 className="font-display text-xl font-bold">Notifications</h2>
                    <p className="text-sm text-primary-foreground/80">
                      {unreadCount} new notifications
                    </p>
                  </div>
                  <button
                    onClick={() => setIsNotificationOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="p-4 space-y-3">
                    {NOTIFICATIONS.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 rounded-xl border transition-all hover:shadow-md",
                          notification.isNew
                            ? "bg-gold/5 border-gold/30"
                            : "bg-white border-border"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                              notification.isNew ? "bg-gold" : "bg-muted"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-foreground">
                                {notification.title}
                              </span>
                              {notification.isNew && (
                                <span className="text-xs bg-gold text-navy px-2 py-0.5 rounded-full font-medium">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {notification.date}
                              </span>
                              {"ctaText" in notification && "ctaLink" in notification && (
                                <Link
                                  to={notification.ctaLink}
                                  onClick={() => setIsNotificationOpen(false)}
                                >
                                  <Button variant="cta" size="sm">
                                    {notification.ctaText}
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-[72px] left-0 right-0 bg-white shadow-lg z-40 lg:hidden overflow-hidden"
          >
            <div className="container-custom py-4">
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <div key={link.label}>
                    {link.hasMenu ? (
                      <div>
                        <button
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === link.menuKey ? null : link.menuKey!
                            )
                          }
                          className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-muted font-medium"
                        >
                          {link.label}
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform",
                              activeMenu === link.menuKey && "rotate-180"
                            )}
                          />
                        </button>
                        <AnimatePresence>
                          {activeMenu === link.menuKey && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pl-4 space-y-1 overflow-hidden"
                            >
                              {NAV_STRUCTURE[
                                link.menuKey as keyof typeof NAV_STRUCTURE
                              ].items.map((item) => (
                                <Link
                                  key={item.title}
                                  to={item.href}
                                  target={(item as any).external ? "_blank" : undefined}
                                  className="block px-4 py-2 rounded-lg hover:bg-muted text-sm"
                                >
                                  {item.title}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        to={link.href}
                        className={cn(
                          "block px-4 py-3 rounded-lg font-medium transition-colors",
                          isActive(link.href)
                            ? "bg-muted text-primary"
                            : "hover:bg-muted"
                        )}
                      >
                        {link.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t space-y-2">
                <Link
                  to={EXTERNAL_URLS.LOGIN}
                  className="block"
                >
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link
                  to={EXTERNAL_URLS.ADMISSION_REGISTRATION}
                  className="block"
                >
                  <Button variant="cta" className="w-full">
                    Apply Now
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
