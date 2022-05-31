const { ipcRenderer } = require('electron');
const {
    RemoteControl,
    setupScreenSharingRender,
    setupAlwaysOnTopRender,
    initPopupsConfigurationRender,
    setupWiFiStats,
    setupPowerMonitorRender
} = require('@jitsi/electron-sdk')
const { platform } = require('process');


const protocolRegex = /^(https?|mailto):/i;
function openExternalLink(link) {
    let u;
    
    try {
        u = url.parse(link);
    } catch (e) {
        return;
    }
  
    if (protocolRegex.test(u.protocol)) {
        shell.openExternal(link);
    }
  }

const whitelistedIpcChannels = [ 'protocol-data-msg', 'renderer-ready' ];

function setupRenderer(api, options = {}) {
    initPopupsConfigurationRender(api);

    const iframe = api.getIFrame();

    setupScreenSharingRender(api);

    if (options.enableRemoteControl) {
        new RemoteControl(iframe); // eslint-disable-line no-new
    }

    // Allow window to be on top if enabled in settings
    if (options.enableAlwaysOnTopWindow) {
        setupAlwaysOnTopRender(api);
    }

    // Disable WiFiStats on mac due to jitsi-meet-electron#585
    if (platform !== 'darwin') {
        setupWiFiStats(iframe);
    }

    setupPowerMonitorRender(api);
}

window.jitsiNodeAPI = {
    openExternalLink,
    setupRenderer,
    ipc: {
        on: (channel, listener) => {
            if (!whitelistedIpcChannels.includes(channel)) {
                return;
            }

            return ipcRenderer.on(channel, listener);
        },
        send: channel => {
            if (!whitelistedIpcChannels.includes(channel)) {
                return;
            }

            return ipcRenderer.send(channel);
        },
        removeListener: (channel, listener) => {
            if (!whitelistedIpcChannels.includes(channel)) {
                return;
            }

            return ipcRenderer.removeListener(channel, listener);
        }
    }
};
