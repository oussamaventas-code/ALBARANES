/**
 * Layout principal de la aplicación — GS AUTOBAT
 *
 * Sidebar de escritorio + barra inferior de navegación en móvil.
 * Envuelve todas las páginas autenticadas mediante <Outlet />.
 */
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  Building2,
  Wrench,
  LogOut,
  Moon,
  Sun,
  Truck,
  PhoneCall,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ROL_CONFIG, cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'oficina', 'repartidor'] },
  { to: '/albaranes/nuevo', label: 'Nuevo albarán', icon: PlusCircle, roles: ['admin', 'oficina', 'repartidor'] },
  { to: '/albaranes', label: 'Albaranes', icon: FileText, roles: ['admin', 'oficina', 'repartidor'] },
  { to: '/call-center', label: 'Búsqueda rápida', icon: PhoneCall, roles: ['admin', 'oficina'] },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users, roles: ['admin'] },
  { to: '/admin/delegaciones', label: 'Delegaciones', icon: MapPin, roles: ['admin'] },
  { to: '/admin/clientes', label: 'Clientes', icon: Building2, roles: ['admin', 'oficina'] },
  { to: '/admin/talleres', label: 'Talleres', icon: Wrench, roles: ['admin', 'oficina'] },
];

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const rol = profile?.rol ?? 'repartidor';
  const items = NAV_ITEMS.filter((item) => item.roles.includes(rol));
  // Barra inferior móvil: priorizar la acción más usada (nuevo albarán) en el centro
  const mobileItems = items.slice(0, 4);

  const initials = profile?.nombre
    ?.split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar de escritorio */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
          <Truck className="size-6 text-sidebar-primary" />
          <span className="font-bold text-lg">GS AUTOBAT</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                )
              }
            >
              <item.icon className="size-4.5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground" onClick={() => signOut()}>
            <LogOut className="size-4.5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-between px-4 sm:px-6 bg-card/60 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2 md:hidden">
            <Truck className="size-5 text-primary" />
            <span className="font-bold">GS AUTOBAT</span>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
              {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-medium">{profile?.nombre}</p>
                  <p className="text-xs text-muted-foreground font-normal">{ROL_CONFIG[rol].label} · {profile?.codigo}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  <LogOut className="size-4 mr-2" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Barra de navegación inferior móvil */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t flex items-center justify-around h-16 px-1">
        {mobileItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="size-5" />
            {item.label === 'Nuevo albarán' ? 'Nuevo' : item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
