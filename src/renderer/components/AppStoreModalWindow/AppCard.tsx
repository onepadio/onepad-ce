import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';
import { getAppDetails } from '../../services/switchpad-api';
import { modalActions } from '../../store/modal-slice';
import { storeActions } from '../../store/store-slice';
import { appActions } from '../../store/app-slice';

import "./AppCard.css";
import { Button } from 'reactstrap';
import { Play, Plus, Pencil, Trash } from 'react-bootstrap-icons';
import UserAppService from '../../services/userapp';

function AppCard(props){
    const dispatch = useDispatch();

    const selectedStore = useSelector((state: any) => state.store.selectedStore);

    const toggle = () => props.toggle(!props.isOpen);
    const [appName, setAppName] = useState("");
    const [appDescription, setAppDescription] = useState("");
    const [appIcon, setAppIcon] = useState("");
    const [appCategory, setAppCategory] = useState("");
    const [appInstalled, setAppInstalled] = useState(0);

    function getDetails(){
        getAppDetails(props.appid).then((data: any) => {
            log.debug(data);
            setAppName(data.name);
            // setCompany(data.company);
            setAppCategory(data.category);
            setAppDescription(data.description);
            // setWebSite(data.website);
            setAppIcon(localStorage.getItem(data.icon));
          });
    }

    function handleClickOnAddButton(event){
        log.debug("AppCard: handleClickOnAddButton", props.data);
        if(props.isUserApp){
            // For user apps, just open the Add Link modal with the user app data
            dispatch(storeActions.setSearchQuery(""));
            dispatch(storeActions.setActiveCategory(1));
            dispatch(modalActions.toggleAppStoreModal({}));
            dispatch(modalActions.toggleAddLinkModal({data: {
                url: props.url,
                title: props.name,
            }}));
        }else if(selectedStore === "web"){
            dispatch(storeActions.setSearchQuery(""));
            dispatch(storeActions.setActiveCategory(1));
            dispatch(modalActions.toggleAppStoreModal({}));
            dispatch(modalActions.setSelectedAppStoreItem(props.id));
            dispatch(modalActions.toggleAddLaunchIconModal({}));
        }else if(selectedStore === "docker"){
            dispatch(modalActions.toggleAppStoreModal({}));
            dispatch(modalActions.setSelectedDockerApp(props.data));
            dispatch(modalActions.toggleRunDockerModal({}));
        }else{
            dispatch(modalActions.toggleAppStoreModal({}));
            dispatch(modalActions.setSelectedRemoteApp(props.data));
            dispatch(modalActions.toggleRemoteLaunchModal({}));
        }
    }

    function handleEditUserApp(){
        log.debug("Edit user app:", props.id);
        // Open edit modal with user app data
        dispatch(modalActions.toggleEditUserAppModal({data: {
            id: props.id,
            name: props.name,
            url: props.url,
            icon: props.icon,
            description: props.description,
            company: props.company,
        }}));
    }

    function handleDeleteUserApp(){
        if(window.confirm("Are you sure you want to delete '" + props.name + "' from My Apps?")){
            UserAppService.delete(props.id).then(() => {
                log.debug("Deleted user app:", props.id);
                // Dispatch action to refresh user apps list
                dispatch(appActions.refreshUserApps());
            }).catch((error) => {
                log.error("Error deleting user app:", error);
                alert("Error deleting app: " + error);
            });
        }
    }

    function handleOnClick(){
        return () => {
            window.open(props.website, "_blank");
            toggle();
        }
    }

    function getIconSrc(){
        // Check if icon is already a full URL (http://, https://, data:, or blob:)
        if(props.icon && (
            props.icon.startsWith('http://') || 
            props.icon.startsWith('https://') || 
            props.icon.startsWith('data:') ||
            props.icon.startsWith('blob:')
        )){
            return props.icon;
        }
        // Otherwise, it's a store icon filename
        // Return the path - fallback will be handled by onError event
        if(props.icon){
            return "./images/store/icon/" + props.icon;
        }
        return "./images/default_icon.png";
    }

    function handleImageError(e: any){
        // Fallback to default icon if image fails to load
        e.target.src = "./images/default_icon.png";
    }

    useEffect(() => {
        props.description.length > 100 ? setAppDescription(props.description.substring(0, 100) + "...") : setAppDescription(props.description);
    }, [props.id]);
    return (
        <div className="col-6 app-card bg-dark">
            <div className="card p-3 border-bottom rounded-0">
                <div className="d-flex flex-row mb-3">
                    {
                        props.store === "docker" ? (
                            <svg
                                viewBox="0 0 24 24"
                                width="70"
                                height="70"
                                fill="#808080"
                                xmlns="http://www.w3.org/2000/svg"
                                className="MuiSvgIcon-root MuiSvgIcon-colorSecondary MuiSvgIcon-fontSizeMedium"
                                focusable="false"
                                aria-hidden="true"
                                data-testid="repository-default-logo"
                            >
                                <path
                                    d="M20.5 7.27783L12 12.0001M12 12.0001L3.49997 7.27783M12 12.0001L12 21.5001M21 16.0586V7.94153C21 7.59889 21 7.42757 20.9495 7.27477C20.9049 7.13959 20.8318 7.01551 20.7354 6.91082C20.6263 6.79248 20.4766 6.70928 20.177 6.54288L12.777 2.43177C12.4934 2.27421 12.3516 2.19543 12.2015 2.16454C12.0685 2.13721 11.9315 2.13721 11.7986 2.16454C11.6484 2.19543 11.5066 2.27421 11.223 2.43177L3.82297 6.54288C3.52345 6.70928 3.37369 6.79248 3.26463 6.91082C3.16816 7.01551 3.09515 7.13959 3.05048 7.27477C3 7.42757 3 7.59889 3 7.94153V16.0586C3 16.4013 3 16.5726 3.05048 16.7254C3.09515 16.8606 3.16816 16.9847 3.26463 17.0893C3.37369 17.2077 3.52345 17.2909 3.82297 17.4573L11.223 21.5684C11.5066 21.726 11.6484 21.8047 11.7986 21.8356C11.9315 21.863 12.0685 21.863 12.2015 21.8356C12.3516 21.8047 12.4934 21.726 12.777 21.5684L20.177 17.4573C20.4766 17.2909 20.6263 17.2077 20.7354 17.0893C20.8318 16.9847 20.9049 16.8606 20.9495 16.7254C21 16.5726 21 16.4013 21 16.0586Z" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17.9607 12.2828V15.2415" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.1797 13.7622V16.7208" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        ) : (
                            <img src={getIconSrc()} alt="" width="70" height="70" onError={handleImageError} style={{borderRadius: '10%', border: '1px solid #808080', padding: '2px', backgroundColor: '#1b1b1b'}}/>
                        )
                    }
                    <div className="d-flex flex-column align-items-start ml-2">
                        <span>{props.name}</span>
                        <span className="text-muted text-sm">{props.category}</span>
                        <span className="ratings">
                            <i className="fa fa-star"></i><i className="fa fa-star"></i><i className="fa fa-star"></i><i className="fa fa-star"></i>
                        </span>
                    </div>
                </div>
                                <div className="d-flex flex-row app-description mb-4">
                    <div>{appDescription}</div>
                    {
                        props.description.length < 50 ? (
                            <>
                                <br/> <br/>
                            </>
                        ) : ""
                    }
                </div>

                                <div className="company-name" onClick={handleOnClick()}>
                    <span>{props.company}</span>
                </div>

                <div className="install-button ">
                    <Button color="primary" onClick={handleClickOnAddButton}>
                        {
                            props.store === "docker" ? (
                                <Play size={24}/>
                            ) : (
                                <Plus size={24}/>
                            )
                        }
                    </Button>
                    {
                        props.isUserApp && (
                            <>
                                <Button color="secondary" className="ml-2" onClick={handleEditUserApp}>
                                    <Pencil size={20}/>
                                </Button>
                                <Button color="danger" className="ml-2" onClick={handleDeleteUserApp}>
                                    <Trash size={20}/>
                                </Button>
                            </>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default AppCard;
