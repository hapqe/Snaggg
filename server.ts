import express, { Express, Request } from "express";
import bodyParser from "body-parser";
import FingerPrint from "express-fingerprint"
import fs from "fs";
import cors from "cors";

const port = 8000;

const app: Express = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(FingerPrint())

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    }
);

app.post('/', (req, res, next) => {
    if(req.body.delete) {
        deleteUserData(req);
    }
    else if(req.body.design) {
        saveDesign(req);
    }
    else if(req.body.collectDesign) {
        incrementDesignCount(req);
    }
    else if(req.body.tradeDesign) {
        incrementDesignCount(req, "tradeCount");
    }
    else {
        userData(req, true);
    }
    
    res.json({ status: 'ok' });
    next();
});

app.get('/userData', (req, res, next) => {
    (async () => {
        let data = await userData(req);
        res.send(data);
    })();
});

async function userData(req: Request, upload: boolean = false) {
    let hash = req.fingerprint?.hash;

    let path = `./users/${hash}.json`;

    let json;
    
    try {
        json = JSON.parse(await fs.promises.readFile(path, 'utf8'));
    }
    catch {
        json = {};
    }

    if(upload) {
        json = { ...json, ...req.body };
        
        await fs.promises.writeFile(path, JSON.stringify(json));
    }

    return { isUserData: true, ...json };
}

async function deleteUserData(req: Request) {
    let hash = req.fingerprint?.hash;

    let path = `./users/${hash}.json`;

    try {
        await fs.promises.unlink(path);
    }
    catch {
        console.log('User data not found');
    }
}

async function incrementDesignCount(req: Request, id = "buyCount") {
    let path = `./users/${req.body.id}.json`;
    let name = req.body.date;

    let json;
    
    try {
        json = JSON.parse(await fs.promises.readFile(path, 'utf8'));
        const count = (json.designs?.[name]?.[id])??0;

        if(count == 0) {
            json.designs[name] = { ...json.designs[name], [id]: 1 };
        }
        else {
            json.designs[name] = { ...json.designs[name], [id]: count + 1 };
        }
    }
    catch {
        json = {
            designs: {
                [name]: {
                    [id]: 1
                }
            }
        }
    }

    await fs.promises.writeFile(path, JSON.stringify(json));
}

async function saveDesign(req: Request) {
    let hash = req.fingerprint?.hash;
    let time = Date.now();
    let name = `${hash}_${time}`;

    let path = `./designs/${name}.png`;

    // data:image
    let data = req.body.design;

    let buffer = Buffer.from(data.split(',')[1], 'base64');
    
    await fs.promises.writeFile(path, buffer);
}

async function getDesign(req: Request, {notFromUser = false, savedDesign = false}) {
    const designs = await fs.promises.readdir('./designs');
    const count = designs.length;

    const i = () => Math.floor(Math.random() * count);
    
    let index = i();
    let hash = req.fingerprint?.hash;

    let maxTries = 10;
    if(notFromUser && hash) {
        while(designs[index].startsWith(hash)) {
            index = i();
            maxTries--;
            if(maxTries == 0) break;
        }
    }
    if(savedDesign && hash) {
        while(!designs[index].startsWith(hash)) {
            index = i();
            maxTries--;
            if(maxTries == 0) break;
        }
    }

    let path = `./designs/${designs[index]}`;

    let data = await fs.promises.readFile(path, 'base64');

    return {
        isDesign: true,
        design: `data:image/png;base64,${data}`,
        stamp: designs[index]
    };
}

async function getDesignFromUser(user: string, not = false) {
    const designs = await fs.promises.readdir('./designs');
    const count = designs.length;

    let index = Math.floor(Math.random() * count);
    while(!designs[index].startsWith(user) == not) {
        index = Math.floor(Math.random() * count);
    }

    let path = `./designs/${designs[index]}`;

    let data = await fs.promises.readFile(path, 'base64');

    return {
        isDesign: true,
        design: `data:image/png;base64,${data}`,
        stamp: designs[index]
    };
}

async function getNamedDesign(req: Request, name: string) {
    let hash = req.fingerprint?.hash;
    
    const filename = `${hash}_${name}`;
    const path = `./designs/${filename}.png`;

    let data = await fs.promises.readFile(path, 'base64');

    return {
        isDesign: true,
        design: `data:image/png;base64,${data}`,
        stamp: filename
    };
}

async function deleteNamedDesign(req: Request, name: string) {
    let hash = req.fingerprint?.hash;

    const filename = `${hash}_${name}`;
    const path = `./designs/${filename}.png`;

    try {
        await fs.promises.unlink(path);
    }
    catch {

    }

    let userPath = `./users/${hash}.json`;

    let json;
    
    try {
        json = JSON.parse(await fs.promises.readFile(userPath, 'utf8'));
        delete json.designs[name];
        await fs.promises.writeFile(userPath, JSON.stringify(json));
    }
    catch {
    }
}

app.post('/design', async (req, res, next) => {
    getDesign(req, {...req.body}).then(d => res.send(d));
});

app.post('/getdesign', async (req, res, next) => {
    getNamedDesign(req, req.body.designName).then(d => res.send(d));
});

app.post('/deletedesign', async (req, res, next) => {
    deleteNamedDesign(req, req.body.designName).then(d => res.send(d));
});