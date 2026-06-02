import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { modalActions } from "../../store/modal-slice";
import { Stage } from "@react-three/drei";
import { Layer, Rect, Text } from "react-konva";


function SpaceIcon() {
    const dispatch = useDispatch();
    
    const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);
    const icon = useRef(null);

    useEffect(() => {
        if (workspace?.config && workspace.config.iconType === "image") {
            icon.current = (
              <img
                width={32}
                className="spacepad-icon"
                src={workspace.config.icon}
                alt=""
                // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                onClick={() => dispatch(modalActions.toggleSpacePad()) }
              />
            );
          } else {
            icon.current = (
              <Stage
                // @ts-expect-error
                width={32}
                height={32}
                className="d-flex justify-content-center align-items-center w-100 spacepad-icon"
                // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                onClick={() => dispatch(modalActions.toggleSpacePad()) }
              >
                <Layer>
                  <Rect
                    x={2}
                    y={2}
                    width={28}
                    height={28}
                    fill={
                      workspace.config && workspace.config.color
                        ? workspace.config.color
                        : "#" +
                          (((1 << 24) * Math.random()) | 0)
                            .toString(16)
                            .padStart(6, "0")
                    }
                    shadowBlur={10}
                    cornerRadius={5}
                  />
                </Layer>
                <Layer>
                  <Text
                    x={4}
                    y={8}
                    text={
                      workspace.config && workspace.config.alias
                        ? workspace.config.alias
                        : workspace.name?.toUpperCase().slice(0, 2)
                    }
                    fontSize={18}
                    fill="white"
                  />
                </Layer>
              </Stage>
            );
          }
    }, [workspace, dispatch]);

    return (
        <>
            {icon.current}
        </>
    );

}

    

  export default SpaceIcon;