import { useCallback, useEffect, useState } from 'react';
import log from 'loglevel';
import { Button } from 'reactstrap';
import { ArrowClockwise, Trash } from 'react-bootstrap-icons';

import { dockerService } from '../../services/docker';

type VolumeRow = {
  name: string;
  driver: string;
  mountpoint: string;
  scope: string;
};

function DockerVolumesPanel() {
  const [volumes, setVolumes] = useState<VolumeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const list = await dockerService.getVolumes();
      setVolumes(list || []);
    } catch (error) {
      log.error('Failed to fetch Docker volumes:', error);
      setVolumes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function removeVolume(volume: VolumeRow) {
    if (!window.confirm(`Remove volume ${volume.name}?`)) return;
    try {
      await dockerService.removeVolume(volume.name);
      refresh();
    } catch (error: any) {
      log.error('Failed to remove volume:', error);
      alert('Error removing volume: ' + error.message);
    }
  }

  if (loading) {
    return <p className="docker-panel-loading">Loading volumes…</p>;
  }

  return (
    <div className="docker-panel">
      <div className="docker-panel-toolbar">
        <span className="docker-panel-count">{volumes.length} volumes</span>
        <Button color="secondary" size="sm" outline onClick={refresh}>
          <ArrowClockwise className="me-1" /> Refresh
        </Button>
      </div>
      <div className="docker-table">
        <div className="docker-table-header docker-table-header-4">
          <div>Name</div>
          <div>Driver</div>
          <div>Scope</div>
          <div>Actions</div>
        </div>
        <div className="docker-table-body">
          {volumes.length === 0 && (
            <div className="docker-empty">No volumes</div>
          )}
          {volumes.map((volume) => (
            <div key={volume.name} className="docker-row">
              <div className="docker-row-main docker-row-main-4">
                <div title={volume.mountpoint}>
                  {volume.name}
                  {volume.mountpoint ? (
                    <div className="docker-muted">{volume.mountpoint}</div>
                  ) : null}
                </div>
                <div>{volume.driver}</div>
                <div>{volume.scope}</div>
                <div className="docker-row-actions">
                  <Button
                    color="link"
                    size="sm"
                    className="p-1 text-danger"
                    title="Remove"
                    onClick={() => removeVolume(volume)}
                  >
                    <Trash />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DockerVolumesPanel;
