import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CollectionFill, Plus, X } from 'react-bootstrap-icons';
import log from 'loglevel';

import AppService from '../../services/app';
import LinkService from '../../services/link';
import {
  activateSharedApp,
  activateSharedLink,
  hasAwakeTab,
} from '../../util/sharedApps';
import { localStorageKeyForSiteIcon } from '../../services/icon';
import { modalActions } from '../../store/modal-slice';
import defaultIcon from '../../images/default_icon.png';

import './BuiltinAppsSwitcher.css';
import './SharedAppsSwitcher.css';

type SharedItemType = 'app' | 'link';

interface SharedItem {
  id: string;
  itemType: SharedItemType;
  data?: any;
  desktop?: string;
  workspace?: string;
}

function resolveAppIcon(item: SharedItem): string {
  const iconKey = item?.data?.icon;
  const url = item?.data?.customUrl || item?.data?.startUrl || '';

  if (!iconKey) {
    return defaultIcon;
  }

  if (
    typeof iconKey === 'string' &&
    (iconKey.startsWith('data:') ||
      iconKey.startsWith('blob:') ||
      iconKey.startsWith('http'))
  ) {
    return iconKey;
  }

  try {
    const fromStorage =
      localStorage.getItem(iconKey) ||
      (url ? localStorage.getItem(localStorageKeyForSiteIcon(url)) : null);

    if (fromStorage && fromStorage.length > 0) {
      return fromStorage;
    }

    if (iconKey.length > 0) {
      return `./images/store/icon/${iconKey}`;
    }
  } catch {
    // ignore
  }

  return defaultIcon;
}

function itemLabel(item: SharedItem): string {
  if (item.itemType === 'link') {
    return item.data?.title || item.data?.name || 'Link';
  }
  return item.data?.name || item.data?.title || 'App';
}

interface SharedAppsSwitcherProps {
  open: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function SharedAppsSwitcher({
  open,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: SharedAppsSwitcherProps) {
  const dispatch = useDispatch();
  const homeWorkspaceId = useSelector(
    (state: any) => state.user.homeWorkspace
  );
  const username = useSelector((state: any) => state.user.username);
  const route = useSelector((state: any) => state.session.route);
  const isInSession = useSelector((state: any) => state.session.isInSession);
  const currentSession = useSelector(
    (state: any) => state.workspace.currentSession
  );
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );

  const [items, setItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !homeWorkspaceId) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      AppService.getAppsByWorkspaceId(homeWorkspaceId),
      LinkService.getAllByWorkspaceId(homeWorkspaceId),
    ])
      .then(([apps, links]: any[]) => {
        if (cancelled) return;
        const appItems: SharedItem[] = (Array.isArray(apps) ? apps : []).map(
          (app: any) => ({
            ...app,
            itemType: 'app' as const,
          })
        );
        const linkItems: SharedItem[] = (Array.isArray(links) ? links : []).map(
          (link: any) => ({
            ...link,
            itemType: 'link' as const,
          })
        );
        setItems([...appItems, ...linkItems]);
      })
      .catch((error) => {
        log.warn('Failed to load shared apps/links', error);
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, homeWorkspaceId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSelect(item: SharedItem) {
    if (!homeWorkspaceId) return;
    const sharedOptions = {
      homeWorkspaceId,
      openWindows,
      openTabs,
      windowTabs,
      username,
      route,
      isInSession,
      currentSession,
      dispatch,
    };
    if (item.itemType === 'link') {
      await activateSharedLink({ ...sharedOptions, linkId: item.id });
    } else {
      await activateSharedApp({ ...sharedOptions, appId: item.id });
    }
    onClose();
  }

  function handleAdd() {
    if (!homeWorkspaceId) return;
    dispatch(modalActions.setInstallTargetWorkspaceId(homeWorkspaceId));
    dispatch(modalActions.setLocation('launchpad'));
    dispatch(modalActions.openAppStore({ keepInstallTarget: true }));
    onClose();
  }

  return (
    <>
      <div
        className="builtin-apps-switcher-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="builtin-apps-switcher-panel"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="builtin-apps-switcher-panel-inner">
          <div className="builtin-apps-switcher-toolbar builtin-apps-switcher-toolbar--titled">
            <div className="builtin-apps-switcher-title-block">
              <div className="builtin-apps-switcher-title-row">
                <CollectionFill
                  className="builtin-apps-switcher-title-icon"
                  size={16}
                  aria-hidden="true"
                />
                <h2 className="builtin-apps-switcher-heading">My Apps</h2>
              </div>
              <p className="builtin-apps-switcher-subtitle">
                Available in every space
              </p>
            </div>
            <button
              type="button"
              className="builtin-apps-switcher-close"
              onClick={onClose}
              aria-label="Close my apps"
            >
              <X size={16} />
            </button>
          </div>
          <div className="builtin-apps-switcher-grid">
            {loading && (
              <div className="shared-apps-switcher-empty">Loading…</div>
            )}
            {!loading && items.length === 0 && (
              <div className="shared-apps-switcher-empty">
                No apps or links yet.
              </div>
            )}
            {!loading &&
              items.map((item) => {
                const isActive = activeWindowId === item.id;
                const isOpen = hasAwakeTab(
                  item.id,
                  openWindows,
                  openTabs,
                  windowTabs
                );
                const icon = resolveAppIcon(item);
                const label = itemLabel(item);

                return (
                  <button
                    key={`${item.itemType}-${item.id}`}
                    type="button"
                    className={`builtin-apps-switcher-tile${
                      isActive ? ' is-active' : ''
                    }${isOpen && !isActive ? ' is-open' : ''}`}
                    onClick={() => handleSelect(item)}
                  >
                    <span className="builtin-apps-switcher-icon shared-apps-switcher-app-icon">
                      <img
                        src={icon}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.src = defaultIcon;
                        }}
                      />
                    </span>
                    <span className="builtin-apps-switcher-label">{label}</span>
                  </button>
                );
              })}
            {!loading && (
              <button
                type="button"
                className="builtin-apps-switcher-tile shared-apps-switcher-add-tile"
                onClick={handleAdd}
                aria-label="Add app or link"
              >
                <span className="builtin-apps-switcher-icon shared-apps-switcher-add-icon">
                  <Plus size={28} color="white" />
                </span>
                <span className="builtin-apps-switcher-label">Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SharedAppsSwitcher;
