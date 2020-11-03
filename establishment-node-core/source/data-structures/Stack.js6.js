module.exports = class Stack {
    constructor() {
        this.data = [];
    }

    pop() {
        return this.data.pop();
    }

    push(element) {
        this.data.push(element);
    }

    top() {
        if (this.data.length == 0) {
            return false;
        }
        return this.data[this.data.length - 1];
    }

    size() {
        return this.data.length;
    }

    // TODO: should be called isEmpty()
    empty() {
        return this.data.length == 0;
    }

    clear() {
        this.data = [];
    }
};
