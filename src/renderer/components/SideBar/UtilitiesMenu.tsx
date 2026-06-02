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
} from "react-bootstrap-icons";
import { Button, ListGroup, ListGroupItem } from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import SettingsMenu from "../SettingsMenu/SettingsMenu";

import { Menu, Item, Separator, Submenu, useContextMenu } from 'react-contexify';
import 'react-contexify/ReactContexify.css';

const MENU_ID = 'utilities-context-menu';

function UtilitiesMenu(props: any) {
  const dispatch = useDispatch();
  
  const activeCategory = useSelector((state: any) => state.utility.activeCategory);
  const [barState, setBarState] = useState({});
  const { show } = useContextMenu({
    id: MENU_ID,
  });

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

  function contextMenu(){
    return (
      <Menu id={MENU_ID} theme="dark" title="Tab Group" animation="scale" >
          {/* @ts-expect-error TS(2322): Type 'void' is not assignable to type '((args: Ite... Remove this comment to see the full error message */}
          <Item id="close-all" onClick={toggleGroup("search")}>Search</Item>
      </Menu>
    )
  }

  return (
    <div onContextMenu={(e) => handleContextMenu(e)}>
      <ListGroup id="sharedAppsMenu" className="shared-apps-menu" {...props}>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button color="dark" onClick={() => dispatch(utilityAppsActions.toggle("search"))}>
          <Search color="white" size={18} />
          </Button>
          </ListGroupItem>
          <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
              <Button title="OneAI" color="dark" onClick={() => dispatch(utilityAppsActions.toggle("ai"))}>
              <Robot color="white" size={20} />
              </Button>
          </ListGroupItem>
        <ListGroupItem
          key={uuidv4()}
          className="d-flex flex-column justify-content-center menu-button"
        >
          <Button
            color="dark"
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            onClick={() => dispatch(modalActions.toggleGlobalAppsModal())}
          >
            <RocketTakeoff color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button
            title="OneMap"
            color="dark"
            onClick={() => dispatch(utilityAppsActions.toggle("map"))}
          >
            {activeCategory === "map" ? (
              <PinMapFill color="lightblue" size={20} />
            ) : (
              <PinMap color="lightblue" size={20} />
            )}
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button
            title="OneCalendar"
            color="dark"
            onClick={() => dispatch(utilityAppsActions.toggle("calendar"))}
          >
            <Calendar2Date color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button
            title="OneEmail"
            color="dark"
            onClick={() => dispatch(utilityAppsActions.toggle("email"))}
          >
            <EnvelopeAt color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button title="OneChat" color="dark" onClick={() => openWhatsApp()}>
            <ChatDots color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button
            title="OneCall"
            color="dark"
            onClick={() =>
              alert("Coming soon... One place for all your calls.. ")
            }
          >
            <CameraVideo color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button
            title="OneSocial"
            color="dark"
            onClick={() => dispatch(utilityAppsActions.toggle("social"))}
          >
            <Instagram color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button
            title="OneNote"
            color="dark"
            onClick={() => dispatch(utilityAppsActions.toggle("note"))}
          >
            <FileEarmarkText color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button
            color="dark"
            onClick={() => dispatch(utilityAppsActions.toggle("todo"))}
          >
            <CardChecklist color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button
            color="dark"
            onClick={() => dispatch(utilityAppsActions.toggle("kanban"))}
          >
            <Kanban color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button
            title="OneNews"
            color="dark"
            onClick={() => dispatch(utilityAppsActions.toggle("news"))}
          >
            <Newspaper color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button
            title="OneFinance"
            color="dark"
            onClick={() => alert("Coming soon... One finance...")}
          >
            <CurrencyPound color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button
            title="OneShopping"
            color="dark"
            onClick={() => dispatch(utilityAppsActions.toggle("shopping"))}
          >
            <Cart color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button
            title="OneMusic"
            color="dark"
            onClick={() => dispatch(musicPlayerActions.toggle())}
          >
            <MusicNoteBeamed color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button
            title="OneStreaming"
            color="dark"
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            onClick={() => dispatch(streamAppsActions.toggle())}
          >
            <Film color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
        <ListGroupItem className="d-flex flex-column justify-content-center menu-button">
          <Button
            title="OneCloud"
            color="dark"
            onClick={() => dispatch(utilityAppsActions.toggle("cloud"))}
          >
            <Cloud color="lightblue" size={20} />
          </Button>
        </ListGroupItem>
      </ListGroup>
    </div>
  );
}

export default UtilitiesMenu;
