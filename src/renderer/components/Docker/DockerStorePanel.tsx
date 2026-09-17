import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Input } from 'reactstrap';

import { DockerStore } from '../../data/docker';
import { modalActions } from '../../store/modal-slice';

function DockerStorePanel() {
  const dispatch = useDispatch();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState(
    DockerStore.categoriesArray[0]?.id ?? 1
  );

  const items = useMemo(() => {
    const categoriesDict = DockerStore.categoriesDict as Record<
      number,
      { id: number; name: string; items: { id: string; name: string }[] }
    >;
    const itemsDb = DockerStore.itemsDb as Record<string, any>;
    const cat = categoriesDict[categoryId];
    const ids = cat?.items?.map((i) => i.id) || [];
    let list = ids.map((id) => itemsDb[id]).filter(Boolean);
    if (query.trim().length > 1) {
      const q = query.toLowerCase();
      list = list.filter(
        (item: any) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categoryId, query]);

  function runApp(app: any) {
    dispatch(modalActions.setSelectedDockerApp(app));
    dispatch(modalActions.toggleRunDockerModal());
  }

  return (
    <div className="docker-panel docker-store-panel">
      <div className="docker-panel-toolbar docker-store-toolbar">
        <div className="docker-store-cats">
          {DockerStore.categoriesArray.map((cat: any) => (
            <button
              key={cat.id}
              type="button"
              className={`docker-store-cat${
                categoryId === cat.id ? ' is-active' : ''
              }`}
              onClick={() => setCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <Input
          type="search"
          bsSize="sm"
          placeholder="Search images…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="docker-store-search"
        />
      </div>
      <div className="docker-store-grid">
        {items.map((app: any) => (
          <div key={app.id} className="docker-store-card">
            <div className="docker-store-card-top">
              {app.icon ? (
                <img src={app.icon} alt="" className="docker-store-icon" />
              ) : (
                <div className="docker-store-icon-fallback" />
              )}
              <div>
                <div className="docker-store-name">{app.name}</div>
                <div className="docker-muted">{app.dockerImage}</div>
              </div>
            </div>
            <p className="docker-store-desc">{app.description}</p>
            <Button color="primary" size="sm" onClick={() => runApp(app)}>
              Run
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="docker-empty">No matching images in the store</div>
        )}
      </div>
    </div>
  );
}

export default DockerStorePanel;
