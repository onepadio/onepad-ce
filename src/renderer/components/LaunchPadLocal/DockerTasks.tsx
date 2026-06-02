import React, { useEffect, useState } from "react";
import log from "loglevel";
import { v4 as uuidv4 } from "uuid";
import { useDispatch, useSelector } from "react-redux";
import { Spinner } from "reactstrap";

import { dockerService } from "../../services/docker";
import { DockerStore } from "../../data/docker";
import DockerLaunchIcon from "../DockerLaunchIcon/DockerLaunchIcon";
import AddDockerButton from "../AddDockerButton/AddDockerButton";

function DockerTasks() {
  const dispatch = useDispatch();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState("");

  useEffect(() => {
    refresh();
  }, [version]);

  async function refresh() {
    try {
      log.debug("Fetching Docker containers...");
      const containerList = await dockerService.getContainers(true);
      
      // Transform container data to match our needs
      const processedContainers = containerList
        .filter((container: any) => container && container.id) // Only process containers with valid IDs
        .map((container: any) => {
          // Safely get container name
          const containerName = container.names && container.names.length > 0 
            ? container.names[0].replace(/^\//, '')
            : (container.id ? container.id.substring(0, 12) : 'unknown'); // Fallback with ID check

          const containerId = container.id || uuidv4(); // Fallback to generated ID if none exists

          return {
            id: containerId,
            name: containerName,
            status: container.state || 'unknown',
            image: container.image || 'unknown',
            storeData: DockerStore.itemsDb?.[container.Image] || {
              id: containerId,
              name: containerName,
              app: container.Image || 'unknown',
              category: "Docker",
              description: `Docker container running ${container.Image || 'unknown image'}`,
              icon: "docker.png",
            }
          };
        });

      log.debug("Processed containers:", processedContainers);
      setContainers(processedContainers);
      setLoading(false);

      // Refresh list every 5 seconds
      setTimeout(() => {
        setVersion(uuidv4());
      }, 5000);
    } catch (error) {
      log.error("Failed to fetch Docker containers:", error);
      setLoading(false);
    }
  }

  return (
    <>
      {loading ? (
        <div className="d-flex flex-fluid justify-content-center">
          <Spinner color="primary" />
        </div>
      ) : (
        <>
          {containers.map((container) => (
            <DockerLaunchIcon
              key={uuidv4()}
              containerId={container.id}
              id={container.id}
              data={container.storeData}
              name={container.name}
              icon={container.storeData.icon}
              status={container.status}
              isInEditMode={false}
              showControls={true}
            />
          ))}
          <AddDockerButton />
        </>
      )}
    </>
  );
}

export default DockerTasks; 