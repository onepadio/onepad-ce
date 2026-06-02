import React, { useState } from 'react';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Container,
  Row,
  Col
} from 'reactstrap';
import { ChevronUp, ChevronDown } from 'react-bootstrap-icons';
import isElectron from 'is-electron';
import { sessionActions } from '../../store/session-slice';
import { useDispatch } from 'react-redux';

const TabsDropDown = ({
  openTabs,
  onTabSelect,
  windowId,
  tabId
}: any) => {
  const dispatch = useDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggle = () => setDropdownOpen(prevState => !prevState);

  const openTabsDD = () => {
    if (!dropdownOpen) {
      setDropdownOpen(true);
    }
  };

  const closeTabsDDIfOpen = () => {
    if (dropdownOpen) {
      setTimeout(() => {
        setDropdownOpen(false);
      }, 200);
    }
  };

  const handleTabSelect = (tab: any) => {
    if(tab.location === "external"){
      if(isElectron()){
        // @ts-expect-error
        window.electronAPI.send("toMain", {
          action: "switch-to-external-tab",
          tabWindowId: tab.window,
          tabId: tab.id,
          type: tab.type,
        });
      }
    }
    dispatch(sessionActions.setActiveTab({data: tab}));
  }

  const tabDDItem = (tab: any) => {
    if (tab && tab.state && tab.window === windowId) {
      let _icon = "";
      if(tab.type === "app"){
        _icon = "./images/store/icon/"+tab.state.icon;
      }else{
        _icon = tab.state.icon;
      }

      let tabTitle = tab.state.title === "" ?
        tab.state.url.substring(0,35).concat("...") :
        tab.state.title.substring(0,35).concat("...");

      return (
        <DropdownItem
          key={tab.id}
          active={tab.id === tabId}
          onClick={() => handleTabSelect(tab)}
          className="tab-dd-item"
        >
          <Container fluid>
            <Row className="w-100">
              <Col xs={1} className="align-self-center">
                <div className="d-flex justify-content-center">
                  <img className="tab-icon-dd" width={16} height={16} src={_icon} alt=""/>
                </div>
              </Col>
              <Col xs={8} className="align-self-center">
                <div className="d-flex w-100 justify-content-start">
                  <span className="tab-title">{tabTitle}</span>
                </div>
              </Col>
            </Row>
          </Container>
        </DropdownItem>
      );
    }
    return null;
  };

  return (
    <Dropdown
      isOpen={dropdownOpen}
      toggle={toggle}
      className="tabs-drop-down"
      onMouseLeave={closeTabsDDIfOpen}
    >
      <DropdownToggle
        color="dark"
        data-bs-toggle="tooltip"
        data-bs-placement="right"
        title="Switch Tab"
        data-bs-custom-className="custom-tooltip"
      >
        {dropdownOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
      </DropdownToggle>
      <DropdownMenu dark>
        <DropdownItem header>
          Open Tabs
        </DropdownItem>
        {Object.values(openTabs).map(tab => tabDDItem(tab))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default TabsDropDown;
