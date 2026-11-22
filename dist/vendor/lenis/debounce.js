// Lenis 1.3.27, MIT. darkroomengineering/lenis, tag v1.3.27.
export function debounce(callback, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(()=>{
            timer = undefined;
            callback.apply(this, args);
        }, delay);
    };
}
