const text = document.querySelector('#text');

function showText(str, props = {}) {
    const style = window.getComputedStyle(document.documentElement);
    const wordDur = parseInt(style.getPropertyValue('--word-time'));
    const after = props.after ?? 500;
    const color = props.color ?? 'white';
    const position = props.position ?? 'center';

    let html = '';
    // for every word append a span with a space
    let count = 0;
    str.split(' ').forEach((word, i) => {
        html += `<div style="color: ${color}">${word}</div>&nbsp`;
        count++;
    });
    duration = count * 150 + 1000;
    text.innerHTML = html;

    let d = count * wordDur + duration;
    requestAnimationFrame(() => {
        text.setAttribute('data-blur', false);
    });

    setTimeout(() => {
        text.setAttribute('data-blur', true);
    }, d);

    let height = text.parentElement.clientHeight - text.clientHeight * 2;

    let a = 'center';
    switch (position) {
        case 'top':
        a = "start";
        break;
        case 'bottom':
        a = "end";
        break;
    }
    text.parentElement.style.alignItems = a;
        
    playSound('playtyping');

    const typingDuration = count * wordDur + 500;

    setTimeout(() => {
        playSound('stoptyping');
    }, typingDuration);

    setTimeout(() => {
        playSound('playbubble');
    }, typingDuration + duration - 500);

    return new Promise((resolve) => setTimeout(resolve, 2 * (count * wordDur) + duration + after));
}