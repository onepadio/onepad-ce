import { Plus } from "react-bootstrap-icons";
import * as BootstrapIcons from "react-bootstrap-icons";
import WaffleMenuIcon from "../Icons/WaffleMenuIcon";
import "./PagesMenu.css";

interface PagesMenuProps {
  pages: Array<{
    id: string;
    name: string;
    icon: string;
    iconType?: "bootstrap" | "image";
  }>;
  activePage: string | null;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  isLaunchpadActive: boolean;
}

function PagesMenu({ pages, activePage, onSelectPage, onAddPage, isLaunchpadActive }: PagesMenuProps) {
  const getAppIconUrl = (iconName: string) => {
    try {
      // Use Vite's URL constructor for proper asset handling
      return new URL(`../../images/store/icon/${iconName}`, import.meta.url).href;
    } catch {
      return "";
    }
  };

  const renderIcon = (iconName: string, iconType?: "bootstrap" | "image") => {
    if (iconType === "image" && iconName) {
      const iconUrl = getAppIconUrl(iconName);
      return (
        <img 
          src={iconUrl} 
          alt="App icon"
          className="page-menu-app-icon"
          onError={(e) => {
            // Fallback to Globe icon if image fails to load
            console.error("Failed to load app icon:", iconName);
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent && !parent.querySelector('.fallback-icon')) {
              const fallback = document.createElement('span');
              fallback.className = 'fallback-icon';
              const GlobeIcon = BootstrapIcons.Globe;
              parent.innerHTML = '';
              const iconContainer = document.createElement('div');
              parent.appendChild(iconContainer);
            }
          }}
        />
      );
    }
    
    const IconComponent = (BootstrapIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent size={20} />;
    }
    return <BootstrapIcons.Globe size={20} />;
  };

  return (
    <div className="pages-menu">
      <div className="pages-menu-content">
        <div className="pages-menu-items">
          <button
            className={`page-menu-item ${activePage === "launchpad" ? "active" : ""}`}
            onClick={() => onSelectPage("launchpad")}
            title="Launchpad"
          >
            <WaffleMenuIcon size={20} />
          </button>
          {pages.map((page) => (
            <button
              key={page.id}
              className={`page-menu-item ${activePage === page.id ? "active" : ""}`}
              onClick={() => onSelectPage(page.id)}
              title={page.name}
            >
              {renderIcon(page.icon, page.iconType || "bootstrap")}
            </button>
          ))}
          <button
            className="page-menu-item add-page-btn"
            onClick={onAddPage}
            title="Add new page"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PagesMenu;
