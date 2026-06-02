import clsx from "clsx"


function Button({
  className,
  ...props
}: any) {
  return (
            <button {...props}
      className={clsx(
        "flex item-center justify-center",
        "px-4 py-2 rounded-lg",
        "bg-gray-700",
        "font-bold text-white",
        "disabled:opacity-60 hover:opacity-95",
        "shadow hover:shadow-lg transition-all",
        className
      )}
    >
      {props.children}
    </button>
  )
}

export function CircularButton({
  className,
  ...props
}: any) {
  return (
            <button {...props}
      className={clsx(
        "rounded-full p-2 overflow-hidden",
        "bg-white/50 dark:bg-gray-600/50",
        "text-gray-700 dark:text-gray-200",
        "disabled:opacity-60 hover:opacity-80",
        "shadow hover:shadow-lg transition-all",
        className
      )}
    >
      {props.children}
    </button>
  )
}

export default Button
