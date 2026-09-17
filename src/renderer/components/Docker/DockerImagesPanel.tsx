import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import log from 'loglevel';
import { Button } from 'reactstrap';
import { ArrowClockwise, PlayCircle, Trash } from 'react-bootstrap-icons';

import { dockerService } from '../../services/docker';
import { modalActions } from '../../store/modal-slice';

type ImageRow = {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
};

function DockerImagesPanel() {
  const dispatch = useDispatch();
  const [images, setImages] = useState<ImageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const list = await dockerService.getImages();
      setImages(list || []);
    } catch (error) {
      log.error('Failed to fetch Docker images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function removeImage(image: ImageRow) {
    const label = `${image.repository}:${image.tag}`;
    if (!window.confirm(`Remove image ${label}?`)) return;
    try {
      await dockerService.removeImage(image.id);
      refresh();
    } catch (error: any) {
      log.error('Failed to remove image:', error);
      alert('Error removing image: ' + error.message);
    }
  }

  function runImage(image: ImageRow) {
    const dockerImage =
      image.repository === '<none>'
        ? image.id
        : `${image.repository}:${image.tag === '<none>' ? 'latest' : image.tag}`;
    dispatch(
      modalActions.setSelectedDockerApp({
        name: image.repository,
        dockerImage,
        ports: [],
        environment: [],
        volumes: [],
        runCommand:
          'docker run -d <ports> <volumes> <environment> --name <name> <dockerImage>',
      })
    );
    dispatch(modalActions.toggleRunDockerModal());
  }

  if (loading) {
    return <p className="docker-panel-loading">Loading images…</p>;
  }

  return (
    <div className="docker-panel">
      <div className="docker-panel-toolbar">
        <span className="docker-panel-count">{images.length} images</span>
        <Button color="secondary" size="sm" outline onClick={refresh}>
          <ArrowClockwise className="me-1" /> Refresh
        </Button>
      </div>
      <div className="docker-table">
        <div className="docker-table-header docker-table-header-4">
          <div>Repository</div>
          <div>Tag</div>
          <div>Size</div>
          <div>Actions</div>
        </div>
        <div className="docker-table-body">
          {images.length === 0 && (
            <div className="docker-empty">No local images</div>
          )}
          {images.map((image) => (
            <div key={`${image.id}-${image.tag}`} className="docker-row">
              <div className="docker-row-main docker-row-main-4">
                <div title={image.id}>
                  {image.repository}
                  <div className="docker-muted">{image.id.slice(0, 12)}</div>
                </div>
                <div>{image.tag}</div>
                <div>{image.size}</div>
                <div className="docker-row-actions">
                  <Button
                    color="link"
                    size="sm"
                    className="p-1"
                    title="Run"
                    onClick={() => runImage(image)}
                  >
                    <PlayCircle />
                  </Button>
                  <Button
                    color="link"
                    size="sm"
                    className="p-1 text-danger"
                    title="Remove"
                    onClick={() => removeImage(image)}
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

export default DockerImagesPanel;
