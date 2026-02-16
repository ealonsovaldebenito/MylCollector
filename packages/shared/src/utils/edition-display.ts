/**
 * Removes trailing year patterns like " (2000)" or " (2024)" from edition names.
 * Doc reference: User requirement — don't show year next to edition names.
 */
export function editionDisplayName(name: string): string {
  return name.replace(/\s*\(\d{4}\)\s*$/, '').trim();
}
