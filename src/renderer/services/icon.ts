import {setItem, getItem} from "./persist";
import { getSiteIcon } from "../api/IconApi";
import log from "loglevel";

export const ICON_STORAGE_KEY = "SITE_ICONS_STORAGE";

if(!getItem(ICON_STORAGE_KEY)){
  setItem(ICON_STORAGE_KEY, {});
}

export function getDDGFavicon(url: any) {
  return `https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`;
}

export function getGoogleFavIcon(url: any) {
  return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`;
}

export function getGoogleIconBySize(url: any, size: any) {
  let _hostname = new URL(url).hostname;
  log.debug("Hostname:"+_hostname);
  //return `https://www.google.com/s2/favicons?domain=https://${_hostname}&sz=${size}`; 
  return "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://" +_hostname +"&size="+size
}

export function saveIcon(key: any, url: any, iconUrl: any){
  let reader = new FileReader();
  reader.onload = function() {
      // @ts-expect-error
      localStorage.setItem(key, reader.result);
  };
  reader.onerror = function() {
      log.debug(reader.error);
  };

  loadImage(iconUrl).then((file) => {
      reader.readAsDataURL(file);
  });
}

function getBase64FromImageUrl(url: any, oncomplete: any, onerror: any) {
  var img = new Image();
  img.crossOrigin="anonymous";
  img.onload = function () {
      var canvas = document.createElement("canvas");
      // @ts-expect-error
      canvas.width =this.width;
      // @ts-expect-error
      canvas.height =this.height;
      var ctx = canvas.getContext("2d");
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      ctx.drawImage(this, 0, 0);
      var dataURL = canvas.toDataURL("image/png");
      oncomplete(url, dataURL.replace(/^data:image\/(png|jpg);base64,/, ""));
  };

  img.src = url;
}

export function getIconData(iconUrl: any, name: any, shortName: any, startUrl: any, onload: any, onerror: any, source: any){
  let reader = new FileReader();
  reader.onload = function() {
    onload(iconUrl, name, shortName, startUrl, source, reader.result);
  };

  reader.onerror = function() {
    onerror(iconUrl, source, reader.error);
  };

  loadImage(iconUrl).then((file) => {
    reader.readAsDataURL(file);
  });

}

async function loadImage(url: any){
  const response = await fetch(url);
  const blob = await response.blob();
  const file = new File([blob], `icon.png`, {type: blob.type});
  return file;
}

const getMeta = (url: any, cb: any) => {
  const img = new Image();
  img.onload = () => cb(null, img);
  img.onerror = (err) => cb(err);
  img.src = url;
};

export function localStorageKeyForSiteIcon(url: any) {
  try {
    let _hostname = new URL(url).hostname;
    return "icon:" + _hostname;
  } catch (error) {
    return "icon:default";
  }
  
}

function favIconKit(url: any, size: any) {
  return `https://api.faviconkit.com/${new URL(url).hostname}/${size}`;
}

const iconFinderOptions = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization:
      "Bearer x8Hh5XuTK0UpAMZtX3lEqaMVS04y3IaJQvwLKzMvJAcjTbRsHyQNEUKN2MAXiixL",
  },
};

function tryIcon8(url: any) {
  const splittedUrl = url.replace("https://", "").split(".");
  let query = "";
  if (splittedUrl.length == 2) {
    query = splittedUrl[0];
  } else if (splittedUrl.length == 2) {
    query = splittedUrl[1];
  }
  log.debug("Query:" + query);
  if (query.length > 0) {
    fetch(
      "https://api.iconfinder.com/v4/icons/search?query=" +
        query +
        "&count=10",
      iconFinderOptions
    )
      .then((response) => response.json())
      .then((response) => log.debug(response))
      .catch((err) => console.error(err));
  }
}

function findIcon(url: any) {
  let didTryOnlyDomain = false;
  let didTryAppleTouch = false;
  //setIconUrl("");
  var iconImg = document.getElementById("iconImg");
  iconImg.onload = function () {
    // @ts-expect-error
    log.debug(this.width + "x" + this.height);
    // @ts-expect-error
    if (this.width < 48 || this.height < 48) {
      log.debug("ToDo: Try icon8 API...");
      if(!didTryOnlyDomain){
        let _domain = (new URL(url)).hostname.split(".").slice(-2).join(".");
        getByGoogle(_domain);
        didTryOnlyDomain = true;
      }else if(!didTryAppleTouch){
        let _appleTouchUrl = url + "/apple-touch-icon.png";
        //setIconUrl(_appleTouchUrl);
        didTryAppleTouch = true;
      }else{
        //setIcon("");
      }
      //tryIcon8();
    } else {
      // @ts-expect-error
      log.debug("ICON..." + this.src);
      //setIcon(this.src);
    }
  };

}

function getByGoogle(url: any) {
  let googleIconUrl =
    "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://" +
    url +
    "&size=256";
    return googleIconUrl;
  //setIconUrl(googleIconUrl);
}

function loadAppleTouchIcon(url: any) {
  let _appleTouchUrl = url + "/apple-touch-icon.png";
  return _appleTouchUrl;
}