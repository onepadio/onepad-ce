import React, {useEffect, useState} from 'react';
import "./DigitalClock.css"

function DigitalClock(){
    let time  = new Date().toLocaleTimeString().split(":").slice(0,2).join(":");
    let date = new Date().toLocaleDateString();
    const [ctime,setTime] = useState(date+" "+time);

    const UpdateTime=()=>{
        date = new Date().toLocaleDateString();
        time =  new Date().toLocaleTimeString().split(":").slice(0,2).join(":");;
        setTime(date+" "+time)
    }
    useEffect(()=>{
        setInterval(UpdateTime)
    },[])
    return (
        <div className='d-flex justify-content-end w-100 h-100 clock '>
            <div className='align-self-center clock'>
                {ctime}
            </div>
        </div>
    )
}
export default DigitalClock;