import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, ListGroup, ListGroupItem, Offcanvas, OffcanvasBody, OffcanvasHeader, UncontrolledDropdown } from "reactstrap";
import log from "loglevel";
import { v4 as uuidv4 } from 'uuid';
import { musicPlayerActions } from "../../store/musicplayer-slice";

import "./MusicPlayerWindow.css"
import clsx from "clsx";
import { ArrowUpRightSquare, Dash, DashCircle, DashSquare, EyeSlash, EyeSlashFill, XLg } from "react-bootstrap-icons";

function MusicPlayerWindow(props: any){
    const dispatch = useDispatch();
    const route = useSelector((state: any) => state.session.route);

    const user = useSelector((state: any) => state.user);

    const profileId = useSelector((state: any) => state.app.profileId);

    const personId = useSelector((state: any) => state.app.personId);

    const isOpen = useSelector((state: any) => state.musicPlayer.isOpen);

    const title = useSelector((state: any) => state.musicPlayer.title);

    const webviewUrl = useSelector((state: any) => state.musicPlayer.webviewUrl);

    const direction = useSelector((state: any) => state.musicPlayer.direction);

    const backdrop = useSelector((state: any) => state.musicPlayer.backdrop);

    const fade = useSelector((state: any) => state.musicPlayer.fade);

    const width = useSelector((state: any) => state.musicPlayer.width);

    const scopes = useSelector((state: any) => state.musicPlayer.scopes);

    const activePlayer = useSelector((state: any) => state.musicPlayer.activePlayer);


    const workspaceState = useSelector((state: any) => state.workspace);

    const sessionState = useSelector((state: any) => state.session);

    const [partitionId, setPartitionId] = useState("");
    const [scope, setScope] = useState("");
    const [webview, setWebview] = useState(null);
    const [windowId, setWindowId] = useState(uuidv4());
    const [webviewId, setWebviewId] = useState(uuidv4());
    const [webviewHeight, setWebviewHeight] = useState("calc(100% - 40px)");
    const [mediaPlayingStatus, setMediaPlayingStatus] = useState("stopped");

    const apps = [
      {"name":"Youtube Music", "icon":"./images/store/icon/YouTubeMusic_Logo.png", "url":"https://music.youtube.com/", "key":"youtube-music"},
      {"name":"Spotify", "icon":"./images/store/icon/spotify.png", "url":"https://open.spotify.com/", "key":"spotify"},
      {"name":"Apple Music", "icon":"./images/store/icon/apple-music_icon.png", "url":"https://music.apple.com/", "key":"apple-music"},
      //{"name":"Soundcloud", "icon":"https://soundcloud.com/favicon.ico", "url":"https://soundcloud.com/", "key":"soundcloud"},
      {"name": "BBC Sounds", "icon":"./images/store/icon/bbc_sounds_icon.png", "url":"https://www.bbc.co.uk/sounds", "key":"bbc-sounds"},

      {"name":"Deezer", "icon":"https://e-cdn-files.dzcdn.net/cache/images/common/favicon/apple-touch-icon.dc494e31ef5f888a087a.png", "url":"https://www.deezer.com/", "key":"deezer"},
      {"name":"Amazon Music", "icon":"./images/store/icon/amazon_music_icon.png", "url":"https://music.amazon.com/", "key":"amazon-music"},

      {"name":"Napster", "icon":"https://www.napster.com/wp-content/themes/napsterpitch/assets/favicon/logo192.png", "url":"https://napster.com/gb", "key":"napster"},

      {"name":"Saavn", "icon":"https://www.jiosaavn.com/favicon.ico", "url":"https://www.jiosaavn.com/", "key":"saavn"},
      {"name":"Gaana", "icon":"https://gaana.com/favicon.ico", "url":"https://gaana.com/", "key":"gaana"},
      {"name":"Wynk Music", "icon":"https://wynk.in/favicon.ico", "url":"https://wynk.in/", "key":"wynk-music"},
      {"name":"Hungama Music", "icon":"https://www.hungama.com/favicon.ico", "url":"https://www.hungama.com/", "key":"hungama-music"},
      {"name":"Genius", "icon":"https://assets.genius.com/images/apple-touch-icon.png", "url":"https://genius.com/", "key":"genius"},

    ]

    const userAgents = {
      "Chrome" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Safari" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
    }

    function handleLoad(){

    }

    function addDragListener(element){
      const dropZone = document.getElementById('wrapper');

      // Handle dragstart event
      element.addEventListener('dragstart', function(e) {
          // Store the starting coordinates relative to the element
          const rect = element.getBoundingClientRect();
          e.dataTransfer.setData('text/plain', (e.clientX - rect.left) + ',' + (e.clientY - rect.top));
      });

      // Prevent default behavior for dragover and drop events
      dropZone.addEventListener('dragover', function(e) {
          e.preventDefault();
      });

      // Handle drop event
      dropZone.addEventListener('drop', function(e) {
          e.preventDefault();

          // Get the offset data
          const offset = e.dataTransfer.getData('text/plain').split(',');
          const offsetX = parseInt(offset[0], 10);
          const offsetY = parseInt(offset[1], 10);

          // Calculate new position
          const x = e.clientX - offsetX;
          const y = e.clientY - offsetY;

          // Update element's position
          element.style.left = x + 'px';
          element.style.top = y + 'px';
      });
    }

    useEffect(() => {
      let _canvas = document.getElementById(windowId);
      if(!webview){
        setWebview(document.getElementById("musicplayer-"+webviewId));
      }else{
        webview.addEventListener("dom-ready", () => {
          log.debug("dom-ready, wid", webview.getWebContentsId());

        });

        webview.addEventListener("media-started-playing", (event) => {
          log.debug("media-started-playing", event);
          setMediaPlayingStatus("playing");
        });

        webview.addEventListener("media-paused", (event) => {
          log.debug("media-paused", event);
          setMediaPlayingStatus("paused");
          //_canvas.classList.remove("corner-window");
        });

        webview.addEventListener("media-stopped", (event) => {
          log.debug("media-stopped", event);
          setMediaPlayingStatus("stopped");
          _canvas.classList.remove("corner-window");
        });
      }
    }, [webview]);

    function getPartitionId(_scope){
      let partition = "";
      let _workspaceId = workspaceState.selectedWorkspace.id;
      if(_scope === "profile"){
        partition = "persist:"+profileId;
      }else{
        if(route === "authenticated"){
          partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+user.username+"_"+workspaceState.currentSession.id : "persist:"+user.username+"_"+_workspaceId;
        }else{
          partition = sessionState.isInSession && workspaceState.currentSession && workspaceState.currentSession.isolated ? "persist:"+workspaceState.currentSession.id : "persist:"+_workspaceId;
        }
      }
      return partition;
    }

    useEffect(() => {
      log.debug("MusicPlayerWindow isOpen updated ", isOpen);
      if(!webview){
        setWebview(document.getElementById("musicplayer-"+webviewId));
      }
      let _webview = document.getElementById(windowId);
      let _canvas = document.getElementById(windowId);
      let _offcanvas = document.getElementById("musicplayer-offcanvas-"+windowId);
      if(_webview){
        if(isOpen){
          _webview.classList.add("musicplayer-canvas-open");
          _offcanvas.classList.remove("hidden");
          _canvas.classList.remove("corner-window");
          //_canvas.removeAllListeners();
        }else{
          _webview.classList.remove("musicplayer-canvas-open");
          _offcanvas.classList.add("hidden");
          //if(mediaPlayingStatus === "playing"){
          //  _canvas.classList.add("corner-window");
          //  addDragListener(_canvas);
          //}else{
          //  _canvas.classList.remove("corner-window");
          //}
        }
      }
    }, [isOpen]);


    useEffect(() => {
      log.debug("WebViewCanvas useEffect: ", partitionId, webviewUrl);
      if(webview && webviewUrl && partitionId !== ""){
        // webview.loadURL(webviewUrl);
        log.debug("webview ", webview, " partitionId ", partitionId, " webviewUrl ", webviewUrl);
      }
    }, [partitionId, webviewUrl]);

    useEffect(() => {
      if(!webview){
        setWebview(document.getElementById("musicplayer-"+webviewId));
      }
    }, []);

    useEffect(() => {
      if(scopes.length > 1){
       setWebviewHeight("calc(100% - 40px)");
       setScope("space");
      }else{
        setWebviewHeight("calc(100%)");
        setScope(scopes[0]);
      }
    }, [scopes,webviewUrl]);

    function handleSwitchWindow(item){
      dispatch(musicPlayerActions.setUrl(item.url));
      dispatch(musicPlayerActions.setTitle(item.name));
      dispatch(musicPlayerActions.setActivePlayer(item.key));

    }

    function menuItem(item){

      return(
        <ListGroupItem key={uuidv4()} className="nav-item" onClick={() => handleSwitchWindow(item)}>
          <div
            className="appicon d-flex justify-content-center" data-bs-toggle="tooltip" data-bs-placement="right" title={item.name} data-bs-custom-className="custom-tooltip"
            onContextMenu={(e) => {
              e.preventDefault(); // prevent the default behaviour when right clicked
            }}
          >
            {
              item.key !== activePlayer ? (
                                <img width={24} className="launch-icon grayscale" src={item.icon} alt="" />
              ) : (
                                <img width={24} className="launch-icon" src={item.icon} alt="" />
              )
            }
          </div>
        </ListGroupItem>
        )

    }

    function minimizeWindow(){
      let _canvas = document.getElementById(windowId);
      _canvas.classList.remove("corner-window");
    }

    return (
      <>
          <div
            id={"musicplayer-offcanvas-"+windowId}
            className={clsx(
              "!m-0 fixed inset-0 z-998",
              "items-end justify-end",
              "bg-black/50",
              "musicplayer-offcanvas",
              "flex hidden",
            )}
            onClick={() => dispatch(musicPlayerActions.toggle())}
          >

        </div>

        <div
          id={windowId}
          className={"musicplayer-canvas d-flex" }
          draggable="true"
        >
          <div className="hide-button">
            <Button
              className="btn"
            >
              <EyeSlash size={16} color="white" onClick={() => minimizeWindow()}/>
            </Button>
          </div>
            {
              scopes.length > 1 && (
                <UncontrolledDropdown className="d-flex justify-content-end mb-2 scope-menu">
                  <DropdownToggle color="dark" caret>
                    {scope === "profile" ? "Global" : "Space"}
                  </DropdownToggle>
                  <DropdownMenu dark>
                    <DropdownItem onClick={() => setScope("profile")}>Global</DropdownItem>
                    <DropdownItem onClick={() => setScope("space")}>Space</DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>
              )
            }

            {
              personId !== "" && (
                <webview
                  id={"musicplayer-"+webviewId}
                  autosize={true}
                  src={webviewUrl}
                  nodeintegration={true}
                  allowpopups={false}
                  partition={"persist:"+personId}
                  onLoadCapture={() => handleLoad()}
                  className="mp-webview"
                  useragent={userAgents["Safari"]}
                  draggable="true"
                ></webview>
              )
            }

          </div>

      </>
    )
}

export default MusicPlayerWindow;
