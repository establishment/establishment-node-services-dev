export function linearInterpolation(min, max, coefficient) {
    return min + (max - min) * coefficient;
}

export function linearCoefficient(min, max, value) {
    return (value - min) / (max - min);
}

export function clamp(min, max, value) {
    return Math.max(Math.min(max, value), min);
}

export function random(minVal, maxVal) {
    return Math.random() * (maxVal - minVal) + minVal;
}