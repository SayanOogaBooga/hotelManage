"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  BedDouble, 
  FileText, 
  LogOut,
  Leaf,
  History,
  Menu,
  X,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Rooms", href: "/dashboard/rooms", icon: BedDouble },
  { name: "Create Memo", href: "/dashboard/billing", icon: FileText },
  { name: "Bookings", href: "/dashboard/bookings", icon: History },
  { name: "Register", href: "/dashboard/register", icon: BookOpen },
];

function SidebarContent({ 
  pathname, 
  onClose 
}: { 
  pathname: string, 
  onClose?: () => void 
}) {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/");
  };

  return (
    <>
      <div className="p-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
            <Leaf size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 leading-tight">Heaven Valley</h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Management</p>
          </div>
        </div>
        {/* Close button for mobile only */}
        {onClose && (
          <button className="md:hidden text-slate-500 p-1 hover:bg-slate-100 rounded-lg transition-all cursor-pointer hover:scale-110 active:scale-95" onClick={onClose}>
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href} onClick={onClose}>
              <span className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden group cursor-pointer hover:-translate-y-0.5 active:translate-y-0",
                isActive 
                  ? "text-primary bg-primary/5" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 border-l-4 border-primary rounded-xl hidden md:block"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={18} className="relative z-10" />
                <span className="relative z-10">{item.name}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 shadow-sm flex-col no-print sticky top-0 h-screen">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile Sidebar Overlay Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            key="mobile-drawer-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 md:hidden no-print pointer-events-auto"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside 
            key="mobile-drawer-sidebar"
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 flex flex-col md:hidden no-print pointer-events-auto"
          >
            <SidebarContent pathname={pathname} onClose={() => setIsMobileMenuOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30 no-print shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Leaf size={18} strokeWidth={2} />
            </div>
            <span className="font-bold text-slate-800 text-sm">Heaven Valley</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer hover:scale-110 active:scale-95">
            <Menu size={20} />
          </button>
        </div>

        <div className="fixed top-0 right-0 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl pointer-events-none" />
        <div className="p-4 md:p-8 relative z-10 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
