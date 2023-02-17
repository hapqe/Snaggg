let shirtCount = 5;

window.addEventListener('message', async (e) => {
    if(e.data.shirtCount) {
        shirtCount = e.data.shirtCount;
    }

    if(!Object.keys(e.data)[0]) return;
    
    const k = Object.keys(e.data)[0].toLowerCase();

    if (k.endsWith('scene')) {
        const scene = k.slice(0, -5);

        if (scene === 'cotton') {
            transitionScene(
                'cotton',
                {
                    delay: 2000,
                    stop: 'space',
                    play: 'playpiano',
                    clouds: true,
                    text: 'earth_cotton',
                    tip: "Ziehe 8 Baumwollstücke in den Kübel!"
                }
            )
            playSound('fadewind');
        }

        if(scene === 'design') {
            if(!playerRunning)
            transitionScene(
                'design',
                {
                    stop: 'wind',
                    text: 'cotton_design',
                    tip: "Tippe auf Werkzeuge, um sie zu benutzen!",
                },
            )
            else
            setScene('scenes/packaging');
        }

        if(scene === 'packaging') {
            transitionScene(
                'packaging',
                {
                    tip: "Ziehe 12 Pakete in den Lastwagen."
                }
            )
            playSound('fadehaunted')
            playSound('fadeconveyor')
        }

        if(scene === 'shipping') {
            playSound('stopconveyor')
            playSound('fadewind');
            if(!playerRunning) {
                await transitionScene(
                    'shipping'
                )
                await wait(2000);
                await showParagraphs('./text/shipping.txt');
                await wait(2000);
            }
            playSound('stoppiano');
            playSound('stopwind');
            if(!playerRunning)
            await darken();
            
            await setScene('scenes/phone');
            if(!playerRunning)
            setTimeout(() => {
                showInfo('Tippe auf das Handy!');
            }, 2000);
            playSound('stopwind');
            frame.contentWindow.postMessage({beforeShopping: true}, '*');
        }

        if(scene === 'shopping') {
            setScene('scenes/shopping');
            playSound('stopwind');
        }

        if(scene === 'phone') {
            playSound('stopStress');
            playSound('playbreak');
            if(!playerRunning) {
                await darken();

                const c = shirtCount;

                let text = `Du hast gerade ${c} Kleidungsstücke gekauft. Insgesammt bedeutet das ${c * 11} Kilogramm CO2-Emissionen. ${c} * 2700 Liter Wasserverbrauch, also unglaubliche ${Math.round(c * 2700 / 165)} volle Badewannen wurden bei der Produktion dieser Kleidungsstücke verbraucht.\nDeine gekauften Kleidungsstücke sind zudem ${c * 34}.225 Kilometer um die Welt gereist. Das sind ${Math.round(c * 34225 / 40075)} Rundflüge um den Äquator.`

                if(c < 60) {
                    text += '\nTrotzdem waren das weniger Kleidungsstücke, als die 60 Stück, die ein durchschnittlicher deutscher Konsument jährlich kauft.'
                }

                await showParagraphsString(text);
                await showParagraphs('./text/trading.txt');
            }

            await setScene('scenes/phone');
            frame.contentWindow.postMessage({beforeShopping: false}, '*');
        }

        if(scene === 'trading') {
            await hideTransition();
            
            transitionScene(
                'trading',
                {
                    play: 'playpiano',
                    tip: 'Gehe zu anderern Charakteren um zu tauschen.'
                },
            )
        }

        if(scene === 'final') {
            await transitionScene('final', {darken: true, stop: 'wind'});
            post({playedThrough: true})
        }
    }
});

async function showParagraphs(file, props = {}) {
    const res = await fetch(file);
    let text = await res.text();

    await showParagraphsString(text, props);
}

async function showParagraphsString(text, props = {}) {
    text = text.replace('\n\n', '\n');
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        await showText(lines[i], props);
    }
}

async function setScene(scene) {
    const frame = document.querySelector('iframe');
    frame.src = scene;
    
    return new Promise((resolve) => {
        window.addEventListener('message', (e) => {
            if (e.data.sceneLoaded) {
                resolve();
            }
        });
    });
}

async function transitionScene(scene, props = {}) {
    if(props.stop instanceof String)
        playSound('stop' + props.stop);

    if(props.stop instanceof Array)
        props.stop.forEach((s) => playSound('stop' + s));
        
    if(props.play instanceof String) 
        playSound(props.play);

    if(props.play instanceof Array)
        props.play.forEach((s) => playSound(s));
        
    if(!playerRunning) {
        const delay = props.delay ?? 500;
    
        await wait(delay);
    
        if(props.clouds)
        await clouds();
        else if (props.darken)
        await darken();
        else await transition();
        
        if(props.text)
        await Promise.all([
            showParagraphs('./text/' + props.text + '.txt', { color: 'black' }),
            setScene('scenes/' + scene)
        ]);
        else await setScene('scenes/' + scene);

        if(props.clouds)
        await hideClouds();
        else if(props.darken) await blink();
        else await hideTransition();

        if(props.tip) {
            showInfo(props.tip)
        }
    }
    else {
        await setScene('scenes/' + scene);
    }
}

async function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}