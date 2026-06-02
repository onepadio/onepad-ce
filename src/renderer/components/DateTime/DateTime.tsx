import clsx from "clsx";
import { useEffect, useState } from "react";

import "./DateTime.css";

function DateTime({
  className
}: any) {
  const [time, setTime] = useState({
    hours: 0,
    minutes: 0,
    meridiem: "AM",
  })

  const setCurrentTime = () => {
    const date = new Date()
    const hours = date.getHours()
    const minutes = date.getMinutes()

    if (hours > 12) setTime({ hours: hours - 12, minutes, meridiem: "PM" })
    else setTime({ hours, minutes, meridiem: hours >= 12 ? "PM" : "AM" })
  }

  useEffect(() => {
    setCurrentTime()
    const timeInterval = setInterval(setCurrentTime, 60 * 1000)
    return () => clearInterval(timeInterval)
  }, [])

  return (
    <div className={clsx("text-center w-fit text-white", className)}>
      <div className="flex gap-2 items-end">
        <h3 className="text-5xl font-light">
          {(time.hours < 10 ? "0" + time.hours : time.hours) +
            ":" +
            (time.minutes < 10 ? "0" + time.minutes : time.minutes)}
        </h3>
        <span className="text-md font-medium">{time.meridiem}</span>
      </div>
      <hr className="border border-gray-200 mt-2" />
      <span className="text-md font-medium">{new Date().toDateString()}</span>
    </div>
  )
}

export default DateTime