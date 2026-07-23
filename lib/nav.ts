export interface NavItem {
  label: string;
  href: string;
  kind?: "link" | "signout";
}

export function computeActiveNavIndex(items: NavItem[], pathname: string): number {
  const matchLength = (href: string) => {
    if (href === "#") return -1;
    if (href === "/") return pathname === "/" ? href.length : -1;
    if (pathname === href || pathname.startsWith(`${href}/`)) return href.length;
    return -1;
  };

  let bestIndex = -1;
  let bestLength = -1;
  items.forEach((item, index) => {
    const length = matchLength(item.href);
    if (length > bestLength) {
      bestLength = length;
      bestIndex = index;
    }
  });
  return bestIndex;
}
