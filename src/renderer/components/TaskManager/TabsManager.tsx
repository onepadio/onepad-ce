import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ListGroup, ListGroupItem, Button, Collapse, Form, FormGroup, Label, Input } from "reactstrap";
import { XCircle, ChevronDown, ChevronRight } from "react-bootstrap-icons";
import log from "loglevel";
import "./TabsManager.css";
import { windowServiceActions } from "../../store/window-service-slice";
import { memoryService, TabMemoryInfo } from "../../services/memory";

function TabsManager() {
  const dispatch = useDispatch();

  const workspaces = useSelector((state: any) => state.workspace.workspaces);

  const openTabs = useSelector((state: any) => state.session.openTabs);

  const openWindows = useSelector((state: any) => state.session.openWindows);

  // Get all tabs from all windows

  const allTabs = Object.values(openTabs || {}).filter((tab: any) => tab.id !== undefined);

  const [workspaceNames, setWorkspaceNames] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedWorkspace, setSelectedWorkspace] = useState("all");
  const [selectedApp, setSelectedApp] = useState("all");
  const [memoryData, setMemoryData] = useState<Map<string, number>>(new Map());
  const [totalMemory, setTotalMemory] = useState(0);
  const [isLoadingMemory, setIsLoadingMemory] = useState(false);

  // Get unique app names
  const uniqueApps = Array.from(new Set(allTabs.map((tab: any) => {
    if (tab.type === "app" || tab.type === "remote") {
      const window = openWindows[tab.window];
      return window?.data?.name || "Unknown App";
    }
    return "Browser";
  })));

  // Filter tabs based on selected workspace and app
  const filteredTabs = allTabs.filter((tab: any) => {
    if (selectedWorkspace !== "all" && tab.workspace !== selectedWorkspace) {
      return false;
    }
    
    if (selectedApp !== "all") {
      if (tab.type === "app" || tab.type === "remote") {
        const window = openWindows[tab.window];
        const appName = window?.data?.name || "Unknown App";
        if (appName !== selectedApp) return false;
      } else {
        if (selectedApp !== "Browser") return false;
      }
    }

    return true;
  });

  const toggleRow = (tabId) => {
    setExpandedRows(prev => ({
      ...prev,
      [tabId]: !prev[tabId]
    }));
  };

  const closeTab = (tabId) => {
    const confirmed = window.confirm("Are you sure you want to close this tab?");
    if (!confirmed) return;

    try {
      dispatch(windowServiceActions.closeTab(tabId));
    } catch (error) {
      log.error("Failed to close tab:", error);
      alert("Error closing tab: " + error.message);
    }
  };

  useEffect(() => {
    log.debug("Workspaces:", workspaces);
    const workspaceNames = {};
    workspaces.forEach((workspace) => {
      workspaceNames[workspace.id] = workspace.name;
    });
    setWorkspaceNames(workspaceNames);
  }, [workspaces]);

  // Fetch memory data
  const fetchMemoryData = async () => {
    try {
      setIsLoadingMemory(true);
      const allMemory = await memoryService.getAllTabsMemory();
      
      log.debug("Memory data received:", allMemory);
      
      // Create a map of tab URL/title to memory
      const memMap = new Map<string, number>();
      let total = 0;
      
      allMemory.forEach((tabMem: TabMemoryInfo) => {
        if (tabMem.memory) {
          // Use workingSetSize (in KB) - this is the actual RAM usage
          const memory = tabMem.memory.workingSetSize || 0;
          total += memory;
          // Store by URL as key
          if (tabMem.url) {
            memMap.set(tabMem.url, memory);
          }
        }
      });
      
      log.debug("Memory map created:", { mapSize: memMap.size, total });
      
      setMemoryData(memMap);
      setTotalMemory(total);
      setIsLoadingMemory(false);
    } catch (error) {
      log.error("Failed to fetch memory data:", error);
      setIsLoadingMemory(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMemoryData();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchMemoryData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getTabMemory = (tab: any): number => {
    const url = tab.state?.url;
    if (!url) return 0;
    return memoryData.get(url) || 0;
  };

  return (
    <div className="d-flex flex-column w-100 h-100 mt-2 ml-2 mr-2">
      <div className="d-flex justify-content-end align-items-center mb-3 mr-2">
        <Form className="d-flex align-items-center">
          <FormGroup className="mb-0 d-flex align-items-center me-3">
            <Label className="me-2 mb-0">Space:</Label>
            <Input
              type="select"
              value={selectedWorkspace}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              className="workspace-select"
            >
              <option value="all">All Spaces</option>
              {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>)}
            </Input>
          </FormGroup>
          <FormGroup className="mb-0 d-flex align-items-center">
            <Label className="me-2 mb-0">App:</Label>
            <Input
              type="select"
              value={selectedApp}
              onChange={(e) => setSelectedApp(e.target.value)}
              className="workspace-select"
            >
              <option value="all">All Apps</option>
              {uniqueApps.map((app) => <option key={app} value={app}>
                {app}
              </option>)}
            </Input>
          </FormGroup>
        </Form>
      </div>

      <div className="tabs-table">
        <div className="d-flex w-100 justify-content-between border-bottom border-secondary">
          <div className="d-flex justify-content-center align-items-center task-table-header expand-column"></div>
          <div className="d-flex justify-content-center align-items-center task-table-header">
            Space
          </div>
          <div className="d-flex justify-content-center align-items-center task-table-header">App</div>
          <div className="d-flex justify-content-center align-items-center task-table-header">Active</div>
          <div className="d-flex justify-content-center align-items-center task-table-header">
            Title
          </div>
          <div className="d-flex justify-content-center align-items-center task-table-header">Memory</div>
          <div className="d-flex justify-content-center align-items-center task-table-header"></div>
        </div>

        <div className="tabs-table-body">
          {filteredTabs.map((tab: any) => {
            const tabMemory = getTabMemory(tab);
            const appName = (tab.type === "app" || tab.type === "remote") && openWindows[tab.window]?.data?.name 
              ? openWindows[tab.window].data.name 
              : "Browser";
            
            return (
              <div key={tab.id} className="tab-row">
                <div className="d-flex w-100 justify-content-between mt-2">
                  <div className="d-flex justify-content-center align-items-center expand-column">
                    <Button
                      color="link"
                      className="p-0"
                      onClick={() => toggleRow(tab.id)}
                    >
                      {expandedRows[tab.id] ? <ChevronDown /> : <ChevronRight />}
                    </Button>
                  </div>
                  <div className="d-flex justify-content-center align-items-center task-table-column">
                    {workspaceNames[tab.workspace] ? workspaceNames[tab.workspace] : "N/A"}
                  </div>
                  <div className="d-flex justify-content-center align-items-center task-table-column">
                    {appName}
                  </div>
                  <div className="d-flex justify-content-center align-items-center task-table-column">
                    {tab.sleeping ? "No" : "Yes"}
                  </div>
                  <div className="d-flex justify-content-start align-items-center task-table-column">
                    {(tab.type === "app" || tab.type === "remote") && openWindows[tab.window] && openWindows[tab.window].data
                        ? (
                          <img width={24} src={"./images/store/icon/"+openWindows[tab.window].data.icon} alt="App Icon" />
                        )
                        : (
                          <img width={24} src={tab.state.icon} alt="Browser Icon" />
                        )}
                      <span className="ml-2">
                        {(tab.state.title || "Untitled").length > 50
                          ? `${(tab.state.title || "Untitled").substring(0, 50)}...`
                          : (tab.state.title || "Untitled")}
                      </span>
                  </div>
                  <div className="d-flex justify-content-center align-items-center task-table-column">
                    <span className={tabMemory > 102400 ? "text-warning" : ""}>
                      {memoryService.formatMemory(tabMemory)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-center align-items-center task-table-column">
                    <button
                      className="btn btn-link text-danger p-0"
                      onClick={() => closeTab(tab.id)}
                    >
                      <XCircle />
                    </button>
                  </div>
                </div>

                <Collapse isOpen={expandedRows[tab.id]}>
                  <div className="container-details p-3">
                    <div className="detail-row">
                      <strong>URL:</strong> {tab.state?.url || "about:blank"}
                    </div>
                    <div className="detail-row">
                      <strong>Memory Usage:</strong> {memoryService.formatMemory(tabMemory)}
                    </div>
                    <div className="detail-row">
                      <strong>Tab Type:</strong> {tab.type || "browser"}
                    </div>
                  </div>
                </Collapse>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TabsManager;
