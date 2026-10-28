// Buddy Todo – Linux desktop shell.
// Runs the same Express server + scheduler inside Electron, lives in the system tray,
// and opens an always-on-top animated popup every time a reminder rings.
const { app, BrowserWindow, Tray, Menu, Notification, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// must be set BEFORE the server/engine modules are loaded
process.env.BUDDY_DATA = path.join(app.getPath('userData'), 'data');
process.env.PORT = process.env.PORT || '37373';
process.env.HOST = '127.0.0.1';

app.commandLine.appendSwitch('ozone-platform', 'x11');                       // X11/XWayland honours "always on top"
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required'); // popup can play sounds immediately

if (!app.requestSingleInstanceLock()) app.quit();

const ICON = path.join(__dirname, 'icon.png');
const URL = () => `http://127.0.0.1:${process.env.PORT}`;
const webPreferences = { preload: path.join(__dirname, 'preload.js'), contextIsolation: true };
const AUTOSTART = path.join(os.homedir(), '.config', 'autostart', 'buddy-todo.desktop');

let tray, mainWin, quitting = false;
const popups = new Map();                       // taskId -> BrowserWindow

/* ---------- windows ---------- */
function showMain() {
  if (!mainWin) {
    mainWin = new BrowserWindow({ width: 1100, height: 820, title: 'Buddy Todo', icon: ICON, autoHideMenuBar: true, webPreferences });
    mainWin.loadURL(URL());
    mainWin.on('close', e => { if (!quitting) { e.preventDefault(); mainWin.hide(); } });   // close = hide to tray
  }
  mainWin.show(); mainWin.focus();
}

function showPopup(id) {
  let w = popups.get(id);
  if (w && !w.isDestroyed()) {
    w.webContents.reload();
  } else {
    w = new BrowserWindow({ width: 480, height: 640, center: true, title: 'Reminder', icon: ICON,
      autoHideMenuBar: true, alwaysOnTop: true, webPreferences });
    w.loadURL(`${URL()}/popup.html?id=${id}`);
    w.on('closed', () => popups.delete(id));
    popups.set(id, w);
  }
  w.setAlwaysOnTop(true, 'screen-saver');       // above every other window
  w.setVisibleOnAllWorkspaces(true);
  w.show(); w.moveTop(); w.focus();
}

/* ---------- start at login (Linux .desktop autostart) ---------- */
const autoOn = () => fs.existsSync(AUTOSTART);
function setAuto(on) {
  if (!on) return fs.rmSync(AUTOSTART, { force: true });
  const exec = process.env.APPIMAGE
    ? `"${process.env.APPIMAGE}" --no-sandbox`
    : `"${process.execPath}" "${app.getAppPath()}" --no-sandbox`;
  fs.mkdirSync(path.dirname(AUTOSTART), { recursive: true });
  fs.writeFileSync(AUTOSTART,
    `[Desktop Entry]\nType=Application\nName=Buddy Todo\nComment=Reminders with buddies\nExec=${exec} --hidden\nIcon=${ICON}\nX-GNOME-Autostart-enabled=true\n`);
}

function buildTray() {
  tray = new Tray(nativeImage.createFromPath(ICON));
  tray.setToolTip('Buddy Todo');
  const menu = () => Menu.buildFromTemplate([
    { label: 'Open Buddy Todo', click: showMain },
    { label: 'Start at login', type: 'checkbox', checked: autoOn(), click: i => { setAuto(i.checked); tray.setContextMenu(menu()); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { quitting = true; app.quit(); } }
  ]);
  tray.setContextMenu(menu());
  tray.on('click', showMain);
}

/* ---------- boot ---------- */
app.on('second-instance', showMain);
app.on('window-all-closed', () => {});          // keep running in the tray
app.on('before-quit', () => { quitting = true; });

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  const { start } = require('../server');
  const engine = require('../src/engine');
  await start();

  engine.events.on('ring', t => {               // fired on reminder, "check", and repeats
    showPopup(t.id);
    try { new Notification({ title: t.title, body: t.run.ask === 'check' ? 'Is it completed?' : (t.note || 'It is time!') }).show(); } catch {}
  });

  buildTray();
  if (!process.argv.includes('--hidden')) showMain();
});
