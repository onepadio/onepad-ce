import ControlRoomEnvironment from "../ControlRoomEnvironment";
import type { ExperienceVistaProps } from "./types";

/**
 * Classic circular arena control room (unchanged from original scene).
 * Does not use DeskRoom — full environment is the experience.
 */
export default function ControlRoomVista({
  count,
}: ExperienceVistaProps) {
  return <ControlRoomEnvironment count={count} />;
}
