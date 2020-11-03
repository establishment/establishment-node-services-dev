module.exports.linearInterpolation = (min, max, coefficient) => {
    return min + (max - min) * coefficient;
};

module.exports.linearCoefficient = (min, max, value) => {
    return (value - min) / (max - min);
};

module.exports.clamp = (min, max, value) => {
    return Math.max(Math.min(max, value), min);
};

module.exports.random = (minVal, maxVal) => {
    return Math.random() * (maxVal - minVal) + minVal;
};