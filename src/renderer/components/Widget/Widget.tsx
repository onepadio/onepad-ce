import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router';
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import { v4 as uuidv4 } from 'uuid';

import "./Widget.css";

function Widget(props: any) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const personId = useSelector((state: any) => state.app.personId);

  
  const appsLimit = useSelector((state: any) => state.app.appsLimit);
  
  const linksLimit = useSelector((state: any) => state.app.linksLimit);
  
  const searchQuery = useSelector((state: any) => state.launchpad.searchQuery);

  const [isDomReady, setIsDomReady] = useState(false);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [loadLaterUrl, setLoadLaterUrl] = useState("");

  useEffect(() => {
    log.debug("useEffect");
    const webview = document.getElementById(props.widgetId+"-webview");
    if(webview && props.url && isDomReady){
      // @ts-expect-error
      webview.loadURL(props.url);
    }else{
      log.debug("webview not ready");
    }
  },[props.url]);

  useEffect(() => {
    log.debug("useEffect");
    const webview = document.getElementById(props.widgetId+"-webview");
    if(webview){
      webview.addEventListener('dom-ready', () => {
        // @ts-expect-error
        webview.insertCSS('body { background-color: #f5f5f5; }');
        setIsDomReady(true);
        if(loadLaterUrl !== ""){
          // @ts-expect-error
          webview.loadURL(loadLaterUrl);
          setLoadLaterUrl("");
        }
      }
      );
    }

    return () => {
      if(webview){
        setIsDomReady(false);
        webview.removeEventListener('dom-ready', () => {
          // @ts-expect-error
          webview.insertCSS('body { background-color: #f5f5f5; }');
        });
      }
    }
  },[]);


  return (
    <div className={"d-flex justify-content-center align-items-center widget "+props.className}>
        {
            props.type === "webview" ? (
                <webview 
                    className="widget-webview" 
                    id={props.widgetId+"-webview"} 
                    src={props.url}
                    partition={"persist:"+personId}
                    useragent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.108 Mobile/15E148 Safari/604.1"
                ></webview>
            ) : (
                <iframe className="widget-frame"  src={props.url}></iframe>
            )
        }
        

        
    </div>
  );
}

export default Widget;
