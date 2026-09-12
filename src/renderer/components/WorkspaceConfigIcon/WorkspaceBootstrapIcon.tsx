import * as BootstrapIcons from "react-bootstrap-icons";
import "./WorkspaceBootstrapIcon.css";

export const WORKSPACE_ICON_LIST = [
  "Folder",
  "Briefcase",
  "HouseFill",
  "Building",
  "Laptop",
  "People",
  "Person",
  "Globe",
  "ChatDots",
  "Envelope",
  "Calendar",
  "FileText",
  "Journal",
  "Book",
  "Bookmark",
  "Star",
  "Heart",
  "Bell",
  "Gear",
  "Tools",
  "Code",
  "Terminal",
  "Cloud",
  "Clouds",
  "Database",
  "Server",
  "Shield",
  "Lock",
  "Key",
  "Cart",
  "CreditCard",
  "Wallet",
  "GraphUp",
  "BarChart",
  "PieChart",
  "Kanban",
  "ListTask",
  "Clipboard",
  "Camera",
  "Image",
  "Film",
  "MusicNoteBeamed",
  "Play",
  "Controller",
  "Palette",
  "Brush",
  "Pencil",
  "Lightbulb",
  "Rocket",
  "Trophy",
  "Flag",
  "Map",
  "GeoAlt",
  "Telephone",
  "Phone",
  "Link",
  "Box",
  "Archive",
  "Inbox",
  "Search",
  "Tag",
  "Tags",
  "Clock",
  "Alarm",
  "Lightning",
  "Fire",
  "CupHot",
  "EmojiSmile",
];

export function getBootstrapIconComponent(iconName?: string) {
  if (iconName && (BootstrapIcons as any)[iconName]) {
    return (BootstrapIcons as any)[iconName];
  }
  return BootstrapIcons.Folder;
}

export function WorkspaceBootstrapIcon({
  name,
  size = 20,
  color = "currentColor",
  className,
}: {
  name?: string;
  size?: number;
  color?: string;
  className?: string;
}) {
  const IconComponent = getBootstrapIconComponent(name);
  return <IconComponent size={size} color={color} className={className} />;
}

export function WorkspaceBootstrapIconBadge({
  name,
  size = 32,
  iconSize,
  backgroundColor,
  className = "",
  onClick,
}: {
  name?: string;
  size?: number;
  iconSize?: number;
  backgroundColor?: string;
  className?: string;
  onClick?: () => void;
}) {
  const resolvedIconSize = iconSize ?? Math.round(size * 0.55);
  return (
    <div
      className={`workspace-bootstrap-icon-badge ${className}`}
      style={{
        width: size,
        height: size,
        ...(backgroundColor ? { backgroundColor } : {}),
      }}
      onClick={onClick}
    >
      <WorkspaceBootstrapIcon name={name} size={resolvedIconSize} color="white" />
    </div>
  );
}
