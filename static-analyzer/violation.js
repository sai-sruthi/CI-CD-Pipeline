const chalk = require('chalk');

class Violation {
    constructor(property, threshold, value) {
        this.property = property;
        this.threshold = threshold;
        this.value = value;
    }

    report() {
        console.error(chalk.red(`Violation: ${this.property} of ${this.value} exceeds threshold of ${this.threshold}.`))
    }
}

module.exports = Violation;