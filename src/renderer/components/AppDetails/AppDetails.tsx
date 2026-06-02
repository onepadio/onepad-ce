import React, { useState, useEffect } from 'react';
import log from 'loglevel';
import { getAppDetails } from '../../services/switchpad-api';
import './AppDetails.css'

import { Button, Offcanvas, OffcanvasHeader, OffcanvasBody } from 'reactstrap';

function AppDetails(props: any){
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
            setAppCategory(data.category);
            setAppDescription(data.description);
            setAppIcon(localStorage.getItem(data.icon));
          });
    }

    function handleClickOnAddButton(event: any){
        props.openAddIconModal(props.appid);
    }

    
    return (
            <Offcanvas
                isOpen={props.isOpen}
                toggle={toggle}
                direction="end"
                className='store app-details'
                onOpened={getDetails}
            >
                <OffcanvasHeader toggle={toggle}>
                    {}
                    <div className="store-title">
                        Apps
                    </div>
                </OffcanvasHeader>
                <OffcanvasBody>
                    {}
                    <div className="col-12">
                        {}
                        <div className="card p-3"> 
                            {}
                            <div className="d-flex flex-row mb-3">
                                <img src={appIcon} alt="" width="70"/>
                                    {}
                                    <div className="d-flex flex-column ml-2">
                                        <span>{appName}</span>
                                        <span>{appCategory}</span>
                                        {}
                                        <span className="ratings">
                                            {}
                                            <i className="fa fa-star"></i><i className="fa fa-star"></i><i className="fa fa-star"></i><i className="fa fa-star"></i>
                                        </span>
                                    </div>
                            </div>
                            <h6>{appDescription}</h6>
                            {}
                            <div className="d-flex justify-content-between install mt-3">
                                <span>Installed {appInstalled} times</span>
                                <Button color="primary" onClick={handleClickOnAddButton}>
                                    {}
                                    <i className="fa fa-plus"/>
                                </Button>
                            </div>
                        </div>
                    </div>
                </OffcanvasBody>
            </Offcanvas>
    );
    
    
}

export default AppDetails;