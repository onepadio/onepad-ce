import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { memoryService, TabMemoryInfo } from "../../services/memory";
import Modal from "../lib/Modal";
import { modalActions } from "../../store/modal-slice";
import { v4 as uuidv4 } from "uuid";
import "./MemoryDashboard.css";

function MemoryDashboard() {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: any) => state.modal.isMemoryDashboardOpen);
  const workspaces = useSelector((state: any) => state.workspace.workspaces);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const openWindows = useSelector((state: any) => state.session.openWindows);

  const [memoryData, setMemoryData] = useState<Map<string, number>>(new Map());
  const [totalMemory, setTotalMemory] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'space' | 'app'>('space');

  const allTabs = Object.values(openTabs || {}).filter((tab: any) => tab.id !== undefined);

  const toggle = () => {
    dispatch(modalActions.toggleMemoryDashboard());
  };

  const fetchMemoryData = async () => {
    try {
      setIsLoading(true);
      const allMemory = await memoryService.getAllTabsMemory();
      
      const memMap = new Map<string, number>();
      let total = 0;
      
      allMemory.forEach((tabMem: TabMemoryInfo) => {
        if (tabMem.memory) {
          const memory = tabMem.memory.workingSetSize || 0;
          total += memory;
          if (tabMem.url) {
            memMap.set(tabMem.url, memory);
          }
        }
      });
      
      setMemoryData(memMap);
      setTotalMemory(total);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch memory data:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemoryData();
    const interval = setInterval(fetchMemoryData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getTabMemory = (tab: any): number => {
    const url = tab.state?.url;
    if (!url) return 0;
    return memoryData.get(url) || 0;
  };

  const getMemoryBySpace = () => {
    const spaceMemory: { [key: string]: { memory: number; tabs: number } } = {};
    
    allTabs.forEach((tab: any) => {
      const tabMem = getTabMemory(tab);
      
      // If tab type is xapp, it doesn't belong to a space
      let workspace: string;
      if (tab.type === "xapp") {
        workspace = "others";
      } else {
        workspace = tab.workspace || "unknown";
      }
      
      if (!spaceMemory[workspace]) {
        spaceMemory[workspace] = { memory: 0, tabs: 0 };
      }
      spaceMemory[workspace].memory += tabMem;
      spaceMemory[workspace].tabs += 1;
    });
    
    return spaceMemory;
  };

  const getMemoryByApp = () => {
    const appMemory: { [key: string]: { memory: number; tabs: number } } = {};
    
    allTabs.forEach((tab: any) => {
      const tabMem = getTabMemory(tab);
      let appName = "Browser";
      
      if (tab.type === "app" || tab.type === "remote") {
        const window = openWindows[tab.window];
        appName = window?.data?.name || "Unknown App";
      }
      
      if (!appMemory[appName]) {
        appMemory[appName] = { memory: 0, tabs: 0 };
      }
      appMemory[appName].memory += tabMem;
      appMemory[appName].tabs += 1;
    });
    
    return appMemory;
  };

  const spaceMemoryUsage = getMemoryBySpace();
  const appMemoryUsage = getMemoryByApp();

  // Calculate OnePad system memory (difference between total and tabs)
  const tabsMemory = allTabs.reduce((sum, tab) => sum + getTabMemory(tab), 0);
  const systemMemory = totalMemory - tabsMemory;

  const getPercentage = (value: number) => {
    if (totalMemory === 0) return 0;
    return ((value / totalMemory) * 100).toFixed(1);
  };

  return (
    <Modal 
      id={uuidv4()} 
      heading="Memory Dashboard" 
      className="memory-dashboard-modal" 
      show={isOpen} 
      onClose={() => toggle()}
    >
      <div className="memory-dashboard">
      <div className="memory-overview">
        <div className="memory-card total-memory">
          <div className="card-header">
            <span className="card-icon">💾</span>
            <span className="card-title">Total Memory</span>
          </div>
          <div className="card-value">{memoryService.formatMemory(totalMemory)}</div>
          <div className="card-subtitle">{allTabs.length} tabs open</div>
        </div>

        <div className="memory-card system-memory">
          <div className="card-header">
            <span className="card-icon">🖥️</span>
            <span className="card-title">OnePad System</span>
          </div>
          <div className="card-value system-value">{memoryService.formatMemory(systemMemory)}</div>
          <div className="card-subtitle">UI & Background Processes</div>
        </div>

        <div className="memory-card tabs-memory">
          <div className="card-header">
            <span className="card-icon">📑</span>
            <span className="card-title">Tabs Memory</span>
          </div>
          <div className="card-value tabs-value">{memoryService.formatMemory(tabsMemory)}</div>
          <div className="card-subtitle">{allTabs.length} tabs total</div>
        </div>
      </div>

      <div className="memory-sections-grid">
        <div className="tabs-container">
          <div className="tabs-header">
            <button 
              className={`tab-button ${activeTab === 'space' ? 'active' : ''}`}
              onClick={() => setActiveTab('space')}
            >
              By Space
            </button>
            <button 
              className={`tab-button ${activeTab === 'app' ? 'active' : ''}`}
              onClick={() => setActiveTab('app')}
            >
              By App
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'space' && (
              <div className="memory-section">
                <div className="memory-list">
                  {workspaces.map((workspace) => {
                    const usage = spaceMemoryUsage[workspace.id];
                    if (!usage || usage.memory === 0) return null;
                    
                    return (
                      <div key={workspace.id} className="memory-item">
                        <div className="item-header">
                          <span className="item-name">{workspace.name}</span>
                          <span className="item-value">{memoryService.formatMemory(usage.memory)}</span>
                        </div>
                        <div className="item-meta">
                          <span>{usage.tabs} tabs</span>
                          <span>{getPercentage(usage.memory)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${getPercentage(usage.memory)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {spaceMemoryUsage['others'] && spaceMemoryUsage['others'].memory > 0 && (
                    <div key="others" className="memory-item">
                      <div className="item-header">
                        <span className="item-name">Others</span>
                        <span className="item-value">{memoryService.formatMemory(spaceMemoryUsage['others'].memory)}</span>
                      </div>
                      <div className="item-meta">
                        <span>{spaceMemoryUsage['others'].tabs} tabs</span>
                        <span>{getPercentage(spaceMemoryUsage['others'].memory)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${getPercentage(spaceMemoryUsage['others'].memory)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'app' && (
              <div className="memory-section">
                <div className="memory-list">
                  {Object.entries(appMemoryUsage)
                    .sort(([, a], [, b]) => b.memory - a.memory)
                    .map(([appName, usage]) => (
                      <div key={appName} className="memory-item">
                        <div className="item-header">
                          <span className="item-name">{appName}</span>
                          <span className="item-value">{memoryService.formatMemory(usage.memory)}</span>
                        </div>
                        <div className="item-meta">
                          <span>{usage.tabs} tabs</span>
                          <span>{getPercentage(usage.memory)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${getPercentage(usage.memory)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </Modal>
  );
}

export default MemoryDashboard;
