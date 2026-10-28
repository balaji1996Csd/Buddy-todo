const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('buddyDesktop', true);
