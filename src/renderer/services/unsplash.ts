import { getItem, setItem } from "./persist"
import log from "loglevel";

export const BG_IMAGE_STORE_KEY = "BG_IMAGE";
const RAND_IMAGE_SRC = "https://source.unsplash.com/random";

export function getRandomImage(desktopId: any, oncomplete: any){
  const width = window.screen.width;
  const height = window.screen.height;
  const seeds = ["wallpaper", "nature", "abstract"];
  
  var reader = new FileReader();
  reader.onload = function () {
    //setItem(key, this.result);
    oncomplete(this.result);
  }

  cacheRandomImage({ width, height, seeds }, reader).then(() => {
    log.debug("Cached new image");
    
  });

  return getRandomImageUrl({ width, height, seeds });
}

async function cacheRandomImage(params: any, reader: any) {
  const resp = await fetch(getRandomImageUrl(params))
  const imgBlob = await resp.blob()
  reader.readAsDataURL(imgBlob)
}

export const getRandomImageUrl = ({
  width,
  height,
  seeds
}: any) =>
  `${RAND_IMAGE_SRC}/${width}x${height}?${seeds.join()}`
