export interface MenuItem {
  name: string;
  href: string;
  icon: string;
}

export const AVAILABLE_ROUTES = [
  '/',
] as const;

export const MENU_ITEMS: readonly MenuItem[] = [] as const;

export const BOTTOM_ITEMS: readonly MenuItem[] = [] as const;
