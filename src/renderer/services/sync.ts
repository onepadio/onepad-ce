import log from "loglevel";

export default function sync() {
  log.debug("sync");
  setTimeout(() => {
    sync();
  }, 5000);
}