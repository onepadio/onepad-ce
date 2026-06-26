import { useState, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Label, FormGroup } from "reactstrap";
import * as BootstrapIcons from "react-bootstrap-icons";
import { Page } from "./Pages";
import "./AddPageModal.css";

interface AddPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPage: (page: Page) => void;
}

interface AppData {
  id: string;
  name: string;
  url: string;
  icon?: string;
}

const iconList = [
  "Globe",
  "HouseFill",
  "Calendar",
  "ChatDots",
  "Envelope",
  "FileText",
  "Folder",
  "Gear",
  "Heart",
  "Star",
  "Bell",
  "Camera",
  "Cart",
  "Clock",
  "Cloud",
  "Code",
  "CreditCard",
  "Download",
  "Film",
  "GraphUp",
  "Image",
  "Link",
  "Map",
  "Music",
  "People",
  "Phone",
  "Play",
  "Search",
  "Shield",
  "Tag",
  "Tools",
  "Trash",
  "Trophy",
  "Upload",
  "Wallet",
];

function AddPageModal({ isOpen, onClose, onAddPage }: AddPageModalProps) {
  const [mode, setMode] = useState<"url" | "app">("url");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Globe");
  const [selectedIconType, setSelectedIconType] = useState<"bootstrap" | "image">("bootstrap");
  const [selectedApp, setSelectedApp] = useState<AppData | null>(null);
  const [apps, setApps] = useState<AppData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      import("../../data/store").then((storeModule) => {
        const appsData: AppData[] = [];
        
        if (storeModule.categoriesDict) {
          Object.values(storeModule.categoriesDict).forEach((category: any) => {
            if (category.items) {
              category.items.forEach((item: any) => {
                const appDetails = (storeModule as any).itemsDb?.[item.id];
                if (appDetails) {
                  appsData.push({
                    id: item.id,
                    name: item.name,
                    url: appDetails.login || appDetails.website || "",
                    icon: appDetails.icon || "",
                  });
                }
              });
            }
          });
        }
        
        const uniqueApps = Array.from(
          new Map(appsData.map(app => [app.id, app])).values()
        );
        
        setApps(uniqueApps.sort((a, b) => a.name.localeCompare(b.name)));
      });
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (mode === "url" && name && url) {
      onAddPage({
        id: "",
        name,
        url,
        icon: selectedIcon,
        iconType: selectedIconType,
      });
      resetForm();
    } else if (mode === "app" && selectedApp) {
      onAddPage({
        id: "",
        name: selectedApp.name,
        url: selectedApp.url,
        icon: selectedIcon,
        iconType: selectedIconType,
        appId: selectedApp.id,
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setMode("url");
    setName("");
    setUrl("");
    setSelectedIcon("Globe");
    setSelectedIconType("bootstrap");
    setSelectedApp(null);
    setSearchTerm("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (BootstrapIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent size={20} />;
    }
    return <BootstrapIcons.Globe size={20} />;
  };

  const filteredApps = apps.filter((app) =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} toggle={handleClose} size="lg" className="add-page-modal">
      <ModalHeader toggle={handleClose}>Add New Page</ModalHeader>
      <ModalBody>
        <div className="mode-selector mb-4">
          <Button
            color={mode === "url" ? "primary" : "secondary"}
            onClick={() => setMode("url")}
            className="me-2"
          >
            Custom URL
          </Button>
          <Button
            color={mode === "app" ? "primary" : "secondary"}
            onClick={() => setMode("app")}
          >
            Select App
          </Button>
        </div>

        {mode === "url" && (
          <>
            <FormGroup>
              <Label for="pageName">Page Name</Label>
              <Input
                type="text"
                id="pageName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter page name"
              />
            </FormGroup>
            <FormGroup>
              <Label for="pageUrl">URL</Label>
              <Input
                type="url"
                id="pageUrl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </FormGroup>
          </>
        )}

        {mode === "app" && (
          <FormGroup>
            <Label for="appSearch">Search Apps</Label>
            <Input
              type="text"
              id="appSearch"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for an app..."
            />
            <div className="apps-list mt-3">
              {filteredApps.slice(0, 20).map((app) => (
                <div
                  key={app.id}
                  className={`app-item ${selectedApp?.id === app.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedApp(app);
                    // Auto-select app icon if available
                    if (app.icon) {
                      setSelectedIcon(app.icon);
                      setSelectedIconType("image");
                    }
                  }}
                >
                  <span className="app-name">{app.name}</span>
                </div>
              ))}
              {filteredApps.length === 0 && (
                <div className="no-apps">No apps found</div>
              )}
            </div>
          </FormGroup>
        )}

        <FormGroup>
          <Label>
            Icon {mode === "app" && selectedApp && selectedIconType === "image" && (
              <span className="text-muted ms-2">(Using app icon - click below to change)</span>
            )}
          </Label>
          {selectedIconType === "image" && selectedIcon && (
            <div className="current-app-icon mb-3">
              <img 
                src={new URL(`../../images/store/icon/${selectedIcon}`, import.meta.url).href}
                alt="App icon" 
                className="app-icon-preview"
                onError={(e) => {
                  // Fallback if image fails to load
                  console.error("Failed to load app icon preview:", selectedIcon);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="ms-2">{selectedApp?.name || "App"} icon</span>
            </div>
          )}
          <div className="icon-grid">
            {iconList.map((iconName) => (
              <button
                key={iconName}
                type="button"
                className={`icon-button ${selectedIcon === iconName && selectedIconType === "bootstrap" ? "selected" : ""}`}
                onClick={() => {
                  setSelectedIcon(iconName);
                  setSelectedIconType("bootstrap");
                }}
              >
                {renderIcon(iconName)}
              </button>
            ))}
          </div>
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          color="primary"
          onClick={handleSubmit}
          disabled={
            mode === "url"
              ? !name || !url
              : !selectedApp
          }
        >
          Add Page
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default AddPageModal;
