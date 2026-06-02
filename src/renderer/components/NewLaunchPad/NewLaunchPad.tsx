import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { Responsive, WidthProvider } from "react-grid-layout";
import LaunchIcon from "../LaunchIcon/LaunchIcon";
import { useSelector } from "react-redux";

import log from "loglevel";

import "./NewLaunchPad.css";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

function NewLaunchPad(props: any) {
  
  const [currentBreakpoint, setCurrentBreakpoint] = useState("sm");
  const [compactType, setCompactType] = useState("vertical");
  const [mounted, setMounted] = useState(false);
  const [layouts, setLayouts] = useState({ lg: [] });

  const selectedDesktop = useSelector(
    
    (state: any) => state.workspace.selectedDesktop
  );
  
  const apps = useSelector((state: any) => state.workspace.apps);
  
  const links = useSelector((state: any) => state.workspace.links);

  
  const appsLimit = useSelector((state: any) => state.app.appsLimit);
  
  const linksLimit = useSelector((state: any) => state.app.linksLimit);

  const [visibleApps, setVisibleApps] = useState([]);
  const [visibleLinks, setVisibleLinks] = useState([]);
  const [allItems, setAllItems] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    log.debug("allItems: ", allItems);
    setLayouts({ lg: generateLayout(allItems) });
  }, [allItems]);

  useEffect(() => {
    log.debug("layouts: ", layouts);
  }, [layouts]);

  useEffect(() => {
    log.debug("LaunchPadLocal: useEffect: apps: ", apps);
    if (appsLimit > 0) {
      setVisibleApps(apps.slice(0, appsLimit));
    } else {
      setVisibleApps(apps);
    }
  }, [apps, appsLimit]);

  useEffect(() => {
    //if(linksLimit > 0) {
    //  setVisibleLinks(links.slice(0, linksLimit));
    //}else{
    setVisibleLinks(links);
    //}
  }, [links, linksLimit]);

  useEffect(() => {
    let _allItems: any = [];
    visibleApps.forEach((item) => {
      let _item = Object.assign({}, item);
      _item.type = "app";
      _allItems.push(_item);
    });

    visibleLinks.forEach((item) => {
      let _item = Object.assign({}, item);
      let _data = Object.assign({}, item.data);
      _item.type = "link";
      _item.data = _data;
      _item.data.name = item.data.title;
      _allItems.push(_item);
    });
    log.debug("All items: ", _allItems);
    _allItems.sort((a, b) => {
      return a.createdAt - b.createdAt;
    });

    setAllItems(_allItems);
  }, [visibleApps, visibleLinks]);

  const onBreakpointChange = (breakpoint: any) => {
    setCurrentBreakpoint(breakpoint);
  };

  const onCompactTypeChange = () => {
    setCompactType((oldCompactType) =>
      oldCompactType === "horizontal"
        ? "vertical"
        : oldCompactType === "vertical"
        ? null
        : "horizontal"
    );
  };

  const onLayoutChange = (layout: any, layouts: any) => {
    props.onLayoutChange(layout, layouts);
  };

  const onNewLayout = () => {
    setLayouts({ lg: generateLayout(allItems) });
  };

  return (
    <div>
      <ResponsiveReactGridLayout
        {...props}
        layouts={layouts}
        onBreakpointChange={onBreakpointChange}
        onLayoutChange={onLayoutChange}
        // WidthProvider option
        measureBeforeMount={false}
        // I like to have it animate on mount. If you don't, delete `useCSSTransforms` (it's default `true`)
        // and set `measureBeforeMount={true}`.
       
        compactType={compactType}
        preventCollision={!compactType}
      >
        {_.map(layouts.lg, function (l: any, i: any) {
          const item = allItems[i];
          return item && (
            <div key={i}>
                <LaunchIcon
                  key={item.id}
                  id={item.id}
                  data={item}
                  iconid={item.id}
                  uuid={item.id}
                  localid={item.id}
                  name={item.data.name}
                  url={
                    item.data.customUrl.length > 0
                      ? item.data.customUrl
                      : item.data.startUrl
                  }
                  icon={item.data.icon}
                  isOpen={false}
                  windowConfig={item.data.window}
                  autoSave={item.data.autoSave}
                  isStateful={true}
                  showControls={true}
                  isInEditMode={false}
                  workspaceId={props.workspace_id}
                  desktopId={selectedDesktop.id}
                  isolated={item.data.isolated ? item.data.isolated : false}
                />
            </div>
          );
        })}
      </ResponsiveReactGridLayout>
    </div>
  );
}

NewLaunchPad.propTypes = {
  onLayoutChange: PropTypes.func.isRequired,
};

NewLaunchPad.defaultProps = {
  className: "layout",
  rowHeight: 18,
  onLayoutChange: function () {},
  cols: { lg: 4, md: 4, sm: 4, xs: 4, xxs: 4 },
  initialLayout: [],
  workspace_id: "",
};

function generateLayout(items: any) {
    log.debug("generateLayout: ");
  return _.map(_.range(0, items.length), function (item: any, i: any) {
    var y = 2;
    return {
      x: i % 4,
      y: Math.floor(i / 8) * 2,
      w: 1,
      h: 4,
      i: i.toString(),
      static: false,
      isDraggable: true,
      isResizable: true,
    };
  });
}

export default NewLaunchPad;
