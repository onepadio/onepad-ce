import { useNavigate, useLocation } from "react-router";
import React, { useState, useEffect } from "react";
import log from 'loglevel';

import { Button } from "reactstrap";

import * as Icon from "react-feather";
import clsx from "clsx";

// @ts-expect-error
import userIcon from "../../images/user.png";
// @ts-expect-error
import profileIcon from "../../images/profile.png";
import { useSelector } from "react-redux";

export default function EditProfile() {
  const route = useSelector((state: any) => state.session.route);
  const location = useLocation();
  const navigate = useNavigate();
  let from = location.state?.from?.pathname || "/";

  const [profiles, setProfiles] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});

  useEffect(() => {
    // @ts-expect-error
    if (!window.electronAPI?.store) {
      log.warn("Profile store access is only available in Electron environment");
      return;
    }
    // @ts-expect-error
    let _profilesMap = window.electronAPI.store.get("profiles");
    let _profiles: any = [];
    Object.keys(_profilesMap).forEach((key) => {
      log.debug("Key: ", key);
      log.debug("Value: ", _profilesMap[key]);
      _profiles.push(_profilesMap[key]);
    });
    setProfilesMap(_profilesMap);
    setProfiles(_profiles);
  }, []);

  return (
    <>
      <div className="profiles">
        {}
        <div className="container-fluid">
          {}
          <div className="row d-flex justify-content-start mt-2 mb-2">
            <Button>
              <Icon.ArrowLeft />
            </Button>
          </div>
          {}
          <div className="row d-flex justify-content-center appicon mb-2">
            {}
            <div className="card p-3 text-center profile">
              {}
              <div className="appicon d-flex justify-content-center">
                {}
                <img className="profile-icon" src={userIcon} width={64} alt="" />
              </div>
            </div>
          </div>
          {}
          <div className="row d-flex justify-content-center appicon">
            {}
            <div className="card p-3 text-center profile">
              
            </div>
          </div>
          {}
          <div className="row d-flex justify-content-center mb-2">
            <b> New Profile </b> <br />
            With OnePad profiles you can separate all of your stuff. Create
            profiles for friends and family, or split between work and fun.
          </div>
          {}
          <div className="row profile-list">
            {}
            <div className="col-12 d-flex justify-content-center">
              <div className="row w-100">
                {profiles.map((profile) => (
                  <div key={profile.id} className="col-6 col-md-3 col-lg-2">
                    {}
                    <div className="card p-3 text-center profile">
                      {}
                      <div className="appicon d-flex justify-content-center">
                        <img
                          className="profile-icon"
                          src={userIcon}
                          width={64}
                          alt=""
                        />
                        {}
                        <div className="icon-middle">
                          {}
                          <div className="icon-text">{profile.name}</div>
                        </div>
                      </div>
                      <br />
                      <div>
                        {}
                        <span>{profile.name}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <div
                  id="addProfileButton"
                  className="col-6 col-md-3 col-lg-2 launch-item addProfileButton h-100"
                >
                  <div
                    className="card p-3 text-center"
                    onClick={() => navigate("/profile")}
                  >
                    <br />
                    {}
                    <div className="d-flex justify-content-center">
                      <Button
                        width={72}
                        height={72}
                        className={clsx(
                          "addButton transition-colors rounded-circle"
                        )}
                        title="Add Profile"
                      >
                        <Icon.Plus size={36} />
                      </Button>
                      {}
                      <div className="icon-middle">
                        {}
                        <div className="icon-text">Add Profile</div>
                      </div>
                    </div>

                    <div>
                      <br />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
