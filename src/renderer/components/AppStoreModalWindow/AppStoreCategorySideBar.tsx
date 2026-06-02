import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import log from "loglevel";

import { WebStore} from '../../data/store';
import { RemoteStore } from '../../data/remote';
import { storeActions } from "../../store/store-slice";

import { 
  ListGroup, 
  ListGroupItem ,
  Container,
  Row,
  Col,
} from "reactstrap";
import { Folder } from "react-bootstrap-icons";

import "./AppStoreCategorySideBar.css";
import { DockerStore } from "../../data/docker";

function AppStoreCategorySideBar(props: any) {
  const dispatch = useDispatch();
  
  const activeCategory = useSelector((state: any) => state.store.activeCategory);
  
  const selectedStore = useSelector((state: any) => state.store.selectedStore);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if(selectedStore === "web"){
        setCategories(WebStore.categoriesArray);
        handleSwitchCategory(WebStore.categoriesArray[0].id);
    } else if(selectedStore === "docker"){
        setCategories(DockerStore.categoriesArray);
        handleSwitchCategory(DockerStore.categoriesArray[0].id);
    } else if(selectedStore === "remote"){
        setCategories(RemoteStore.categoriesArray);
        handleSwitchCategory(RemoteStore.categoriesArray[0].id);
    }
}, [selectedStore]);

useEffect(() => {
  log.info("Active category: ", categories);
  if(categories.length > 0){
    dispatch(storeActions.setActiveCategory(categories[0].id));
  }
}, [categories]);

  function handleSwitchCategory(categoryId: any) {
    dispatch(storeActions.setActiveCategory(categoryId));
  }

  function category(cat: any){
      if(!cat.visible) return (<></>);
      try {
        return cat.id === activeCategory ? (
          <ListGroupItem key={uuidv4()} >
              {}
              <div className="col-12 vertical-tab-item-active rounded">
                  <Container fluid>
                      <Row>
                        <Col xs={2} className="align-self-center tab-item-col" onClick={() => handleSwitchCategory(cat.id)}> 
                          <div className="appicon d-flex justify-content-center mt-2" >
                            {
                              cat.icon ? cat.icon : <></>
                            }
                          </div>
                        </Col>
                        <Col xs={8} className="align-self-center tab-item-col" onClick={() => handleSwitchCategory(cat.id)}>
                            {}
                            <div className="d-flex w-100 justify-content-start">
                                <span className="tab-title w-100">{cat.name}</span>
                            </div>
                        </Col>
                        <Col xs={2} className="align-self-center tab-item-col">
                          {}
                          <div id={"chevron"+cat.id} className="d-flex justify-content-end mr-2">
                            {/* @ts-expect-error TS(2322): Type '{ children: string; class: string; width: nu... Remove this comment to see the full error message */}
                            <i className="fa fa-chevron-right" width={16}> </i>
                          </div>
                        </Col>
                      </Row> 
                  </Container>
              </div>
          </ListGroupItem>
        ): (
          <ListGroupItem key={uuidv4()} >
              {}
              <div className="col-12 vertical-tab-item rounded">
                  <Container fluid>
                      <Row>
                        <Col xs={2} className="align-self-center tab-item-col" onClick={() => handleSwitchCategory(cat.id)}> 
                          <div className="appicon d-flex justify-content-center mt-2" >
                            {
                              cat.icon ? cat.icon : <></>
                            }
                          </div>
                        </Col>
                        <Col xs={8} className="align-self-center tab-item-col" onClick={() => handleSwitchCategory(cat.id)}>
                            {}
                            <div className="d-flex w-100 justify-content-start">
                                <span className="tab-title w-100">{cat.name}</span>
                            </div>
                        </Col>
                        <Col xs={2} className="align-self-center tab-item-col">
                  
                        </Col>
                      </Row> 
                  </Container>
              </div>
          </ListGroupItem>
        )
    } catch (error) {
        log.error(error);
        return (
        <></>
        );
    }
  }
  return (
    <div className={props.className}>
      <ListGroup className="mr-2">
        {categories.map((cat) => (  
          category(cat)
        ))}
      </ListGroup>
    </div>
  );
}

export default AppStoreCategorySideBar;