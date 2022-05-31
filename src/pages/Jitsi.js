// import { setupScreenSharingRender } from '@jitsi/electron-sdk';
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

function JitsiComponent() {
    const params = useParams();

    useEffect(() => {
        if (window.JitsiMeetExternalAPI) {
            startMeet();
        } else {
            alert("Jitsi Meets not available");
        }
    })
   
    function startMeet() {

        let isMuted = false;
        
        const options = {
            roomName: params.id,
            configOverwrite: {
                disableDeepLinking: true,
                startWithVideoMuted: isMuted,
                startWithAudioMuted: isMuted,
            },
            parentNode: document.querySelector('#meet'),
            userInfo: {
                displayName: "John Doe",
            },
        }

        let api = new window.JitsiMeetExternalAPI('meet.jit.si', options)
        api.addEventListeners({
            readyToClose: () => {
                this.props.navigation('/')
                return
            }
        })
        window.jitsiNodeAPI.setupRenderer(api, {
            enableRemoteControl: false,
            enableAlwaysOnTopWindow: true
        });
        // setupScreenSharingRender(api);
    }

    return (
        <>
            <div id="meet" style={{width: "100%", height: "100vh"}}></div>
        </>
    )
}

export default JitsiComponent;