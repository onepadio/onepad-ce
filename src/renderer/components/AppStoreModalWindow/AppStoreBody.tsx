import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';

import { Button, ListGroup,ListGroupItem } from 'reactstrap';
import * as Icon from 'react-feather';

import { modalActions } from "../../store/modal-slice";
import { loadApps, searchApp } from '../../services/switchpad-api';
import { WebStore } from '../../data/store';
import { RemoteStore } from '../../data/remote';


import AppStoreListItem from '../AppStoreListItem/AppStoreListItem';
import AppStoreSearch from '../AppStoreSearch/AppStoreSearch';
import AppCard from './AppCard';
import './AppStoreBody.css';
import { DockerStore } from '../../data/docker';
import UserAppService from '../../services/userapp';


function AppStoreBody(props){
    const dispatch = useDispatch();

    const categoryId = useSelector((state: any) => state.store.activeCategory);

    const searchQuery = useSelector((state: any) => state.store.searchQuery);

    const selectedStore = useSelector((state: any) => state.store.selectedStore);

    const profileId = useSelector((state: any) => state.app.profileId);

    const userAppsVersion = useSelector((state: any) => state.app.userAppsVersion);

    const [isLoaded, setIsLoaded] = useState(true);
    const [allItemsArray, setAllItemsArray] = useState([]);
    const [items, setItems] = useState([]);
    const [query, setQuery] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [storeItems, setStoreItems] = useState([]);
    const [userApps, setUserApps] = useState([]);

    const [categoriesDict, setCategoriesDict] = useState({});
    const [itemsDb, setItemsDb] = useState({});

    const toggleAppStore = () => {
        dispatch(modalActions.toggleAppStore({}));
    }
    const toggleAddLinkModal = () => {
        dispatch(modalActions.toggleAddLinkModal({}));
    }

    useEffect(() => {
        let _items = {};
        if(selectedStore === "web"){
            _items = Object.assign({}, WebStore.itemsDb);
            setCategoriesDict(Object.assign({}, WebStore.categoriesDict));
            setItemsDb(Object.assign({}, WebStore.itemsDb));
        } else if(selectedStore === "docker"){
            _items = Object.assign({}, DockerStore.itemsDb);
            setCategoriesDict(Object.assign({}, DockerStore.categoriesDict));
            setItemsDb(Object.assign({}, DockerStore.itemsDb));
        } else if(selectedStore === "remote"){
            _items = Object.assign({}, RemoteStore.itemsDb);
            setCategoriesDict(Object.assign({}, RemoteStore.categoriesDict));
            setItemsDb(Object.assign({}, RemoteStore.itemsDb));
        } else {
            log.error("Invalid store selected: " + selectedStore);
        }
        let _all = [];
        Object.keys(_items).forEach((key) => {
            let _item = Object.assign({}, _items[key]);
            _item.id = key;
            _all.push(_item);
        });
        setAllItemsArray(_all);

        // Load user apps
        if(profileId) {
            UserAppService.getAllByProfileId(profileId).then((apps: any) => {
                log.debug("Loaded user apps:", apps);
                setUserApps(apps || []);
            }).catch((error) => {
                log.error("Error loading user apps:", error);
            });
        }
    }, [selectedStore, profileId, userAppsVersion]);

    useEffect(() => {
        if(categoryId === "" || categoryId === undefined) return;
        
        // Check if this is MyApps category (id: 999)
        if(categoryId === 999) {
            if(searchQuery.length > 2){
                try{
                    let _items = userApps.filter((item: any) => {
                        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
                    });
                    // Convert user apps to store items format
                    let convertedItems = _items.map((app: any) => ({
                        id: app.id,
                        name: app.name,
                        isUserApp: true,
                    }));
                    setStoreItems(convertedItems);
                }catch(e){
                    log.error(e);
                }
            } else {
                // Convert user apps to store items format
                let convertedItems = userApps.map((app: any) => ({
                    id: app.id,
                    name: app.name,
                    isUserApp: true,
                }));
                setStoreItems(convertedItems);
            }
        } else {
            if(!categoriesDict[categoryId]) return;
            if(searchQuery.length > 2){
                try{
                    let _items = allItemsArray.filter((item) => {
                        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
                    });
                    setStoreItems(_items);
                }catch(e){
                    log.error(e);
                }
            }else{
                setStoreItems(categoriesDict[categoryId].items);
            }
        }
    }, [categoryId, searchQuery, categoriesDict, itemsDb, userApps]);

    function saveIcon(icon){
        let reader = new FileReader();
        reader.onload = function() {
            // @ts-expect-error
            localStorage.setItem(icon, reader.result);
        };
        reader.onerror = function() {
            log.error(reader.error);
        };

    }

    async function loadImage(id,url){
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], `${id}.png`, {type: blob.type});
        return file;
    }

    function processItem(data, item, cache){
        if(!localStorage.hasOwnProperty(item.icon)){
            saveIcon(item.icon);
        }
        let _item= Object.assign({}, item);
        _item.index = cache.length;
        cache.push(item);
        if(cache.length === data.length){
            setItems(cache);
            setIsLoaded(true);
        }
    }

    function fetchApps(){
        setIsSearching(false);
        const _items = [];
        loadApps().then((data: any) => {
            data.map(
                (item) => {
                    processItem(data, item, _items);
                }
            )
        });
    }


    function filter(query){
        // TODO Log the queries for future...
        setQuery(query);
        setIsSearching(true);
        const _items = [];
        searchApp(query).then((data: any) => {
            if(data.length === 0){
                setItems([]);
                setIsLoaded(true);
                return;
            }
            data
            .sort((a, b) => a.name > b.name ? 1 : -1)
            .map(
                (item) => {
                    processItem(data, item, _items);
                }
            )
        });
    }

    function handleClickOnAddButton(){
        toggleAppStore();
        toggleAddLinkModal();
    }

    useEffect(() => {
        //fetchApps();
        //log.debug("AppStoreBody: useEffect", itemsDb);
        //setIsSearching(false);
    }, []);

    const searchBar = (
        <div className="row mr-2 ml-1">
            <AppStoreSearch id="storeSearchBar" filter={filter} reload={fetchApps} />
        </div>
    );

    const  results = (
        <div className='row w-100'>
            {   storeItems
                .sort((a, b) => a.name > b.name ? 1 : -1)
                .map(
                    item => {
                        // Check if this is a user app
                        if(item.isUserApp) {
                            const userApp = userApps.find((app: any) => app.id === item.id);
                            if(userApp) {
                                return (
                                    <AppCard 
                                        key={userApp.id} 
                                        id={userApp.id} 
                                        data={{
                                            name: userApp.name,
                                            description: userApp.description,
                                            company: userApp.company,
                                            website: userApp.url,
                                            category: 'My Apps',
                                            login: userApp.url,
                                            icon: userApp.icon,
                                        }}
                                        name={userApp.name} 
                                        description={userApp.description} 
                                        company={userApp.company} 
                                        website={userApp.url} 
                                        category="My Apps" 
                                        url={userApp.url} 
                                        icon={userApp.icon} 
                                        store={selectedStore}
                                        isUserApp={true}
                                    />
                                )
                            } else {
                                return <></>;
                            }
                        } else {
                            if(item !== undefined && item !== null && itemsDb[item.id] !== undefined && itemsDb[item.id] !== null){
                                return (
                                    <AppCard key={item.id} id={item.id} data={itemsDb[item.id]} name={itemsDb[item.id].name} description={itemsDb[item.id].description} company={itemsDb[item.id].company} website={itemsDb[item.id].website} category={itemsDb[item.id].category} url={itemsDb[item.id].login} icon={itemsDb[item.id].icon} store={selectedStore}/>
                                )
                            } else {
                                log.error("AppStoreBody: item is undefined", item);
                                return <></>;
                            }
                        }
                    }
                )
            }
        </div>
    );

    if(isSearching){
        return(
            <div className="container">
            {}
            <div className="store-category">
                {}
                <div className='d-flex flex-row'>
                                        <span className='category-title ml-1 mt-3'>Results for "{query}"</span>
                                        <div className="ml-auto p-2 see-all"> <a href='#'>See all</a></div>
                </div>
                {
                    items.length === 0 ? (
                        <>
                            {}
                            <div className="col-12">
                                {}
                                <div className="card">
                                    <h6>No app results found. We are working hard to expand the store. You can still add bookmark by web address or submit your request if you would like to see this app here.</h6>
                                    {}
                                    <div className="d-flex justify-content-between install mt-3">
                                        <Button color="primary" onClick={() => handleClickOnAddButton()}>
                                            <Icon.Bookmark size={24} className="mr-1" />
                                        </Button>
                                        <Button color="primary">
                                           Submit Request
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : results
                }
            </div>
        </div>
        );
    }else{
        if(isLoaded){
            return (
                <div className="container">

                    {}
                    <div className="store-category">
                        {results}
                    </div>
                </div>
            );
        }else{
            return (
                <div className="container">

                    {}
                    <div className="store-category">
                        {}
                        <div className='d-flex flex-row'>
                            {}
                            <span className='category-title ml-1 mt-3'>{props.name}</span>
                                                        <div className="ml-auto p-2 see-all"> <a href='#'>See all</a></div>
                        </div>
                        <div>Loading...</div>
                    </div>
                </div>
            );
        }
    }

}

export default AppStoreBody;
