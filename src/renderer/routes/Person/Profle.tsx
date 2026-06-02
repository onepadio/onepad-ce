import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Button,
} from 'reactstrap';

import * as Icon from 'react-feather';
import clsx from "clsx";
// @ts-expect-error
import userIcon from "../../images/user.png";
// @ts-expect-error
import profileIcon from "../../images/profile.png";
import { Pencil, PersonCircle } from "react-bootstrap-icons";
import "./Profile.css";

function Profile(props){
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    const profileId = useSelector((state) => state.app.profileId);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen((prevState) => !prevState);
    const [isDefault, setIsDefault] = useState(false);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        // setIsDefault(window.electronAPI.store.get("defaultProfileId") === props.id);
        setIsActive(profileId === props.id);
    }, [profileId, props.id]);

    function onSelect(){
        props.onSelect(props.id);
    }

    function onDelete(){
        props.onDelete(props.id);
    }
  
    return (
        <div className="col-6 col-md-3 col-lg-2">
                        <div className="card p-3 text-center profile profile-active">
                {
                    !isActive && !isDefault && (
                                                <div className={clsx(
                            "absolute top-1 right-0"
                        )} onClick={() => onDelete()}>
                            <Button className="bg-none border-none">
                                <Icon.X size={16}/>
                            </Button>
                        </div>
                    )
                }

                {
                    props.sync === 1 && (
                        <div className={clsx(
                            "absolute bottom-2 left-2"
                        )}>
                            <Icon.RefreshCcw size={16}/>
                        </div>
                    )
                }
                                <div className="appicon d-flex justify-content-center" onClick={() => onSelect()}>
                    <img
                    className="profile-icon"
                    src={
                        isActive ? profileIcon : userIcon
                    }
                    width={64}
                    alt=""
                    />
                    <div className="icon-middle">
                        <div className="icon-text">{props.name}</div>
                    </div>
                </div>
                <br />
                <div>
                    <span>{props.name}</span>
                </div>
            </div>
        </div>
    );
}

export default Profile;