import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import * as Icon from 'react-feather';
import clsx from "clsx";
import {
  db,
  // @ts-expect-error
  saveApp,
  // @ts-expect-error
  getAppByUrl,
} from "../../repository/db";
import { useLiveQuery } from "dexie-react-hooks";

import { Alert, Button, ListGroup, ListGroupItem } from "reactstrap";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Grid, PlusCircle } from "react-bootstrap-icons";

import { modalActions } from "../../store/modal-slice";
import "./LaunchPad.css";
import LaunchIcon from "../LaunchIcon/LaunchIcon";

import AddButton from "../AddButton/AddButton";
import AddLinkButton from "../AddLinkButton/AddLinkButton";


function LaunchPad(props: any) {
  
  const isLocal = useSelector((state: any) => state.workspace.isLocal);
  const [isInEditMode, setIsInEditMode] = useState(false);
  
  const items = useSelector((state: any) => state.workspace.items);
  
  const openWindows = useSelector((state: any) => state.session.openWindows);
  
  const isSplitWindowsEnabled = useSelector((state: any) => state.settings.isSplitWindowsEnabled);
  
  const isSessionsEnabled = useSelector((state: any) => state.settings.isSessionsEnabled);
  
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);


  // @ts-expect-error TS(2339): Property 'apps' does not exist on type 'Dexie'.
  let icons = useLiveQuery(() => db.apps.toArray());

  useEffect(() => {
    icons = [];
  }, []);
  

  return (
    <div className="container-fluid launchpad-container">
      <div className="row">
        {}
        <div className="col-md-2 col-lg-2 d-flex justify-content-start window-menu">
  
        </div>
        {}
        <div className="col-sm-12 col-md-8 col-lg-8 d-flex justify-content-center launchpad">
          <Tabs className="container-fluid launchpad-tabs mt-3" defaultFocus={true}>
            <TabList>
              <Tab>
                <div className="d-flex align-items-center">
                  <Grid className="mr-2" />
                  <span>Apps</span>
                </div>
              </Tab>
              <Tab>
                <div className="d-flex align-items-center">
                  <Grid className="mr-2" />
                  <span>Links</span>
                </div>
              </Tab>
              <Tab>
                <div className="d-flex align-items-center">
                  <Grid className="mr-2" />
                  <span>Session</span>
                </div>
              </Tab>
              <Tab>
                <div className="d-flex align-items-center">
                  <PlusCircle className="mr-2" />
                </div>
              </Tab>
            </TabList>
            <TabPanel>
              {}
              <div className="container-fluid m-4">
                <div className="row">
                  {items?.map((item: any) => <LaunchIcon
                    key={item.id}
                    data={item}
                    uuid={item.id}
                    iconid={item.id}
                    name={item.name}
                    code={item.code}
                    url={item.start_url}
                    icon={item.icon}
                    isOpen={openWindows.hasOwnProperty(item.id)}
                    windowType={item.window_type}
                    isStateful={item.is_stateful}
                    showControls={item.show_controls}
                    isInEditMode={props.isInEditMode}
                    workspaceId={workspace.id}
                  />)}

                  <AddButton />
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              {}
              <div className="container-fluid m-4">
                <div className="row">
                <AddLinkButton />
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              {}
              <div className="container-fluid m-4">
                <div className="row">
                <AddLinkButton />
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              
            </TabPanel>
          </Tabs>
        </div>
        {}
        <div className="col-md-2 col-lg-2 d-flex justify-content-end"></div>
      </div>
    </div>
  );
}

export default LaunchPad;
