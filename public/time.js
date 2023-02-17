let playerRunning = false;
let timerActive = false;

function run() {
    const wrapper = document.querySelector('#time-wrapper');
    wrapper.style.display = playerRunning ? 'flex' : 'none';
    
    const element = document.querySelector('#time');
    
    let last = Date.now();
    let time = 0;
    
    window.addEventListener('message', async (e) => {
        if(e.data.sceneLoaded) timerActive = true;
        if(e.data.done) timerActive = false;
    });
    
    function update() {
        const zeroPad = (num, places) => String(num).padStart(places, '0')
        
        const seconds = Math.floor(time / 1000);
        const minutes = Math.floor(seconds / 60);
        const millis = time % 1000;
    
        const s = zeroPad(seconds, 2);
        const m = zeroPad(minutes, 2);
        const ms = zeroPad(millis, 3);
        
        element.innerHTML = `${m}:${s}:${ms}`;
    
        const now = Date.now();
        const diff = now - last;
    
        if(timerActive)
        time += diff;
    
        last = now;
        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}