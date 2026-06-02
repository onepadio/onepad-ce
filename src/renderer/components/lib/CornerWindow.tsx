import clsx from "clsx"
import { useEffect } from "react"
import { X } from "react-bootstrap-icons"
import { CircularButton } from "./Button"

import log from "loglevel"

import "./CornerWindow.css"

function CornerWindow({
  id,
  heading,
  show,
  onClose,
  children,
  className
}: any) {

  useEffect(() => {
    const modalx = document.getElementById("corner-window-" + id);
    const modalBody = document.getElementById("corner-window-body-" + id);
    if (show) {
      modalx.classList.remove("hidden");
      setTimeout(() => {
        modalBody.classList.add("corner-window-opened");
      }, 100);
    } else {
      modalBody.classList.remove("corner-window-opened");
      modalx.classList.add("hidden");
    }
  }, [id, show]);

  function close(){
    onClose();
  }

  return (
    <div
      id={"corner-window-"+id}
      className={clsx(
        "!m-0 fixed inset-0 z-1099",
        "items-end justify-end",
        "bg-black/50",
        "corner-window",
        "flex hidden",
      )}
    >
      <div
        id={"corner-window-body-"+id}
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          "rounded-xl p-4 shadow-xl",
          "bg-dark dark:bg-dark",
          "text-gray-200",
          "corner-window-body",
          className
        )}
      >
        {}
        <div className="flex gap-4 justify-between items-center mb-2">
          {}
          <h3 className="text-lg font-bold">{heading}</h3>
          <CircularButton className="p-1.5 close-button" onClick={() => close()} title="Close">
            <X />
          </CircularButton>
        </div>
        {}
        <div className="mt-2">{children}</div>
      </div>
    </div>
  )
}

export default CornerWindow
