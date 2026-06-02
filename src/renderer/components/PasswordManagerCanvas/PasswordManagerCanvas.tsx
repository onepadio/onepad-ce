import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import log from 'loglevel';
import isElectron from 'is-electron';

import { passwordManagerActions } from '../../store/passwordmanager-slice';
import PasswordService from '../../services/password';
import { VersionRepository, TABLES } from '../../repository/versions';

import { Button, Dropdown, FormGroup, Input, Label, ListGroup, ListGroupItem, Offcanvas, OffcanvasBody, OffcanvasHeader } from "reactstrap";

import './PasswordManagerCanvas.css';
import { Copy, Eye } from 'react-feather';
import { EyeFill, Pencil, Plus, PlusLg, X, XLg } from 'react-bootstrap-icons';
import { modalActions } from '../../store/modal-slice';


function PasswordManagerCanvas(props: any) {
    const dispatch = useDispatch(); 
    
    const isOpen = useSelector((state: any) => state.passwordManager.isOpen);
    
    const personId = useSelector((state: any) => state.app.personId);
    
    const workspaces = useSelector((state: any) => state.workspace.workspaces);
    
    const activeTabId = useSelector((state: any) => state.session.activeTabId);

    const [searchQuery, setSearchQuery] = useState("");

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [website, setWebsite] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passwords, setPasswords] = useState([]);
    const [filteredPasswords, setFilteredPasswords] = useState([]);
    const [decryptedPassword, setDecryptedPassword] = useState("");
    const [visiblePasswordId, setVisiblePasswordId] = useState("");
    const [encryptedPassword, setEncryptedPassword] = useState("");
    const [space, setSpace] = useState("all");
    const [scope, setScope] = useState("all");
    const [dataVersion, setDataVersion] = useState("");
    

    function toggle() {
        dispatch(passwordManagerActions.togglePasswordManager());
        setShowPasswordForm(false);
    }

    function showPassword(id,pw){
        setVisiblePasswordId(id);
        setEncryptedPassword(pw);
        
    }

    function hidePassword(){
        try{
            let _pf = document.getElementById("pm-password-"+visiblePasswordId);
            _pf.classList.add('d-none');
            let _uf = document.getElementById("pm-username-"+visiblePasswordId);
            _uf.classList.remove('d-none');
            setVisiblePasswordId("");
        }catch(e){
            log.error("Error hiding password", visiblePasswordId);
        }
    }

    function copyPasswordToClipboard(){
        log.debug("copyPasswordToClipboard", decryptedPassword);
        if(isElectron()){
            // @ts-expect-error
            window.electronAPI.send("toMain", {
              action: "update-clipboard",
              value: decryptedPassword,
            });
        }
    }

    function savePassword(){
        // @ts-expect-error
        let _encryptedPassword = window.electronAPI.encrypt.get(password);
        log.debug("encryptedPassword", _encryptedPassword);
        PasswordService.save(personId, website, username, _encryptedPassword, "", space).then((data) => {
            if(scope === "all"){
                PasswordService.getAllByPersonId(personId).then((data) => {
                    log.debug("getAllByPersonId", data);
                    // @ts-expect-error
                    setPasswords(data);
                    toggleForm();
                });
            }else{
                PasswordService.getAllByPersonIdAndWorkspace(personId, scope).then((data) => {
                    log.debug("getAllByPersonIdAndWorkspace", data);
                    // @ts-expect-error
                    setPasswords(data);
                    toggleForm();
                });
            }
        });
    }

    function toggleForm(){
        setShowPasswordForm(!showPasswordForm);
        if(showPasswordForm){
            setWebsite("");
            setUsername("");
            setPassword("");
        }
    }

    function deletePassword(id){
        log.debug("deletePassword", id);
        PasswordService.delete(id).then((data) => {
            PasswordService.getAllByPersonId(personId).then((data) => {
                log.debug("getAllByPersonId", data);
                // @ts-expect-error
                setPasswords(data);
            });
        });
    }

    function showEditForm(){
        log.debug("showEditForm");
    }

    function togglePasswordImport(){
        toggle();
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        dispatch(modalActions.togglePasswordImportModal());
    }

    useEffect(() => {
        log.debug("PasswordManagerCanvas loaded");
    }, []);

    useEffect(() => {
        if(scope === "all"){
            PasswordService.getAllByPersonId(personId).then((data) => {
                // @ts-expect-error
                setPasswords(data);
            });
        }else{
            PasswordService.getAllByPersonIdAndWorkspace(personId, scope).then((data) => {
                // @ts-expect-error
                setPasswords(data);
            });
        }
    } , [scope]);

    useEffect(() => {
        setSearchQuery("");
        VersionRepository.get(TABLES.PASSWORDS).then((_dbversion) => {
            log.debug("PasswordManagerCanvas dbversion", _dbversion);
            if(isOpen && _dbversion !== dataVersion){
                PasswordService.getAllByPersonId(personId).then((data) => {
                    log.debug("getAllByPersonId", data);
                    // @ts-expect-error
                    setPasswords(data);
                    // @ts-expect-error
                    setDataVersion(_dbversion);
                });
            }
        });
        if(activeTabId !== "launchpad"){
            try{
                let _webview = document.getElementById("webview-" + activeTabId);
                // @ts-expect-error TS(2531): Object is possibly 'null'.
                let _url = _webview.getURL();
                let _hostname = new URL(_url).hostname;
                if(_hostname && _hostname !== ""){
                    let _search = _hostname.replace("www.", "").replace("http://", "").replace("https://", "");
                    setSearchQuery(_search);
                }
            }catch(e){
                log.error("Error getting hostname", e);
            }    
        }
    }, [isOpen]);

    useEffect(() => {
        if(searchQuery.length > 2){
            let _filteredPasswords = passwords.filter((password) => {
                return password.hostname.toLowerCase().includes(searchQuery.toLowerCase()) || password.username.toLowerCase().includes(searchQuery.toLowerCase());
            });
            setFilteredPasswords(_filteredPasswords);
        }else{
            setFilteredPasswords(passwords)
        }
    }, [searchQuery, passwords]);

    useEffect(() => {
        if(visiblePasswordId === "" || encryptedPassword === "") return;
        let _uf = document.getElementById("pm-username-"+visiblePasswordId);
        // @ts-expect-error
        let _decryptedPassword = window.electronAPI.decrypt.get(encryptedPassword);
        let _password_fields = document.querySelectorAll('.password-field');
        _password_fields.forEach((field) => {
            if(field.id !== "pm-password-"+visiblePasswordId){
                field.classList.add('d-none');
            }else{
                setDecryptedPassword(_decryptedPassword);
                field.classList.remove('d-none');
                _uf.classList.add('d-none');
            }
        });
    }, [visiblePasswordId, encryptedPassword]);

    return (
        <div>
          <Offcanvas
            isOpen={isOpen}
            toggle={toggle}
            direction="end"
            className="password-manager"
          >
            <OffcanvasHeader toggle={toggle}>
                            <div id="pmWindow" className="title">Password Manager</div>
            </OffcanvasHeader>
            <OffcanvasBody>
                
                <div className='content'>
                    <div className='d-flex justify-content-between mb-2'>
                        <div>Filter by workspace:</div>
                        <div>
                            <Input 
                                type="select" 
                                name="select" 
                                id="pm-filter" 
                                value={scope}
                                onChange={(e) => setScope(e.target.value)} 
                                >
                                <option value="all">All</option>
                                {
                                    workspaces.map((workspace) => <option value={workspace.id}>{workspace.name}</option>
                                    )
                                }
                            </Input>
                        </div>
                    </div>
                    <div className='d-flex w-100 justify-content-center search'>
                        <Input
                            id="pm-search"
                            name="pm-search-query"
                            placeholder="Search..."
                            type="search"
                            className="form-control bg-dark border-0 small text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onAbort={(e) => setSearchQuery("")}
                            aria-label="Search" aria-describedby="basic-addon2"
                        />
                    </div>
                    <div 
                        className={showPasswordForm ? 'd-flex w-100 justify-content-center passwords mt-3 short' : 'd-flex w-100 justify-content-center passwords mt-3'}
                    >
                        <ListGroup className='w-100'>
                            {
                                filteredPasswords.map((password) => {
                                    return (
                                                                                <ListGroupItem key={password.id}>
                                            <div className='d-flex w-100 justify-content-between password'>
                                                <div className='d-flex justify-content-center align-items-center password-icon d-none'>
                                                    
                                                </div>
                                                <div className='d-flex flex-column justify-content-start password-info'>
                                                            <div className='d-flex justify-content-start hostname'>{password.hostname.length > 40 ? password.hostname.substring(0,40).concat("...") : password.hostname }</div>
                                                            <div id={"pm-username-"+password.id} className='d-flex justify-content-start username'>{password.username}</div>
                                                            <div id={"pm-password-"+password.id} className='d-flex justify-content-start password-field d-none'>{decryptedPassword}</div>
                                                </div>
                                                <div className='d-flex align-items-center'>
                                                    <div 
                                                        className='password-action-icon' 
                                                        onMouseLeave={() => hidePassword()}
                                                        onMouseEnter={() => showPassword(password.id, password.password)}
                                                        >
                                                        {
                                                            visiblePasswordId === password.id ? (
                                                                <EyeFill className='m-1' size={20} />
                                                            ) : (
                                                                <Eye className='m-1' size={20} />
                                                            )
                                                        }
                                                    </div>
                                                    <div className='password-action-icon' onClick={() => copyPasswordToClipboard()}>
                                                        <Copy className='m-1' size={20}    />
                                                    </div>
                                                    <div className='password-action-icon' onClick={() => showEditForm()}>
                                                        <Pencil className='m-1' size={18}   />
                                                    </div>
                                                                                                        <div className='password-action-icon' onClick={() => deletePassword(password.id)}>
                                                        <X className='m-1' size={20}  />
                                                    </div>
                                                </div>
                                            </div>
                                        </ListGroupItem>
                                    )
                                })
                            }
                        </ListGroup>

                    </div>
                </div>
                {
                    showPasswordForm ? (<></>) : (
                        <div className='import-button'>
                            <Button color='primary' onClick={() => togglePasswordImport()}>Import</Button>
                        </div>
                    )
                }
                <div className={showPasswordForm ? "d-flex flex-column new-password-form w-100 show" : "d-flex flex-column w-100 new-password-form"}>
                    <div className='add-button'>
                        {
                            showPasswordForm ? (
                                <div  onClick={() => toggleForm()}>
                                    <XLg size={18} color='white' />
                                </div>
                            ) : (
                                <div onClick={() => toggleForm()}>
                                    <PlusLg size={20} color='white' />
                                </div>
                            )
                        }
                    </div>
                    <div className='d-flex flex-column w-100 body'>
                        <FormGroup className='align-left website'>
                            <Label for="website">
                                Space
                            </Label>
                            <Input
                                id="pm-scope"
                                name="pm-scope"
                                placeholder=""
                                type="select"
                                value={space}
                                onChange={(e) => setSpace(e.target.value)}
                            >
                                <option value="all">All</option>
                                {
                                    workspaces.map((workspace) => <option value={workspace.id}>{workspace.name}</option>
                                    )
                                }
                            </Input>
                        </FormGroup>
                        <FormGroup className='align-left website'>
                            <Label for="website">
                                Website
                            </Label>
                            <Input
                                id="pm-website"
                                name="pm-website"
                                placeholder=""
                                type="text"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                            />
                        </FormGroup>
                        <FormGroup className='align-left'>
                            <Label for="username">
                                Username
                            </Label>
                            <Input
                                id="pm-username"
                                name="pm-username"
                                placeholder=""
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            
                            />
                        </FormGroup>
                        <FormGroup className='align-left'>
                            <Label for="password">
                                Password
                            </Label>
                            <Input
                                id="pm-password"
                                name="pm-password"
                                placeholder=""
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </FormGroup>
                        <div className='d-flex justify-content-center'>
                            <Button color='primary' onClick={()=> savePassword()}>Save</Button>
                        </div>

                    </div>
                </div>

            </OffcanvasBody>
            </Offcanvas>
        </div>
    );    
}

export default PasswordManagerCanvas;