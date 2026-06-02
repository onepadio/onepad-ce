import { v4 as uuidv4 } from "uuid";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {loadStripe} from '@stripe/stripe-js';
import StripeApi from "../../api/StripeApi";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';

import { Button, ModalHeader, ModalBody, ModalFooter, Spinner } from "reactstrap";

import InvisibleModal from "../lib/InvisibleModal";

import { modalActions } from "../../store/modal-slice";
import { userActions } from "../../store/user-slice";
import { appActions } from "../../store/app-slice";

// @ts-expect-error
import sign_up_compare from '../../images/sign_up_compare.png';
import log from 'loglevel';

import "./StripeModal.css";
import UserApi from "../../api/UserApi";

function StripeModalWindow(props: any) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const isStripeModalOpen = useSelector((state: any) => state.modal.isStripeModalOpen);
  
  const paymentCycle = useSelector((state: any) => state.app.paymentCycle);
  
  const deviceId = useSelector((state: any) => state.app.deviceId);
  
  const userId = useSelector((state: any) => state.user.id);
  
  const userEmail = useSelector((state: any) => state.user.email);
  
  const version = useSelector((state: any) => state.app.version);
  
  const stripeKey = useSelector((state: any) => state.app.stripeKey);
  
  const priceId = useSelector((state: any) => state.app.priceId);

  const _stripeKey = (version.includes("beta") || version.includes("dev")) ? stripeKey.test : stripeKey.live;
  // const stripeKey = (version.includes("beta") || version.includes("dev")) ? "pk_test_36kVIoR3YhN4OX3MtrqjdvfG" : "pk_live_98EweSpekgs8AdGDRjqHPt2v";
  const [stripePromise, setStripePromise] = useState(() => loadStripe(_stripeKey))

  const [clientSecret, setClientSecret] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const onComplete = () => handleComplete();

  function toggle() {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleStripeModalWindow());
  }

  function onSignIn() {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleStripeModalWindow());
  }

  useEffect(() => {

  }, []);

  useEffect(() => {
    if(!isStripeModalOpen){
        return;
    }
    //let priceId = paymentCycle === "yearly" ? "price_1Ol8viJwYjkKyg9MZM8GwOd3" : "price_1Ol8viJwYjkKyg9MAv8jUl4G";
    let _priceId = paymentCycle === "yearly" ? priceId.live.annual : priceId.live.monthly;
    if(version.includes("beta") || version.includes("dev")){
        // priceId = paymentCycle === "yearly" ? "price_1OiZVPJwYjkKyg9MnQVP6cef" : "price_1OiZUUJwYjkKyg9M8GcASu6Y";
        _priceId = paymentCycle === "yearly" ? priceId.test.annual : priceId.test.monthly;
    }
    
    StripeApi.createCheckoutSession(_priceId, deviceId, userId, userEmail).then((data: any) => {
        log.debug("StripeApi.createCheckoutSession", data);
        setClientSecret(data.clientSecret);
        setSessionId(data.sessionId);
    }).catch((error) => {
        console.error('Error:', error);
    });
  }, [isStripeModalOpen, paymentCycle, deviceId, userId, userEmail, isStripeModalOpen]);

  function handleComplete(){
    StripeApi.sessionStatus(sessionId).then((data: any) => {
        log.debug("StripeApi.sessionStatus", data);
        // setPaymentStatus(data.payment_status);
        if(data.status === 'complete'){
            UserApi.getUserById(userId).then((response) => {
                log.debug("getUserById response: ", response);
                // dispatch(userActions.setProduct(response.productName));
                // updateLimits(response);
            }).catch((error) => {
                console.error('Error:', error);
            });
        }
        setIsComplete(true);
    }).catch((error) => {
        console.error('Error:', error);
    });
    //handle if payment falied
    // result.error ? log.debug("Payment failed", result.error) : log.debug("Payment successful", result.paymentIntent);
  }

  return (
    <div>
      <InvisibleModal className='stripe-modal' id={uuidv4()} heading="" show={isStripeModalOpen} onClose={() => toggle()}>
        <div className="spinner">
            <Spinner color="primary" />
        </div>
        {
            false ? (
                <div id="checkout-complete">
                    <h1>Thank you for your purchase!</h1>
                    <Button color="primary" onClick={toggle}>
                        Close
                    </Button>
                </div>
            ): (
                <div id="checkout" className="checkout-body">
                    {clientSecret && isStripeModalOpen && (
                        <EmbeddedCheckoutProvider
                            stripe={stripePromise}
                            options={{
                                clientSecret,
                                onComplete: onComplete
                            }}
                            // @ts-expect-error
                            metadata={{
                                customerEmail: 'test@gmail.com'
                            }}
                            
                        >
                            {/* @ts-expect-error TS(2322): Type '{ onComplete: () => void; }' is not assignab... Remove this comment to see the full error message */}
                            <EmbeddedCheckout onComplete={handleComplete} />

                        </EmbeddedCheckoutProvider>
                    )}
                </div>
            )
        }
        {
            false && (
                <Button className="mt-2" color="secondary" onClick={toggle}>
                    Cancel
                </Button>
            )
        }
        
      </InvisibleModal>
    </div>
  );
}

export default StripeModalWindow;
