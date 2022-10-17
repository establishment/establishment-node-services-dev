import {Stack} from "./Stack.js";

// TODO import from Stem
export class Queue {
    constructor() {
        this.stack = new Stack();
        this.reverseStack = new Stack();
    }

    pop() {
        this.balance();

        return this.reverseStack.pop();
    }

    push(element) {
        this.stack.push(element);
    }

    front() {
        this.balance();

        return this.reverseStack.top();
    }

    size() {
        return this.stack.size() + this.reverseStack.size();
    }

    empty() {
        return this.stack.empty() && this.reverseStack.empty();
    }

    clear() {
        this.stack.clear();
        this.reverseStack.clear();
    }

    balance() {
        if (this.reverseStack.empty()) {
            while (!this.stack.empty()) {
                this.reverseStack.push(this.stack.pop());
            }
        }
    }
}
