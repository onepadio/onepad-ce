import { useEffect, useState } from "react";
import isElectron from "is-electron";
import { X } from "react-bootstrap-icons";
import "./PageView.css";

interface PageViewProps {
  page: {
    id: string;
    name: string;
    url: string;
    icon: string;
  };
  isActive: boolean;
  partition: string;
  onDelete: (pageId: string) => void;
}

function PageView({ page, isActive, partition, onDelete }: PageViewProps) {
  const [webview, setWebView] = useState<any>(null);
  const webViewId = `page-webview-${page.id}`;

  useEffect(() => {
    if (!isElectron()) {
      const iframeElement = document.getElementById(webViewId);
      if (iframeElement) {
        setWebView(iframeElement);
      }
      return;
    }

    const webviewElement = document.getElementById(webViewId);
    if (webviewElement) {
      setWebView(webviewElement);
    }
  }, [webViewId]);

  const renderWebView = () => {
    if (!isElectron()) {
      return (
        <iframe
          id={webViewId}
          className="page-webview"
          src={page.url}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation"
          title={page.name}
        />
      );
    }

    return (
      <webview
        id={webViewId}
        className="page-webview"
        src={page.url}
        // @ts-expect-error
        autosize="on"
        // @ts-expect-error
        nodeintegration="false"
        // @ts-expect-error
        allowpopups="true"
        partition={partition}
      />
    );
  };

  return (
    <div className={`page-view ${isActive ? "active" : ""}`}>
      <div className="page-backdrop"></div>
      <div className="page-content">
        <div className="page-header">
          <span className="page-title">{page.name}</span>
          <button
            className="page-delete-btn"
            onClick={() => onDelete(page.id)}
            title="Delete page"
          >
            <X size={16} />
          </button>
        </div>
        {renderWebView()}
      </div>
    </div>
  );
}

export default PageView;
