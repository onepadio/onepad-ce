import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { memoryService, TabMemoryInfo } from "../../services/memory";
import { Cpu } from "react-bootstrap-icons";
import "./SpaceStatsWidget.css";

function SpaceStatsWidget() {
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  
  const [memoryData, setMemoryData] = useState<Map<string, number>>(new Map());
  const [spaceMemory, setSpaceMemory] = useState(0);
  const [spaceTabCount, setSpaceTabCount] = useState(0);

  const allTabs = Object.values(openTabs || {}).filter((tab: any) => tab.id !== undefined);

  const fetchMemoryData = async () => {
    try {
      const allMemory = await memoryService.getAllTabsMemory();
      
      const memMap = new Map<string, number>();
      
      allMemory.forEach((tabMem: TabMemoryInfo) => {
        if (tabMem.memory) {
          const memory = tabMem.memory.workingSetSize || 0;
          if (tabMem.url) {
            memMap.set(tabMem.url, memory);
          }
        }
      });
      
      setMemoryData(memMap);
    } catch (error) {
      console.error("Failed to fetch memory data:", error);
    }
  };

  useEffect(() => {
    fetchMemoryData();
    const fetchInterval = setInterval(fetchMemoryData, 5000);

    return () => {
      clearInterval(fetchInterval);
    };
  }, []);

  useEffect(() => {
    // Calculate memory and tab count for current space
    let totalMemory = 0;
    let tabCount = 0;

    allTabs.forEach((tab: any) => {
      // Skip xapp tabs (they don't belong to a space)
      if (tab.type === "xapp") return;
      
      // Only count tabs in the current workspace
      if (tab.workspace === workspace.id) {
        const url = tab.state?.url;
        if (url) {
          const memory = memoryData.get(url) || 0;
          totalMemory += memory;
        }
        tabCount += 1;
      }
    });

    setSpaceMemory(totalMemory);
    setSpaceTabCount(tabCount);
  }, [memoryData, allTabs, workspace.id]);

  return (
    <div className="space-stats-widget">
      <div className="stats-row">
        <div className="stat-item">
          <Cpu size={20} className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{memoryService.formatMemory(spaceMemory)}</div>
            <div className="stat-label">Memory</div>
          </div>
        </div>
        
        <div className="stat-divider"></div>
        
        <div className="stat-item">
          <span className="stat-icon">📑</span>
          <div className="stat-content">
            <div className="stat-value">{spaceTabCount}</div>
            <div className="stat-label">Tabs</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpaceStatsWidget;
