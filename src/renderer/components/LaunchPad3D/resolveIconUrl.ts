import { localStorageKeyForSiteIcon } from "../../services/icon";
import defaultIcon from "../../images/default_icon.png";

/**
 * Resolve an app/link icon the same way LaunchIcon / LinkIcon do.
 */
export function resolveIconUrl(
  icon: string | null | undefined,
  url?: string | null
): string {
  let iconData = icon || "";

  if (
    iconData &&
    (iconData.startsWith("data:") ||
      iconData.startsWith("blob:") ||
      iconData.startsWith("http"))
  ) {
    return iconData;
  }

  if (iconData) {
    const fromStore =
      localStorage.getItem(iconData) ||
      (url ? localStorage.getItem(localStorageKeyForSiteIcon(url)) : null);
    if (fromStore) return fromStore;
    if (iconData.length > 0) {
      return `./images/store/icon/${iconData}`;
    }
  }

  if (url) {
    const fromUrl = localStorage.getItem(localStorageKeyForSiteIcon(url));
    if (fromUrl) return fromUrl;
  }

  return defaultIcon;
}
