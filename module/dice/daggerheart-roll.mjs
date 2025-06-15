/**
 * DaggerheartRoll - Core dice rolling system for Daggerheart
 * Handles the dual d12 system with Hope/Fear mechanics
 */
export class DaggerheartRoll extends Roll {
    constructor(formula, data = {}, options = {}) {
        // Ensure we're always rolling 2d12 for Daggerheart
        super(formula, data, options);
        
        this.difficulty = options.difficulty || 10;
        this.traitUsed = options.trait || "unknown";
        
        // Results tracking
        this.hopeResult = null;
        this.fearResult = null;
        this.outcomeType = null;
        this.isCritical = false;
    }

    /** @override */
    async evaluate(options = {}) {
        await super.evaluate(options);
        this._processDualityDice();
        return this;
    }

    /**
 * Process the two d12s to determine Hope/Fear and outcome
 */
_processDualityDice() {
    const dice = this.dice[0];
    const results = dice.results.map(r => r.result);
    
    if (results.length !== 2) {
        console.error("Daggerheart rolls must have exactly 2d12");
        return;
    }

    const [die1, die2] = results;
    const total = this.total;
    
    // FIXED: Assign dice correctly - die1 is Hope die, die2 is Fear die
    this.hopeResult = die1;
    this.fearResult = die2;
    
    // Check for Critical Success (both dice equal)
    if (die1 === die2) {
        this.isCritical = true;
    }
    
    // Determine success/failure and Hope/Fear outcome
    const isSuccess = total >= this.difficulty;
    const isHopeHigher = this.hopeResult > this.fearResult;
    
    if (this.isCritical) {
        this.outcomeType = "critical-success";
    } else if (isSuccess && isHopeHigher) {
        this.outcomeType = "success-with-hope";
    } else if (isSuccess && !isHopeHigher) {
        this.outcomeType = "success-with-fear";
    } else if (!isSuccess && isHopeHigher) {
        this.outcomeType = "failure-with-hope";
    } else {
        this.outcomeType = "failure-with-fear";
    }
}
    /**
     * Get outcome description from the rulebook
     */
    getOutcomeDescription() {
        const outcomes = {
            "critical-success": "Critical Success! You get what you wanted and a little extra. You gain a Hope and clear a Stress.",
            "success-with-hope": "Success with Hope! You get what you wanted and you gain a Hope.",
            "success-with-fear": "Success with Fear! You get what you want, but it comes with a consequence. The GM gains a Fear.",
            "failure-with-hope": "Failure with Hope! You probably don't get what you want and there are consequences, but you gain a Hope.",
            "failure-with-fear": "Failure with Fear! You don't get what you wanted and things go very badly. The GM gains a Fear."
        };
        return outcomes[this.outcomeType] || "Unknown outcome";
    }

    generatesHope() {
        return ["critical-success", "success-with-hope", "failure-with-hope"].includes(this.outcomeType);
    }

    generatesFear() {
        return ["success-with-fear", "failure-with-fear"].includes(this.outcomeType);
    }

    isSuccess() {
        return ["critical-success", "success-with-hope", "success-with-fear"].includes(this.outcomeType);
    }
}