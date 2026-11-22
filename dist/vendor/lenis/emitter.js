// Lenis 1.3.27, MIT. darkroomengineering/lenis, tag v1.3.27.
export class Emitter {
    events = {};
    emit(event, ...args) {
        const callbacks = this.events[event] || [];
        for(let i = 0, length = callbacks.length; i < length; i++){
            callbacks[i]?.(...args);
        }
    }
    on(event, cb) {
        if (this.events[event]) {
            this.events[event].push(cb);
        } else {
            this.events[event] = [
                cb
            ];
        }
        return ()=>{
            this.events[event] = this.events[event]?.filter((i)=>cb !== i);
        };
    }
    off(event, callback) {
        this.events[event] = this.events[event]?.filter((i)=>callback !== i);
    }
    destroy() {
        this.events = {};
    }
}
