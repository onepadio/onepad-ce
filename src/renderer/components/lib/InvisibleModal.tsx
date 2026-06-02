import clsx from "clsx"
import { useEffect } from "react"
import { X } from "react-bootstrap-icons"
import { CircularButton } from "./Button"

import log from "loglevel"

import "./InvisibleModal.css"

function InvisibleModal({
  id,
  heading,
  show,
  onClose,
  children,
  className
}: any) {

  useEffect(() => {
    const modalx = document.getElementById("modalx-" + id);
    const modalBody = document.getElementById("modal-body-" + id);
    if (show) {
      modalx.classList.remove("hidden");
      setTimeout(() => {
        modalBody.classList.add("opened");
      }, 100);
    } else {
      modalBody.classList.remove("opened");
      modalx.classList.add("hidden");
    }
  }, [id, show]);

  function close(){
    onClose();
  }

  return (
    <div
      id={"modalx-"+id}
      onClick={onClose}
      className={clsx(
        "!m-0 fixed inset-0 z-1099",
        "items-center justify-center",
        "bg-black/50",
        "modalx",
        "flex hidden",
      )}
    >
      <div
        id={"modal-body-"+id}
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          "text-gray-200",
          "modal-body-x",
          className
        )}
      >
        {}
        <div className="flex gap-3 justify-between items-center mb-2">
          {}
          <h3 className="text-lg font-bold">{heading}</h3>
          <CircularButton className="p-1.5 d-none" onClick={() => close()} title="Close">
            <X />
          </CircularButton>
        </div>
        {}
        <div className="mt-2 h-100">{children}</div>
      </div>
    </div>
  )
}

export default InvisibleModal
