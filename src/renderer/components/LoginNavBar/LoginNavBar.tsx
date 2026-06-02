import isElectron from 'is-electron';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {useLiveQuery} from 'dexie-react-hooks';
import { useSelector, useDispatch } from "react-redux";


import { 
  Navbar,
  Button,
  Fade, 
  ListGroup,
  ListGroupItem
} from 'reactstrap';
import '../SPNavBar/SPNavBar.css'
import * as Icon from 'react-feather';
import { modalActions } from '../../store/modal-slice';


function LoginNavBar(){
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function goBack(){
    navigate("/home");
    dispatch(modalActions.setOpenStripeModalWhenLoggedIn(false));
    dispatch(modalActions.setShowLoginPage(false))
  }
  
  return(
      <div className="sp-navbar">
          <Navbar className='navbar navbar-expand static-top mb-4'>
            {}
            <div className="row">
              {}
              <div className="ml-3 col-4 d-flex justify-content-start">
                <ListGroup horizontal>
                  <ListGroupItem>
                    <Button onClick={() => goBack()} color="dark">
                          <Icon.ChevronLeft/>
                    </Button>
                  </ListGroupItem>
                </ListGroup>
              </div>
              {}
              <div className="col-4 d-flex justify-content-center">
                
              </div>
              {}
              <div className="col-4 d-flex justify-content-end">
                
              </div>
            </div>
          
          </Navbar>
      </div>
  );
}

export default LoginNavBar;