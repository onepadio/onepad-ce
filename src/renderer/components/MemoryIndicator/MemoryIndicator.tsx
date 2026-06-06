import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Button } from "reactstrap";
import { Cpu } from "react-bootstrap-icons";
import { memoryService } from "../../services/memory";
import { modalActions } from "../../store/modal-slice";
import { utilityAppsActions } from "../../store/utility-slice";
import { musicPlayerActions } from "../../store/musicplayer-slice";
import { chatActions } from "../../store/chat-slice";
import "./MemoryIndicator.css";

function MemoryIndicator() {
  const dispatch = useDispatch();
  const [totalMemory, setTotalMemory] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMemoryData = async () => {
    try {
      setIsLoading(true);
      const allMemory = await memoryService.getAllTabsMemory();
      
      let total = 0;
      allMemory.forEach((tabMem) => {
        if (tabMem.memory) {
          total += tabMem.memory.workingSetSize || 0;
        }
      });
      
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

  const handleClick = () => {
    dispatch(modalActions.toggleMemoryDashboard());
  };

  const getMemoryColor = () => {
    const mb = totalMemory / 1024;
    if (mb > 500) return "text-danger";
    if (mb > 300) return "text-warning";
    return "text-success";
  };

  return (
    <Button
      color="dark"
      className="memory-indicator-btn"
      onClick={handleClick}
      title="Click to open Memory Dashboard"
    >
      <div className="d-flex align-items-center justify-content-center">
        <Cpu color="white" size={16} className="me-1" />
        <span className={`memory-text ${getMemoryColor()}`}>
          {isLoading ? "..." : memoryService.formatMemory(totalMemory)}
        </span>
      </div>
    </Button>
  );
}

export default MemoryIndicator;
