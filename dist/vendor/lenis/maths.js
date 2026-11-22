// Lenis 1.3.27, MIT. darkroomengineering/lenis, tag v1.3.27.
export function clamp(min, input, max) {
    return Math.max(min, Math.min(input, max));
}
export function truncate(value, decimals = 0) {
    return Number.parseFloat(value.toFixed(decimals));
}
export function lerp(x, y, t) {
    return (1 - t) * x + t * y;
}
export function damp(x, y, lambda, deltaTime) {
    return lerp(x, y, 1 - Math.exp(-lambda * deltaTime));
}
export function modulo(n, d) {
    return (n % d + d) % d;
}
