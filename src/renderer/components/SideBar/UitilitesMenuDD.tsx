import React, { useState, useEffect, version } from "react";
import log from "loglevel";

import { modalActions } from "../../store/modal-slice";
import { chatActions } from "../../store/chat-slice";
import { musicPlayerActions } from "../../store/musicplayer-slice";
import { utilityAppsActions } from "../../store/utility-slice";
import { streamAppsActions } from "../../store/stream-slice";

import {
  Tv,
  TvFill,
  Plus,
  Grid1x2,
  Save,
  Collection,
  ChevronDown,
  ChevronUp,
  FileEarmarkArrowUp,
  CardChecklist,
  Pause,
  PauseCircle,
  XCircle,
  BoxArrowRight,
  Kanban,
  KanbanFill,
  Calculator,
  CalculatorFill,
  Messenger,
  Play,
  ChatDots,
  MusicNoteBeamed,
  Envelope,
  EnvelopeAt,
  CollectionPlay,
  Film,
  Cart,
  CurrencyPound,
  Newspaper,
  Calendar,
  Calendar2Date,
  Justify,
  JournalText,
  Cloud,
  CameraVideo,
  Robot,
  PinMap,
  PinMapFill,
  Search,
  RocketTakeoff,
  Grid3x3GapFill,
  People,
  Facebook,
  Instagram,
  FileEarmarkText,
  Key,
  Tools,
  ThreeDotsVertical,
  LayoutTextSidebar,
  LayoutTextSidebarReverse,
} from "react-bootstrap-icons";
import { 
    Dropdown,
    DropdownToggle,
    DropdownMenu, 
    DropdownItem
  } from 'reactstrap';

import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import SettingsMenu from "../SettingsMenu/SettingsMenu";

import { Menu, Item, Separator, Submenu, useContextMenu } from 'react-contexify';
import 'react-contexify/ReactContexify.css';

import './UtilitiesMenuDD.css';

const MENU_ID = 'utilities-context-menu';

