import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { modalActions } from "../../store/modal-slice";
import { settingsActions } from "../../store/settings-slice";

import { ProfilesService } from "../../services/profiles";

import {
  Button,
  Offcanvas,
  OffcanvasHeader,
  OffcanvasBody,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Col,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  ListGroup,
  ListGroupItem,
} from "reactstrap";
import "./SettingsCanvas.css";
import { Route } from "react-router-dom";
import { sessionActions } from "../../store/session-slice";

function SettingsCanvas() {
  const dispatch = useDispatch();
  const route = useSelector((state: any) => state.session.route);
  
  const isSettingsOpen = useSelector((state: any) => state.modal.isSettingsOpen);
  
  const version = useSelector((state: any) => state.app.version);
  
  const profileId = useSelector((state: any) => state.app.profileId);
  
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const isWorkspacesEnabled = useSelector(
    
    (state: any) => state.settings.isWorkspacesEnabled
  );
  const isDesktopsEnabled = useSelector(
    
    (state: any) => state.settings.isDesktopsEnabled
  );
  const isSharedAppsEnabled = useSelector(
    
    (state: any) => state.settings.isSharedAppsEnabled
  );
  const isSessionsEnabled = useSelector(
    
    (state: any) => state.settings.isSessionsEnabled
  );
  const isSplitWindowsEnabled = useSelector(
    
    (state: any) => state.settings.isSplitWindowsEnabled
  );
  const isEfficiencyModeEnabled = useSelector(
    
    (state: any) => state.settings.isEfficiencyModeEnabled
  );
  const isAdvancedBackgroundEnabled = useSelector(
    
    (state: any) => state.settings.isAdvancedBackgroundEnabled
  );
  const isExternalWindowMode = useSelector(
    
    (state: any) => state.settings.isExternalWindowMode
  );
  const isDeveloperMode = useSelector(
    
    (state: any) => state.settings.isDeveloperMode
  );
  const isSpaceBrowserEnabled = useSelector(
    
    (state: any) => state.settings.isSpaceBrowserEnabled
  );
  
  const isFullScreen = useSelector((state: any) => state.session.isFullScreen);
  const isTabGroupsEnabled = useSelector(
    
    (state: any) => state.settings.isTabGroupsEnabled
  );
  const isSpaceOSEnabled = useSelector(
    
    (state: any) => state.settings.isSpaceOSEnabled
  );

  const isSleepingTabsEnabled = useSelector(
    
    (state: any) => state.settings.isSleepingTabsEnabled
  );

  const sleepingTabsTimeout = useSelector(
    
    (state: any) => state.settings.sleepingTabsTimeout
  );

  const sleepingTabsTimeoutOptions = useSelector(
    
    (state: any) => state.settings.sleepingTabsTimeoutOptions
  );

  const isKeepActiveWindowTabsAwake = useSelector(
    
    (state: any) => state.settings.isKeepActiveWindowTabsAwake
  );

  
  const productName = useSelector((state: any) => state.user.product);

  const toggleSettings = () => {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleSettings());
  };

  const [isSleepingTabsDropdownOpen, setIsSleepingTabsDropdownOpen] = useState(false);

  const toggleSleepingTabsDropdown = () => setIsSleepingTabsDropdownOpen((prevState) => !prevState);

  function updateProfile() {}

  useEffect(() => {
    ProfilesService.updateSettings(profileId, {
      isSpaceBrowserEnabled: isSpaceBrowserEnabled,
      isWorkspacesEnabled: isWorkspacesEnabled,
      isDesktopsEnabled: isDesktopsEnabled,
      isSharedAppsEnabled: isSharedAppsEnabled,
      isSessionsEnabled: isSessionsEnabled,
      isSplitWindowsEnabled: isSplitWindowsEnabled,
      isEfficiencyModeEnabled: isEfficiencyModeEnabled,
      isAdvancedBackgroundEnabled: isAdvancedBackgroundEnabled,
      isExternalWindowMode: isExternalWindowMode,
      isDeveloperMode: isDeveloperMode,
    });
  }, [
    isSpaceBrowserEnabled,
    isWorkspacesEnabled,
    isDesktopsEnabled,
    isSharedAppsEnabled,
    isSessionsEnabled,
    isSplitWindowsEnabled,
    isEfficiencyModeEnabled,
    isAdvancedBackgroundEnabled,
    isExternalWindowMode,
    isDeveloperMode,
  ]);

  return (
    <div>
      <Offcanvas
        isOpen={isSettingsOpen}
        toggle={toggleSettings}
        direction="end"
        className="settings"
      >
        <OffcanvasHeader toggle={toggleSettings}>
          {}
          <div id="settingsWindow" className="settings-title">
            Settings
          </div>
        </OffcanvasHeader>

        <OffcanvasBody>
          <Form className="container settings-content">
            <div>
              <h6>Multiple Spaces</h6>
            </div>
            <FormGroup switch>
              <Row>
                <Col md={9}>
                  <Label className="ml-1 mt-2 mb-2" check>
                    Enable spaces to organize your work with multiple spaces
                  </Label>
                </Col>
                <Col className="container">
                  <div className="d-flex justify-content-end">
                    <Input
                      type="switch"
                      className="m-2"
                      checked={isWorkspacesEnabled}
                      onChange={() => {
                        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                        dispatch(settingsActions.toggleWorkspaces());
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </FormGroup>

            <ListGroup
              horizontal
              className="open-windows mt-3 justify-content-start"
            >
              <ListGroupItem className="d-flex container">
                <h6 className="mt-2">Sidebar</h6>
              </ListGroupItem>
            </ListGroup>
            <FormGroup switch>
              <Row>
                <Col md={9}>
                  <Label className="ml-1 mt-2 mb-2" check>
                    Enable to use your favourite apps across spaces
                  </Label>
                </Col>
                <Col className="container">
                  <div className="d-flex justify-content-end">
                    <Input
                      type="switch"
                      className="m-2"
                      checked={isSharedAppsEnabled}
                      onChange={() => {
                        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                        dispatch(settingsActions.toggleSharedApps());
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </FormGroup>
            <ListGroup
              horizontal
              className="open-windows mt-3 justify-content-start"
            >
              <ListGroupItem className="d-flex container">
                <h6 className="mt-2">Tab Sleeper</h6>
              </ListGroupItem>
            </ListGroup>
            <FormGroup switch>
              <Row>
                <Col md={9}>
                  <Label className="ml-1 mt-2 mb-2" check>
                    Enable to sleep tabs after a period of time inactivity
                  </Label>
                </Col>
                <Col className="container">
                  <div className="d-flex justify-content-end">
                    <Input
                      type="switch"
                      className="m-2"
                      checked={isSleepingTabsEnabled}
                      onChange={() => {
                        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                        dispatch(settingsActions.toggleSleepingTabs());
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </FormGroup>
            {isSleepingTabsEnabled && (
              <FormGroup className="mr-2 sleeping-tabs-form-group">
                <Row>
                  <Col md={6}>
                    <Label className="ml-1 mt-2 mb-2" check>
                    Sleep tabs after
                  </Label>
                </Col>
                <Col className="container">
                  <div className="d-flex justify-content-end">
                    <Dropdown
                      isOpen={isSleepingTabsDropdownOpen}
                      toggle={toggleSleepingTabsDropdown}
                    >
                      <DropdownToggle caret color="dark">
                        {sleepingTabsTimeout} minutes
                      </DropdownToggle>
                      <DropdownMenu>
                        {sleepingTabsTimeoutOptions.map((option: any) => <DropdownItem key={option.value} onClick={() => dispatch(settingsActions.setSleepingTabsTimeout(option.value))}>
                          {option.label}
                        </DropdownItem>)}
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </Col>
                </Row>
              </FormGroup>
            )}
            {isSleepingTabsEnabled && (
              <FormGroup switch>
                <Row>
                  <Col md={9}>
                    <Label className="ml-1 mt-2 mb-2" check>
                      Prevent tabs in active window from sleeping
                    </Label>
                  </Col>
                  <Col className="container">
                    <div className="d-flex justify-content-end">
                      <Input
                        type="switch"
                        className="m-2"
                        checked={isKeepActiveWindowTabsAwake}
                        onChange={() => {
                          // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                          dispatch(settingsActions.toggleKeepActiveWindowTabsAwake());
                        }}
                      />
                    </div>
                  </Col>
                </Row>
            </FormGroup>
            )}
            {version.includes("dev") && (
              <>
                <div>
                  <h6>Search Bar - (dev)</h6>
                </div>
                <FormGroup switch>
                  <Row>
                    <Col md={9}>
                      <Label className="ml-1 mt-2 mb-2" check>
                        Search Engine
                      </Label>
                    </Col>
                    <Col className="container">
                      <div className="d-flex justify-content-end">
                        <Dropdown>
                          <DropdownToggle caret color="dark">
                            Google
                          </DropdownToggle>

                          <DropdownMenu>
                            <DropdownItem>Google</DropdownItem>
                            <DropdownItem>Bing</DropdownItem>
                            <DropdownItem>DuckDuckGo</DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </Col>
                  </Row>
                  <Row className="d-none">
                    <Col md={8}>
                      <Label className="ml-1 mt-2 mb-2" check>
                        Show Results in
                      </Label>
                    </Col>
                    <Col className="container">
                      <div className="d-flex justify-content-end">
                        <Dropdown>
                          <DropdownToggle caret color="dark">
                            Browser
                          </DropdownToggle>

                          <DropdownMenu>
                            <DropdownItem>System browser</DropdownItem>
                            <DropdownItem>OnePad</DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </Col>
                  </Row>
                </FormGroup>
              </>
            )}
            {version.includes("dev") && (
              <>
                <div>
                  <h6>Tasks - (dev)</h6>
                </div>
                <FormGroup switch>
                  <Row>
                    <Col md={9}>
                      <Label className="ml-1 mt-2 mb-2" check>
                        Enable tasks to isolate your work
                      </Label>
                    </Col>
                    <Col className="container">
                      <div className="d-flex justify-content-end">
                        <Input
                          type="switch"
                          className="m-2"
                          checked={isSessionsEnabled}
                          onChange={() => {
                            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                            dispatch(settingsActions.toggleSessions());
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                </FormGroup>
              </>
            )}
            <ListGroup
              horizontal
              className="open-windows mt-3 justify-content-start"
            >
              <ListGroupItem className="d-flex container">
                <h6 className="mt-2">Developer Mode</h6>
              </ListGroupItem>
            </ListGroup>
            <FormGroup switch>
              <Row>
                <Col md={10}>
                  <Label className="ml-1 mt-2 mb-2" check>
                    Enable to use advanced developer features
                  </Label>
                </Col>
                <Col className="container">
                  <div className="d-flex justify-content-end">
                    <Input
                      type="switch"
                      className="m-2"
                      checked={isDeveloperMode}
                      onChange={() => {
                        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                        dispatch(settingsActions.toggleDeveloperMode());
                      }}
                    />
                  </div>
                </Col>
              </Row>
            </FormGroup>
            {false && (
              <>
                <div>
                  <h6>Window Mode</h6>
                </div>
                <FormGroup switch>
                  <Row>
                    <Col md={10}>
                      <Label className="ml-1 mt-2 mb-2" check>
                        Enable to see tabs full screen
                      </Label>
                    </Col>
                    <Col className="container">
                      <div className="d-flex justify-content-end">
                        <Input
                          type="switch"
                          className="m-2"
                          checked={isFullScreen}
                          onChange={() => {
                            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                            dispatch(sessionActions.toggleFullScreen());
                            // go to launchpad
                            dispatch(
                              sessionActions.getBackToLaunchPad({
                                data: {
                                  desktopId: desktop.id,
                                },
                              })
                            );
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                </FormGroup>
              </>
            )}

            {false && (
              <>
                <div>
                  <h6>Tab Groups</h6>
                </div>
                <FormGroup switch>
                  <Row>
                    <Col md={10}>
                      <Label className="ml-1 mt-2 mb-2" check>
                        Enable to see tab groups
                      </Label>
                    </Col>
                    <Col className="container">
                      <div className="d-flex justify-content-end">
                        <Input
                          type="switch"
                          className="m-2"
                          checked={isTabGroupsEnabled}
                          onChange={() => {
                            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                            dispatch(settingsActions.toggleTabGroups());
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                </FormGroup>
              </>
            )}

            {false && (
              <>
                <div>
                  <h6>Space OS</h6>
                </div>
                <FormGroup switch>
                  <Row>
                    <Col md={10}>
                      <Label className="ml-1 mt-2 mb-2" check>
                        Enable to see space OS
                      </Label>
                    </Col>
                    <Col className="container">
                      <div className="d-flex justify-content-end">
                        <Input
                          type="switch"
                          className="m-2"
                          checked={isSpaceOSEnabled}
                          onChange={() => {
                            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                            dispatch(settingsActions.toggleSpaceOS());
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                </FormGroup>
              </>
            )}

            {false && (
              <>
                <div>
                  <h6>Advanced Windows</h6>
                </div>
                <FormGroup switch>
                  <Row>
                    <Col md={9}>
                      <Label className="ml-1 mt-2 mb-2" check>
                        External Window Mode
                      </Label>
                    </Col>
                    <Col className="container">
                      <div className="d-flex justify-content-end">
                        <Input
                          type="switch"
                          className="m-2"
                          checked={isExternalWindowMode}
                          onChange={() => {
                            dispatch(
                              // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                              settingsActions.toggleExternalWindowMode()
                            );
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                </FormGroup>
                <FormGroup switch>
                  <Row>
                    <Col md={9}>
                      <Label className="ml-1 mt-2 mb-2" check>
                        Allow Split Windows
                      </Label>
                    </Col>
                    <Col className="container">
                      <div className="d-flex justify-content-end">
                        <Input
                          type="switch"
                          className="m-2"
                          checked={isSplitWindowsEnabled}
                          onChange={() => {
                            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                            dispatch(settingsActions.toggleSplitWindows());
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                </FormGroup>
              </>
            )}
            {false && (
              <>
                <div>
                  <h6>Others</h6>
                </div>
                <FormGroup switch>
                  <Row>
                    <Col md={9}>
                      <Label className="ml-1 mt-2 mb-2" check>
                        Advanced Backgrounds
                      </Label>
                    </Col>
                    <Col className="container">
                      <div className="d-flex justify-content-end">
                        <Input
                          type="switch"
                          className="m-2"
                          checked={isAdvancedBackgroundEnabled}
                          onChange={() => {
                            dispatch(
                              // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                              settingsActions.toggleAdvancedBackground()
                            );
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                </FormGroup>
              </>
            )}
          </Form>
          <div className="version-label">v{version}</div>
        </OffcanvasBody>
      </Offcanvas>
    </div>
  );
}

export default SettingsCanvas;
