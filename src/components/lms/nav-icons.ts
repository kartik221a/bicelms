import {
  LayoutDashboard, BookOpen, StickyNote, FolderOpen, Award, ShoppingBag,
  User, Settings, GraduationCap, LogOut, type LucideIcon,
} from "lucide-react";

/**
 * Serializable icon registry for the student shell. Server layouts pass icon
 * KEYS (strings) — component references cannot cross the server/client
 * boundary as props — and client nav components resolve them here.
 */
export const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  "my-courses": BookOpen,
  "my-notes": StickyNote,
  "my-resources": FolderOpen,
  certificates: Award,
  orders: ShoppingBag,
  profile: User,
  settings: Settings,
  learn: GraduationCap,
  logout: LogOut,
};

export function navIcon(name: string): LucideIcon {
  return NAV_ICONS[name] ?? BookOpen;
}
