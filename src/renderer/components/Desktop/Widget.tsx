import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import log from 'loglevel';

import { workspaceActions } from '../../store/workspace-slice';

import "./Widget.css";
import { PlusCircle } from 'react-bootstrap-icons';
import { MinusCircle } from 'react-feather';

function Widget(props: any){
    const dispatch = useDispatch();
    const webviewRef = useRef(null);
    const [title, setTitle] = useState("");
    const [favicon, setFavicon] = useState("");
    const [partition, setPartition] = useState("");
    const [zoomLevel, setZoomLevel] = useState(0);
    const [webview, setWebview] = useState(null);

    const [position, setPosition] = useState("middle");


    const widgetConfig  = useSelector((state: any) => state.workspace.widgetConfig);

    const workspaceId = useSelector((state: any) => state.workspace.selectedWorkspace.id);

    useEffect(() => {


        if(widgetConfig && widgetConfig[workspaceId]){
            widgetConfig[workspaceId].widgets.map((widget: any) => {
                if(widget.id === props.id && widget.zoomLevel){
                    setZoomLevel(widget.zoomLevel);
                }
            });
        }

    }, []);

    useEffect(() => {
        const _webview = webviewRef.current;
        const container = document.getElementById("widget-item-"+props.id);

        _webview.addEventListener('did-attach', () => {
            log.debug('Webview is attached to the DOM');
            setWebview(_webview);
        });

        _webview.addEventListener("dom-ready", () => {
            log.debug("Widget dom-ready: ", props.id);
            _webview.setZoomLevel(zoomLevel);
        });

        _webview.addEventListener("did-start-loading", () => {
            container.classList.add("loading");
            _webview.setZoomLevel(zoomLevel);
        });

        _webview.addEventListener("did-stop-loading", () => {
            container.classList.remove("loading");
            _webview.setZoomLevel(zoomLevel);
        });

        _webview.addEventListener("did-navigate-in-page", () => {
            _webview.setZoomLevel(zoomLevel);
        });

        _webview.addEventListener("page-title-updated", (e: any) => {
            setTitle(e.title);
            _webview.executeJavaScript(`
                (function() {
                    const links = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
                    return Array.from(links).map(link => link.href);
                })();
            `).then((faviconUrls: any) => {
                if(faviconUrls.length > 0){
                    setFavicon(faviconUrls[0]);
                }else{
                    let _hostname = new URL(_webview.getURL()).hostname;
                    let _l = _hostname.split(".").length;
                    if(_l > 2){
                        _hostname = _hostname.split(".").slice(-2).join(".");
                    }
                    setFavicon("https://www.google.com/s2/favicons?domain="+_hostname);
                }
            });
        });

        if(widgetConfig ){
            if(widgetConfig[workspaceId]){
                let _widgetsCopy = Object.assign([], widgetConfig[workspaceId].widgets);
                let _widgets: any = [];
                _widgetsCopy.map((widget: any) => {
                    let _widget = Object.assign({}, widget);
                    if(_widget.id === props.id){
                        _widget.zoomLevel = zoomLevel;
                    }
                    _widgets.push(_widget);
                });
                update(_widgets);
            }
        }
        if(webview !== null && zoomLevel !== 0){
            webview.setZoomLevel(zoomLevel);
        }
    }, [webviewRef, zoomLevel, webview]);

    function update(widgets: any){
        let _config = {
            widgets: widgets,
        }
        if(localStorage.getItem("widget-config-v2") !== null){
            let oldConfig = JSON.parse(localStorage.getItem("widget-config-v2"));
            oldConfig[workspaceId] = _config;
            localStorage.setItem("widget-config-v2", JSON.stringify(oldConfig));
            //dispatch(workspaceActions.setWidgetConfig(oldConfig));
        }else{
            let _newConfig = {};
            _newConfig[workspaceId] = _config;
            localStorage.setItem("widget-config-v2", JSON.stringify(_newConfig));
            //dispatch(workspaceActions.setWidgetConfig(_newConfig));
        }
    }

    function getPosition(element: any) {
        var clientRect = element.getBoundingClientRect();
        return {left: clientRect.left + document.body.scrollLeft,
                top: clientRect.top + document.body.scrollTop,
                right: clientRect.right,
                width: clientRect.width,
                height: clientRect.height};
    }

    function handleOnClick(){
        const _space_top = document.getElementById("space-top");
        const _space_right = document.getElementById("space-right");
        //hide
        _space_top.classList.add("d-none");
        _space_right.classList.add("long");

        const _widgets = document.getElementsByClassName("widget");
        for(let i = 0; i < _widgets.length; i++){
            if(_widgets[i].id !== "widget-item-"+props.id){
                _widgets[i].classList.add("d-none");
                //_widgets[i].style.transform = "translateX(0px) perspective(900px) rotateX(25deg) scale(0.7) translateY(0px)";
                //_widgets[i].style.opacity = "0.0";
            }
        }
        dispatch(workspaceActions.setSelectedWidgetId(props.id));

        setTimeout(() => {


            log.debug("Widget clicked: ", props.id);
            const element = document.getElementById("widget-webview-"+props.id);
            const widgetsRow = document.getElementById("widgets-row-id");
            const widgetsBackdrop = document.getElementById("widget-backdrop");

            let _pos = getPosition(element);
            let _rowsPos = getPosition(widgetsRow);

            let _horizontal = _pos.left - _rowsPos.left;
            let _vertical = _pos.top - _rowsPos.top;
            log.debug("Horizontal position: ", _horizontal);



            widgetsRow.scrollBy({
                top: _vertical,
                left: _horizontal,
                behavior: 'smooth'
            });

            setTimeout(() => {
                //widgetsRow.classList.add("noscroll");
            }, 300);

            // add scroll end event listener
            widgetsRow.addEventListener("scroll", () => {
                //log.debug("Scrolling: ", widgetsRow.scrollLeft);
                //translateOtherWidgets();
            });

            widgetsBackdrop.classList.add("active");

            setTimeout(() => {
                //translateOtherWidgets();
            },200);

        }, 600);
    }

    function translateOtherWidgets(){
        const _webview = document.getElementById("widget-webview-"+props.id);
        const _webviewPos = getPosition(_webview);
        const midPosition = getPosition(_webview).left + 0.5*_webview.getBoundingClientRect().width;
        log.debug("Selected Widget position: ", getPosition(_webview));
        log.debug("Selected Mid position: ", midPosition);
        const _widgets = document.getElementsByClassName("widget");
        for(let i = 0; i < _widgets.length; i++){
            if(!_widgets[i].classList.contains("selected")){
                log.debug("Widget id: ", _widgets[i].id);
                let _wpos = getPosition(_widgets[i]);
                log.debug("Widget position: ", _wpos);
                // @ts-expect-error
                let _toPos = (_webviewPos.left - _widgets[i].offsetWidth) + _widgets[i].offsetWidth;
                log.debug("To position: ", _toPos);
                let _v =  _toPos - _wpos.left;
                log.debug("V: ", _v);
                // @ts-expect-error TS(2339): Property 'style' does not exist on type 'Element'.
                _widgets[i].style.transform = "translateX("+_toPos+"px) perspective(900px) rotateX(25deg) scale(0.7) translateY(0px)";
                // @ts-expect-error TS(2339): Property 'style' does not exist on type 'Element'.
                _widgets[i].style.opacity = "1.0";
            }
        }
    }

    function zoomIn(){
        setZoomLevel(zoomLevel + 0.1);
    }

    function zoomOut(){
        setZoomLevel(zoomLevel - 0.1);
    }

    function handleOnMouseEnter(){
        const _widgets = document.getElementsByClassName("widget");
        let _x_min = 0;
        let _x_max = 0;

        let _top_max = 0;
        let _top_min = 0;

        let _rows = 0;
        let _cols = 0;

        for(let i = 0; i < _widgets.length; i++){
            let _pos = getPosition(_widgets[i]);
            if(_pos.left < _x_min || _x_min === 0){
                _x_min = _pos.left;
            }
            if(_pos.right > _x_max || _x_max === 0){
                _x_max = _pos.right;
                _cols++;
            }

            if(_pos.top < _top_min || _top_min === 0){
                _top_min = _pos.top;
            }

            if(_pos.top > _top_max || _top_max === 0){
                _top_max = _pos.top;
                _rows++;
            }
        }

        log.debug("X min: ", _x_min);
        log.debug("X max: ", _x_max);
        log.debug("Top min: ", _top_min);
        log.debug("Top max: ", _top_max);

        const _widget_item = document.getElementById("widget-item-"+props.id);
        const _pos = getPosition(_widget_item);
        log.debug("Widget position: ", _pos);

        if(_pos.top === _top_max && _rows > 1){
            if(_pos.left === _x_min){
                _widget_item.classList.add("hover-bottom-left");
                setPosition("bottom-left");
            }else if(_pos.right === _x_max){
                _widget_item.classList.add("hover-bottom-right");
                setPosition("bottom-right");
            }else{
                _widget_item.classList.add("hover-bottom");
                setPosition("bottom");
            }
        }else if(_pos.left === _x_min){
            _widget_item.classList.add("hover-left");
            setPosition("left");
        } else if(_pos.right === _x_max){
            _widget_item.classList.add("hover-right");
            setPosition("right");
        }else{
            _widget_item.classList.add("hover");
            setPosition("middle");
        }
    }

    function handleOnMouseLeave(){
        const _widget_item = document.getElementById("widget-item-"+props.id);
        if(position === "left"){
            _widget_item.classList.remove("hover-left");
        }else if(position === "right"){
            _widget_item.classList.remove("hover-right");
        }else if(position === "bottom"){
            _widget_item.classList.remove("hover-bottom");
        }else if(position === "bottom-left"){
            _widget_item.classList.remove("hover-bottom-left");
        }else if(position === "bottom-right"){
            _widget_item.classList.remove("hover-bottom-right");
        }else{
            _widget_item.classList.remove("hover");
        }
    }

    return (
        <div
            id={"widget-item-"+props.id}
            className="widget d-flex flex-column justify-content-center align-items-center col-sm-6 col-md-6 col-lg-6 col-xl-4 mb-3"
            //onMouseEnter={() => handleOnMouseEnter()}
            //onMouseLeave={() => handleOnMouseLeave()}
        >
            <div className="widget-header mt-1 mb-1" onClick={() => handleOnClick()}>
                <div className="d-flex justify-content-center">
                    <img
                        src={favicon}
                        width={16}
                        height={16} alt=""
                        className="widget-header-favicon mr-2"
                        onError={(e) => {
                            // @ts-expect-error
                            e.target.onerror = null;
                            // @ts-expect-error
                            e.target.src = "./assets/store/icon/preview.png";
                        }}
                    />
                    <div className="widget-header-title text-white">{ title.length > 25 ? title.substring(0,25)+"..." : title }</div>
                </div>
            </div>
            <div className="widget-zoom w-100 justify-content-center">
                <MinusCircle  className='mr-2' onClick={() => zoomOut()}/>
                <PlusCircle  onClick={() => zoomIn()}/>
            </div>
            <div className='widget-body justify-content-center' >
                <webview
                    ref={webviewRef}
                    className="widget-webview"
                    id={"widget-webview-"+props.id}
                    src={props.url}
                    partition={props.partition}
                    useragent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.108 Mobile/15E148 Safari/604.1"
                ></webview>
            </div>
        </div>
    );
}

export default Widget;
