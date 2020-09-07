// Behalten Sie eine globale Referenz auf das Fensterobjekt. 
// Wenn Sie dies nicht tun, wird das Fenster automatisch geschlossen, 
// sobald das Objekt dem JavaScript-Garbagekollektor übergeben wird.

let win

let { app, protocol, BrowserWindow } = require("electron");
const fs = require("fs");
let { extname } = require("path");
let { URL } = require("url");
var path = require('path')

const checkImportRegex = /import(\s*{?\*?[\s\w,$]*}?\s*(as)?[\s\w]*from\s|[\s]*)['\"]([^\.\/][\w\/\-@.]*?)['\"]/g;
let checkRelativeImportRegex = new RegExp("import(\\s*{?\\*?[\\s\\w,$]*}?\\s*(as)?[\\s\\w]*from\\s|[\\s]*)['\\\"]([\\.\\/][\\w\\/\\-@.]*?)['\\\"]", 'g');

let createProtocol = (scheme, normalize = true) => {
    console.log('ffdsafdsa')
    protocol.registerBufferProtocol(scheme,
        async (request, respond) => {
            let pathName = new URL(request.url).pathname;
            pathName = decodeURI(pathName); // Needed in case URL contains spaces

            try {
                let file = __dirname + "/" + pathName;
                if (fs.existsSync(file)) {
                    let data = await fs.promises.readFile(file);
                    let extension = extname(file).toLowerCase();
                    let mimeType = "";

                    if (extension === ".js") {
                        let dir = pathName.substring(0, pathName.lastIndexOf("/") + 1);
                        data = Buffer.from(await parseImports(file, data, dir));
                        mimeType = "text/javascript";
                    }
                    else if (extension === ".html")
                        mimeType = "text/html";
                    else if (extension === ".css")
                        mimeType = "text/css";
                    else if (extension === ".svg" || extension === ".svgz")
                        mimeType = "image/svg+xml";
                    else if (extension === ".json")
                        mimeType = "application/json";


                    respond({ mimeType, data });
                } else {
                    console.error(`File does not exist ${pathName}`);
                    throw `File does not exist ${pathName}`;
                }
            } catch (err) {
                console.error(`Error loading file ${pathName}`, err);
                throw `Error loading file ${pathName}`;
            }
        },
        (error) => {
            if (error) {
                console.error(`Failed to register ${scheme} protocol`, error);
            }
        }
    );
}

async function parseImports(file, data, dir) {
    data = data.toString();
    let matches = [];
    let mtc = checkRelativeImportRegex.exec(data);
    while (mtc) {
        matches.push(mtc);
        mtc = checkRelativeImportRegex.exec(data);
    }
    let lastpos = 0;
    let newData = "";
    for (let m of matches) {
        let newImportName = await buildImportName(m[3], dir);
        if (newImportName != m[3]) {
            newData += data.substr(lastpos, m.index - lastpos);
            newData += "import" + m[1] + "'" + newImportName + "'";
            lastpos = m.index + m[0].length;
        }
    }
    newData += data.substr(lastpos, data.length - lastpos);
    matches = [];
    lastpos = 0;
    data = newData
    newData = "";
    mtc = checkImportRegex.exec(data);
    while (mtc) {
        matches.push(mtc);
        mtc = checkImportRegex.exec(data);
    }
    for (let m of matches) {
        let newImportName = await buildImportName(m[3]);
        if (newImportName != m[3]) {
            newData += data.substr(lastpos, m.index - lastpos);
            newData += "import" + m[1] + "'" + newImportName + "'";
            lastpos = m.index + m[0].length;
        }
    }
    newData += data.substr(lastpos, data.length - lastpos);
    return newData;
}

async function buildImportName(importName, dirName = "") {
    if (importName[0] == '.' || importName[0] == '/') {
        let file = await buildImportFileName(importName, dirName);
        if (file != null)
            return importName + file;
        return importName;
    }

    let resFile = await buildImportFileName("./" + importName);
    if (resFile != null)
        return "/" + importName + resFile;
    resFile = await buildImportFileName("./node_modules/" + importName);
    if (resFile != null)
        return "/node_modules/" + importName + resFile;
    return importName;
}

async function buildImportFileName(importName, dirName = "") {
    if (fs.existsSync(__dirname + '/' + dirName + '/' + importName) && !fs.lstatSync(__dirname + '/' + dirName + '/' + importName).isDirectory())
        return '';
    if (fs.existsSync(__dirname + '/' + dirName + '/' + importName + '.js'))
        return '.js';
    if (fs.existsSync(__dirname + '/' + dirName + '/' + importName + (importName[importName.length - 1] == '/' ? "" : "/") + 'index.js'))
        return importName[importName.length - 1] == '/' ? "index.js" : "/index.js";
    if (fs.existsSync(__dirname + '/' + dirName + '/' + importName + (importName[importName.length - 1] == '/' ? "" : "/") + 'package.json')) {
        let json = JSON.parse(await fs.promises.readFile(__dirname + '/' + dirName + '/' + importName + (importName[importName.length - 1] == '/' ? "" : "/") + 'package.json', 'utf8'));
        let main = json.main;
        if (fs.existsSync(__dirname + '/' + dirName + '/' + importName + (importName[importName.length - 1] == '/' ? "" : "/") + main) && !fs.lstatSync(__dirname + '/' + dirName + '/' + importName + (importName[importName.length - 1] == '/' ? "" : "/") + main).isDirectory())
            return importName[importName.length - 1] == '/' ? main : "/" + main;
        if (fs.existsSync(__dirname + '/' + dirName + '/' + importName + (importName[importName.length - 1] == '/' ? "" : "/") + main + '.js'))
            return importName[importName.length - 1] == '/' ? main + ".js" : "/" + main + ".js";
        if (fs.existsSync(__dirname + '/' + dirName + '/' + importName + (importName[importName.length - 1] == '/' ? "" : "/") + main + 'index.js'))
            return importName[importName.length - 1] == '/' ? main + "/index.js" : "/" + main + "/index.js";
    }

    return null;
}

async function createWindow() {
    // Erstellen des Browser-Fensters.
    win = new BrowserWindow({
        width: 2000, height: 1024, frame: true, webPreferences: {
            nodeIntegration: true,
            devTools: true
        },
        icon: path.join(__dirname, 'icon.ico')
    })

    // Öffnen der DevTools.
    win.webContents.openDevTools()

    // und Laden der index.html der App.
    // win.loadFile('index.html')
    win.loadFile('labs/addATile.html')

    // Ausgegeben, wenn das Fenster geschlossen wird.
    win.on('closed', () => {
        // Dereferenzieren des Fensterobjekts, normalerweise würden Sie Fenster
        // in einem Array speichern, falls Ihre App mehrere Fenster unterstützt. 
        // Das ist der Zeitpunkt, an dem Sie das zugehörige Element löschen sollten.
        win = null
    })
}

//https://gist.github.com/smotaal/f1e6dbb5c0420bfd585874bd29f11c43 -- look and use
//https://stackoverflow.com/questions/51113097/electron-es6-module-import/51126482

// Diese Methode wird aufgerufen, wenn Electron mit der
// Initialisierung fertig ist und Browserfenster erschaffen kann.
// Einige APIs können nur nach dem Auftreten dieses Events genutzt werden.
app.on('ready',
    async () => {
        createProtocol("app");
        await createWindow();
    }
);

// Verlassen, wenn alle Fenster geschlossen sind.
app.on('window-all-closed', () => {
    // Unter macOS ist es üblich, für Apps und ihre Menu Bar
    // aktiv zu bleiben, bis der Nutzer explizit mit Cmd + Q die App beendet.
    //if (process.platform !== 'darwin') {
    app.quit()
    //}
})

app.on('activate', async () => {
    // Unter macOS ist es üblich ein neues Fenster der App zu erstellen, wenn
    // das Dock Icon angeklickt wird und keine anderen Fenster offen sind.
    if (win === null) {
        await createWindow()
    }
})

// In dieser Datei können Sie den Rest des App-spezifischen 
// Hauptprozess-Codes einbinden. Sie können den Code auch 
// auf mehrere Dateien aufteilen und diese hier einbinden.