function UtilitiesMenuDD(props: any) {
  const dispatch = useDispatch();
  
  const activeCategory = useSelector((state: any) => state.utility.activeCategory);
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [barState, setBarState] = useState({});

  const { show } = useContextMenu({
    id: MENU_ID,
  });

  const toggle = () => {
    setDropdownOpen((prevState) => !prevState);
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.hideSpacePad());
    if(!dropdownOpen){
      dispatch(utilityAppsActions.close());
      dispatch(musicPlayerActions.close());
      dispatch(chatActions.close());
    }
  }

  useEffect(() => {
    log.debug("UtilitiesMenu useEffect");
    if(localStorage.getItem("utilities-menu-state") === null){
      localStorage.setItem("utilities-menu-state", JSON.stringify({}));
    }else{
      //setBarState(JSON.parse(localStorage.getItem("utilities-menu-state")));
    }
  }, []);

  function handleContextMenu(event: any){
    log.debug("handleContextMenu");
    show({
      event,
      props: {
          key: 'value'
      }
    })
  }

  function openWhatsApp() {
    dispatch(chatActions.toggle());
  }

  function toggleGroup(name: any){
    let newState = {...barState};
    if(newState[name] === undefined){
      newState[name] = true;
    }else{
      delete newState[name];
    }
    setBarState(newState);
    localStorage.setItem("utilities-menu-state", JSON.stringify(newState));
  }

  return (
    <>
        <Dropdown className="utility-menu-dd" isOpen={dropdownOpen} toggle={toggle} direction="down" onMouseLeave={() => setDropdownOpen(false) }>
        <DropdownToggle color="dark" className="d-flex justify-content-center">
            <LayoutTextSidebarReverse size={20} className="menu-icon"/>
        </DropdownToggle>
        <DropdownMenu dark className="utilities-menu-dd-menu">
        <DropdownItem
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            onClick={() => dispatch(modalActions.toggleGlobalAppsModal())}
            className="d-none"
          >
            <div className="">
            <RocketTakeoff color="white" size={20} />
            </div>
          
        </DropdownItem>
        <DropdownItem 
            onClick={() => dispatch(musicPlayerActions.toggle())}
            className="d-none"
          >
            <div className="d-flex flex-row">
                <MusicNoteBeamed color="white" size={20} />
                <div className="ml-2">
                  Music
                </div>
            </div>
        </DropdownItem>
        <DropdownItem
            onClick={() => dispatch(utilityAppsActions.toggle("search"))}
            className="d-none"
          >
            <div className="d-flex flex-row">
                <Search color="white" size={20} />
                <div className="ml-2">
                  Search
                </div>
            </div>

        </DropdownItem>
        <DropdownItem
            onClick={() => dispatch(utilityAppsActions.toggle("ai"))}
            className="d-none"
          >
            <div className="d-flex flex-row">
                <Robot color="white" size={20} />
                <div className="ml-2">
                  AI
                </div>
            </div>

        </DropdownItem>
        <DropdownItem
            onClick={() => dispatch(utilityAppsActions.toggle("map"))}
          >
            <div className="d-flex flex-row">
                {activeCategory === "map" ? (
                <PinMapFill color="white" size={20} />
                ) : (
                <PinMap color="white" size={20} />
                )}
                <div className="ml-2">
                  Map
                </div>
            </div>

        </DropdownItem>
        <DropdownItem
            onClick={() => dispatch(utilityAppsActions.toggle("calendar"))}
          >
            <div className="d-flex flex-row">
                <Calendar2Date color="white" size={20} />
                <div className="ml-2">
                  Calendar
                </div>
            </div>

        </DropdownItem>
        <DropdownItem 
            onClick={() => dispatch(utilityAppsActions.toggle("email"))}
          >
            <div className="d-flex flex-row">
                <EnvelopeAt color="white" size={20} />  
                <div className="ml-2">
                  Mail
                </div>
            </div>
        </DropdownItem>
        <DropdownItem  onClick={() => openWhatsApp()} className="d-none">
            <div className="d-flex flex-row">
                <ChatDots color="white" size={20} />  
                <div className="ml-2">
                  WhatsApp
                </div>
            </div>
            
        </DropdownItem>
        <DropdownItem 
            onClick={() =>
              alert("Coming soon... One place for all your calls.. ")
            }
            className="d-none"
          >
            
            <div className="d-flex flex-row">
                <CameraVideo color="white" size={20} />
                <div className="ml-2">
                  Meeting
                </div>
            </div>
        </DropdownItem>
        <DropdownItem 
            onClick={() => dispatch(utilityAppsActions.toggle("social"))}
          >
            <div className="d-flex flex-row">
                <Instagram color="white" size={20} />
                <div className="ml-2">
                  Social
                </div>
            </div>
          
        </DropdownItem>
        <DropdownItem 
            onClick={() => dispatch(utilityAppsActions.toggle("note"))}
          >
            <div className="d-flex flex-row">
                <FileEarmarkText color="white" size={20} />
                <div className="ml-2">
                  Documents
                </div>
            </div>
        </DropdownItem>
        <DropdownItem 
            onClick={() => dispatch(utilityAppsActions.toggle("todo"))}
          >
            <div className="d-flex flex-row">
                <CardChecklist color="white" size={20} />
                <div className="ml-2">
                  ToDo
                </div>
            </div>
        </DropdownItem>
        <DropdownItem 
            onClick={() => dispatch(utilityAppsActions.toggle("kanban"))}
          >
            <div className="d-flex flex-row">
                <Kanban color="white" size={20} />
                <div className="ml-2">
                  Kanban
                </div>
            </div>
        </DropdownItem>
        <DropdownItem 
            onClick={() => dispatch(utilityAppsActions.toggle("news"))}
          >
            <div className="d-flex flex-row">
                <Newspaper color="white" size={20} />
                <div className="ml-2">
                  News
                </div>
            </div>
        </DropdownItem>
        <DropdownItem 
            onClick={() => alert("Coming soon... One finance...")}
            className="d-none"
          >
            <div className="d-flex flex-row">
                <CurrencyPound color="white" size={20} />
                <div className="ml-2">
                  Finance
                </div>
            </div>
        </DropdownItem>
        <DropdownItem 
            onClick={() => dispatch(utilityAppsActions.toggle("shopping"))}
          >
            <div className="d-flex flex-row">
                <Cart color="white" size={20} />
                <div className="ml-2">
                  Shopping
                </div>
            </div>
        </DropdownItem>
        <DropdownItem 
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            onClick={() => dispatch(streamAppsActions.toggle())}
            className="d-none"
          >
            <div className="d-flex flex-row">
                <Film color="white" size={20} />
                <div className="ml-2">
                  Streaming
                </div>
            </div>
        </DropdownItem>
        <DropdownItem 
            onClick={() => dispatch(utilityAppsActions.toggle("cloud"))}
            className="d-none"
          >
            <div className="d-flex flex-row">
                <Cloud color="white" size={20} />
                <div className="ml-2">
                  Cloud
                </div>
            </div>
        </DropdownItem>
    </DropdownMenu>
    </Dropdown>
    
    </>
  );
}

export default UtilitiesMenuDD;
