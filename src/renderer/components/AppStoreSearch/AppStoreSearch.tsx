import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { storeActions } from '../../store/store-slice';
import './AppStoreSearch.css'

function AppStoreSearch(props){
    const dispatch = useDispatch();
    
    const searchQuery = useSelector((state: any) => state.store.searchQuery);

    const [query, setQuery] = useState("");

    useEffect(() => {
        dispatch(storeActions.setSearchQuery(query));
    }, [query]);

    function handleSearch(){
        if (query.length > 2) {
            dispatch(storeActions.setSearchQuery(query));
        }
    }

    useEffect(() => {
        if(searchQuery !== query){
            setQuery(searchQuery);
        }
    }, [searchQuery]);

    return(
                <form className="d-none d-sm-inline-block form-inline mr-3 store-search"
        onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
        >
                        <div id="storeSearchBox" className="input-group">
                {}
                <div className="input-group-append">
                                        <button className="btn" type="button" onClick={handleSearch}>
                        {}
                        <i className="fas fa-search fa-sm"></i>
                    </button>
                </div>
                                <input type="text" className="form-control bg-dark border-0 small" placeholder="Search..."
                    aria-label="Search" aria-describedby="basic-addon2" onChange={(e) => setQuery(e.target.value)} value={query}/>
            </div>
        </form>
    )

}

export default AppStoreSearch;