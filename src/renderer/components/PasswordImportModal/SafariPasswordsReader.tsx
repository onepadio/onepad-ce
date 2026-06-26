import React, { useState, CSSProperties } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import log from 'loglevel';

import PasswordService from "../../services/password";

import {
  useCSVReader,
  lightenDarkenColor,
  formatFileSize,
} from 'react-papaparse';

const GREY = '#CCC';
const GREY_LIGHT = 'rgba(255, 255, 255, 0.4)';
const DEFAULT_REMOVE_HOVER_COLOR = '#A01919';
const REMOVE_HOVER_COLOR_LIGHT = lightenDarkenColor(
  DEFAULT_REMOVE_HOVER_COLOR,
  40
);
const GREY_DIM = '#686868';

const styles = {
  zone: {
    alignItems: 'center',
    border: `2px dashed ${GREY}`,
    borderRadius: 20,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    padding: 20,
  } ,
  file: {
    background: 'linear-gradient(to bottom, #EEE, #DDD)',
    borderRadius: 20,
    display: 'flex',
    height: 120,
    width: 120,
    position: 'relative',
    zIndex: 10,
    flexDirection: 'column',
    justifyContent: 'center',
  } ,
  info: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: 10,
    paddingRight: 10,
  } ,
  size: {
    backgroundColor: GREY_LIGHT,
    borderRadius: 3,
    marginBottom: '0.5em',
    justifyContent: 'center',
    display: 'flex',
  },
  name: {
    backgroundColor: GREY_LIGHT,
    borderRadius: 3,
    fontSize: 12,
    marginBottom: '0.5em',
  } ,
  progressBar: {
    bottom: 14,
    position: 'absolute',
    width: '100%',
    paddingLeft: 10,
    paddingRight: 10,
  } ,
  zoneHover: {
    borderColor: GREY_DIM,
  } ,
  default: {
    borderColor: GREY,
  } ,
  remove: {
    height: 23,
    position: 'absolute',
    right: 6,
    top: 6,
    width: 23,
  } ,
};

export default function SafariPasswordsReader() {
  // @ts-expect-error
  const { CSVReader,readString } = useCSVReader();
  
  const personId = useSelector((state: any) => state.app.personId);
  
  const workspaces = useSelector((state: any) => state.workspace.workspaces);

  const [zoneHover, setZoneHover] = useState(false);
  const [removeHoverColor, setRemoveHoverColor] = useState(
    DEFAULT_REMOVE_HOVER_COLOR
  );

  function onUploadAccepted(results: any) {
    let row = 0;
    results.data.forEach((item: any) => {
      if(row > 0){
        let _title = item[0];
        let _url = item[1];
        let _username = item[2];
        let _password = item[3];
        let _notes = item[4];
        // @ts-expect-error
        if (!window.electronAPI?.encrypt) {
          log.warn("Password encryption is only available in Electron environment");
          return;
        }
        // @ts-expect-error
        let _encryptedPassword = window.electronAPI.encrypt.get(_password);
        if( _url && _url.length > 0 && _username && _username.length > 0 && _encryptedPassword && _encryptedPassword.length > 0){
          PasswordService.save(personId, _url, _username, _encryptedPassword, _notes, "all").then((data) => {
            log.debug("Password saved", item);
          }).catch((error) => {
            log.error("Error saving password", error);
          });
        }
      }
      row++;
    });
    setZoneHover(false);
  }

  return (
    <CSVReader
      onUploadAccepted={(results) => onUploadAccepted(results)}
      onDragOver={(event: any) => {
        event.preventDefault();
        setZoneHover(true);
      }}
      onDragLeave={(event: any) => {
        event.preventDefault();
        setZoneHover(false);
      }}
    >
      {({
        getRootProps,
        acceptedFile,
        ProgressBar,
        getRemoveFileProps,
        Remove
      }: any) => (
        <>
          <div
            {...getRootProps()}
            style={Object.assign(
              {},
              styles.zone,
              zoneHover && styles.zoneHover
            )}
          >
            {acceptedFile ? (
              <>
                {/* @ts-expect-error TS(2322): Type '{ background: string; borderRadius: number; ... Remove this comment to see the full error message */}
                <div style={styles.file}>
                  {/* @ts-expect-error TS(2322): Type '{ alignItems: string; display: string; flexD... Remove this comment to see the full error message */}
                  <div style={styles.info}>
                    <span style={styles.size}>
                      {formatFileSize(acceptedFile.size)}
                    </span>
                    <span style={styles.name}>{acceptedFile.name}</span>
                  </div>
                  {/* @ts-expect-error TS(2322): Type '{ bottom: number; position: string; width: s... Remove this comment to see the full error message */}
                  <div style={styles.progressBar}>
                    <ProgressBar />
                  </div>
                  <div
                    {...getRemoveFileProps()}
                    style={styles.remove}
                    onMouseOver={(event) => {
                      event.preventDefault();
                      setRemoveHoverColor(REMOVE_HOVER_COLOR_LIGHT);
                    }}
                    onMouseOut={(event) => {
                      event.preventDefault();
                      setRemoveHoverColor(DEFAULT_REMOVE_HOVER_COLOR);
                    }}
                  >
                    <Remove color={removeHoverColor} />
                  </div>
                </div>
              </>
            ) : (
              'Drop CSV file here or click to upload'
            )}
          </div>
        </>
      )}
    </CSVReader>
  );
}