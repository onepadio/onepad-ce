import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { memoryService, TabMemoryInfo, MemoryDataPoint } from "../../services/memory";
import { SpaceService } from "../../services/space";
import Modal from "../lib/Modal";
import { modalActions } from "../../store/modal-slice";
import { v4 as uuidv4 } from "uuid";
import { PauseCircle } from "react-bootstrap-icons";
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
  const [memoryHistory, setMemoryHistory] = useState<MemoryDataPoint[]>([]);

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

  const updateMemoryHistory = () => {
    const history = memoryService.getMemoryHistory();
    setMemoryHistory(history);
  };

  useEffect(() => {
    // Fetch current memory data
    fetchMemoryData();
    const fetchInterval = setInterval(fetchMemoryData, 5000);

    // Update history from service
    updateMemoryHistory();
    const historyInterval = setInterval(updateMemoryHistory, 5000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(historyInterval);
    };
  }, []);

  const getTabMemory = (tab: any): number => {
    const url = tab.state?.url;
    if (!url) return 0;
    return memoryData.get(url) || 0;
  };

  const renderMemoryGraph = () => {
    if (memoryHistory.length === 0) {
      return (
        <div className="memory-graph-placeholder">
          <span>Collecting data...</span>
        </div>
      );
    }

    const width = 600;
    const height = 200;
    const padding = { top: 20, right: 40, bottom: 30, left: 60 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    // Find min and max values for scaling
    const maxMemory = Math.max(...memoryHistory.map(d => d.totalMemory));
    const minMemory = 0;

    // Create path for total memory line
    const createPath = (dataPoints: MemoryDataPoint[], getValue: (d: MemoryDataPoint) => number) => {
      if (dataPoints.length === 0) return "";
      
      const points = dataPoints.map((point, index) => {
        const x = padding.left + (index / (dataPoints.length - 1 || 1)) * graphWidth;
        const y = padding.top + graphHeight - ((getValue(point) - minMemory) / (maxMemory - minMemory || 1)) * graphHeight;
        return `${x},${y}`;
      });

      return `M ${points.join(" L ")}`;
    };

    const totalPath = createPath(memoryHistory, d => d.totalMemory);
    const systemPath = createPath(memoryHistory, d => d.systemMemory);
    const tabsPath = createPath(memoryHistory, d => d.tabsMemory);

    // Format time labels
    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Get labels for x-axis (show first, middle, and last)
    const timeLabels = memoryHistory.length > 0 ? [
      { x: padding.left, label: formatTime(memoryHistory[0].timestamp) },
      { 
        x: padding.left + graphWidth / 2, 
        label: memoryHistory.length > 1 ? formatTime(memoryHistory[Math.floor(memoryHistory.length / 2)].timestamp) : "" 
      },
      { x: padding.left + graphWidth, label: formatTime(memoryHistory[memoryHistory.length - 1].timestamp) }
    ] : [];

    return (
      <div className="memory-graph-container">
        <div className="memory-graph-header">
          <h3>Memory Usage (Last 24h)</h3>
          <div className="memory-graph-legend">
            <div className="legend-item">
              <span className="legend-color total"></span>
              <span>Total</span>
            </div>
            <div className="legend-item">
              <span className="legend-color tabs"></span>
              <span>Tabs</span>
            </div>
            <div className="legend-item">
              <span className="legend-color system"></span>
              <span>System</span>
            </div>
          </div>
        </div>
        <svg width={width} height={height} className="memory-graph">
          {/* Y-axis labels */}
          <text x={padding.left - 10} y={padding.top} textAnchor="end" className="axis-label">
            {memoryService.formatMemory(maxMemory)}
          </text>
          <text x={padding.left - 10} y={padding.top + graphHeight / 2} textAnchor="end" className="axis-label">
            {memoryService.formatMemory(maxMemory / 2)}
          </text>
          <text x={padding.left - 10} y={padding.top + graphHeight} textAnchor="end" className="axis-label">
            {memoryService.formatMemory(minMemory)}
          </text>

          {/* Grid lines */}
          <line 
            x1={padding.left} 
            y1={padding.top} 
            x2={padding.left + graphWidth} 
            y2={padding.top} 
            className="grid-line"
          />
          <line 
            x1={padding.left} 
            y1={padding.top + graphHeight / 2} 
            x2={padding.left + graphWidth} 
            y2={padding.top + graphHeight / 2} 
            className="grid-line"
          />
          <line 
            x1={padding.left} 
            y1={padding.top + graphHeight} 
            x2={padding.left + graphWidth} 
            y2={padding.top + graphHeight} 
            className="grid-line"
          />

          {/* Memory lines */}
          <path d={totalPath} className="memory-line total" fill="none" strokeWidth="2" />
          <path d={tabsPath} className="memory-line tabs" fill="none" strokeWidth="2" />
          <path d={systemPath} className="memory-line system" fill="none" strokeWidth="2" />

          {/* X-axis labels */}
          {timeLabels.map((label, index) => (
            <text 
              key={index}
              x={label.x} 
              y={height - 10} 
              textAnchor="middle" 
              className="axis-label"
            >
              {label.label}
            </text>
          ))}
        </svg>
      </div>
    );
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

  const pauseSpace = (workspaceId: string) => {
    SpaceService.pauseSpace(workspaceId, openTabs, openWindows, dispatch);
  };

  const spaceMemoryUsage = getMemoryBySpace();
  const appMemoryUsage = getMemoryByApp();

  // Calculate OnePad system memory (difference between total and tabs)
  const tabsMemory = allTabs.reduce((sum: number, tab: any) => sum + getTabMemory(tab), 0);
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

      {renderMemoryGraph()}

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
                  {workspaces.map((workspace: any) => {
                    const usage = spaceMemoryUsage[workspace.id];
                    if (!usage || usage.memory === 0) return null;
                    
                    return (
                      <div key={workspace.id} className="memory-item">
                        <div className="item-header">
                          <div className="item-header-left">
                            <span className="item-name">{workspace.name}</span>
                            <button 
                              className="pause-space-button"
                              onClick={() => pauseSpace(workspace.id)}
                              title="Pause all apps in this space"
                            >
                              <PauseCircle size={16} />
                            </button>
                          </div>
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
