import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import PageView from "./PageView";
import PagesMenu from "./PagesMenu";
import AddPageModal from "./AddPageModal";
import "./Pages.css";

export interface Page {
  id: string;
  name: string;
  url: string;
  icon: string;
  iconType?: "bootstrap" | "image"; // Type of icon: bootstrap icon name or image path
  appId?: string;
}

interface PagesProps {
  onLaunchpadActive: (isActive: boolean) => void;
}

function Pages({ onLaunchpadActive }: PagesProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [activePage, setActivePage] = useState<string | null>(null);
  const [isLaunchpadActive, setIsLaunchpadActive] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const route = useSelector((state: any) => state.session.route);
  const sessionState = useSelector((state: any) => state.session);
  const workspaceState = useSelector((state: any) => state.workspace);
  const user = useSelector((state: any) => state.user);

  useEffect(() => {
    const storedPages = localStorage.getItem("onepad-pages-"+workspace.id);
    if (storedPages) {
      try {
        const parsedPages = JSON.parse(storedPages);
        setPages(parsedPages);
      } catch (error) {
        console.error("Failed to parse stored pages:", error);
      }
    }
  }, [workspace.id]);

  useEffect(() => {
    if (pages.length > 0) {
      localStorage.setItem("onepad-pages", JSON.stringify(pages));
    }
  }, [pages]);

  const handleAddPage = (newPage: Page) => {
    const pageWithId = {
      ...newPage,
      id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setPages([...pages, pageWithId]);
    setActivePage(pageWithId.id);
    setShowAddModal(false);
  };

  const handleDeletePage = (pageId: string) => {
    const updatedPages = pages.filter((p) => p.id !== pageId);
    setPages(updatedPages);
    if (activePage === pageId) {
      setActivePage(updatedPages.length > 0 ? updatedPages[0].id : null);
    }
    if (updatedPages.length === 0) {
      localStorage.removeItem("onepad-pages");
    }
  };

  const handleSelectPage = (pageId: string) => {
    if (pageId === "launchpad") {
      setIsLaunchpadActive(true);
      setActivePage(null);
      onLaunchpadActive(true);
    } else {
      setIsLaunchpadActive(false);
      setActivePage(pageId);
      onLaunchpadActive(false);
    }
  };

  useEffect(() => {
    onLaunchpadActive(isLaunchpadActive);
  }, [isLaunchpadActive, onLaunchpadActive]);

  const getPartition = () => {
    let partition = "";
    if (route === "authenticated") {
      partition =
        sessionState.isInSession &&
        workspaceState.currentSession &&
        workspaceState.currentSession.isolated
          ? "persist:" + user.username + "_" + workspaceState.currentSession.id
          : "persist:" + user.username + "_" + workspace.id;
    } else {
      partition =
        sessionState.isInSession &&
        workspaceState.currentSession &&
        workspaceState.currentSession.isolated
          ? "persist:" + workspaceState.currentSession.id
          : "persist:" + workspace.id;
    }
    return partition;
  };

  return (
    <div className="pages-container">
      {!isLaunchpadActive && pages.length > 0 && (
        <div className="pages-views">
          {pages.map((page) => (
            <PageView
              key={page.id}
              page={page}
              isActive={activePage === page.id}
              partition={getPartition()}
              onDelete={handleDeletePage}
            />
          ))}
        </div>
      )}
      
      <PagesMenu
        pages={pages}
        activePage={isLaunchpadActive ? "launchpad" : activePage}
        onSelectPage={handleSelectPage}
        onAddPage={() => setShowAddModal(true)}
        isLaunchpadActive={isLaunchpadActive}
      />

      <AddPageModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddPage={handleAddPage}
      />
    </div>
  );
}

export default Pages;
