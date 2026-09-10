import React from "react";

type DeviceMode = "desktop" | "phone" | "tablet";

type DevicePreviewShellProps = {
  deviceMode: DeviceMode;
  shellId: string;
  isLandscape: boolean;
  onRotate: () => void;
  children: React.ReactNode;
};

function DevicePreviewShell({
  deviceMode,
  shellId,
  isLandscape,
  onRotate,
  children,
}: DevicePreviewShellProps) {
  if (deviceMode === "desktop") {
    return <>{children}</>;
  }

  return (
    <div
      id={shellId}
      className={`device-preview-shell device-${deviceMode}${isLandscape ? " landscape" : ""}`}
    >
      <button
        type="button"
        className="device-rotate-button"
        onClick={onRotate}
        title="Rotate"
        aria-label="Rotate device"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"
          />
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
        </svg>
      </button>
      {children}
    </div>
  );
}

export default DevicePreviewShell;
