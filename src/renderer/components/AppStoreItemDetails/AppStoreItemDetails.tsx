import './AppStoreItemDetails.css'

function AppStoreItemDetails(props: any){

    var icon_url = "http://static.shortpath.link/icon/"+props.icon;
    return(
        <div className="col-12">
            <div className="card p-3"> 
                <div className="d-flex flex-row mb-3">
                    <img src={icon_url} alt="" width="70"/>
                    <div className="d-flex flex-column ml-2">
                        <span>{props.name}</span>
                        <span className="text-black-50">{props.category}</span>
                        <span className="ratings">
                            <i className="fa fa-star"></i><i className="fa fa-star"></i><i className="fa fa-star"></i><i className="fa fa-star"></i>
                        </span>
                    </div>
                </div>
                <h6>{props.description}</h6>
                <div className="d-flex justify-content-between install mt-3">
                    <span>Installed {props.count} times</span>
                    <span className="text-primary">Add</span>
                </div>
            </div>
        </div>
    )
}

export default AppStoreItemDetails;