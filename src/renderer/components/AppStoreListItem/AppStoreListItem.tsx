import './AppStoreListItem.css'
import {
    Container,
    Row,
    Col,
  } from "reactstrap";
import log from 'loglevel';

function AppStoreListItem(props: any) {
    function handleClick(event: any){
        log.debug(event.target.getAttribute('data-value'));
        props.onSelect(event.target.getAttribute('data-value'));
    }

    let iconData= localStorage.getItem(props.icon);
    return(
        <div className="col-12 store-list-item">
            <div className="card">
                <Container fluid>
                    <Row className="mb-3" onClick={handleClick} data-value={props.id}>
                        <Col xs={3} className="align-self-center"> 
                            <div className="d-flex flex-column justify-content-center">
                                <img className="store-list-icon" src={iconData} width={64} height={64} data-value={props.id} alt="App icon"/>
                            </div>
                        </Col>
                        <Col xs={8}>
                            <div className="d-flex flex-column ml-10 w-100 justify-content-start" data-value={props.id}>
                                <span className="app-name" data-value={props.id}>{props.name}</span>
                                <span className="app-description" data-value={props.id}>
                                    {props.description}
                                </span>
                            </div>
                        </Col>
                        <Col xs={1} className="align-self-center">
                            <div className="d-flex flex-column ml-auto p-2 justify-content-end" data-value={props.id}>
                                <a href="#" role="button">
                                    <i className="fa fa-chevron-right" data-value={props.id}> </i>
                                </a>  
                            </div>
                        </Col>
                    </Row> 
                </Container>
            </div>
        </div>
    )

}

export default AppStoreListItem;