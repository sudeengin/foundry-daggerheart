/**
 * Extend the basic ActorSheet for Daggerheart
 */
export class DaggerheartActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["daggerheart", "sheet", "actor"],
      width: 800,
      height: 700,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
    });
  }

  /** @override */
  get template() {
    return `systems/daggerheart/templates/actors/${this.actor.type}-sheet.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();
    
    // Add the actor's system data for easy access
    context.system = this.actor.system;
    context.flags = this.actor.flags;

    // Add helper for Hope diamonds
    context.range = function(n) {
      return Array.from({length: n}, (_, i) => i);
    };

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Trait Roll Buttons
    html.find('.trait-roll').click(this._onTraitRoll.bind(this));

    // Hope Controls
    html.find('.hope-btn').click(this._onHopeControl.bind(this));
  }

  /**
   * Handle trait roll button clicks
   */
  async _onTraitRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const trait = element.dataset.trait;
    
    // Enhanced dialog with Hope spending options
    const result = await new Promise((resolve) => {
      new Dialog({
        title: `${trait.toUpperCase()} Roll`,
        content: `
          <form>
            <div class="form-group">
              <label>Difficulty:</label>
              <input type="number" name="difficulty" value="10" min="5" max="30" step="1"/>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" name="spendHope"/> 
                Spend 1 Hope for +1d6 bonus ${this.actor.canSpendHope(1) ? '💎' : '(Not enough Hope)'}
              </label>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" name="useExperience"/> 
                Use Experience for +2 bonus (1 Hope) ${this.actor.canSpendHope(1) ? '📜' : '(Not enough Hope)'}
              </label>
            </div>
          </form>
        `,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice"></i>',
            label: "Roll",
            callback: (html) => {
              const difficulty = parseInt(html.find('[name="difficulty"]').val()) || 10;
              const spendHope = html.find('[name="spendHope"]').is(':checked');
              const useExperience = html.find('[name="useExperience"]').is(':checked');
              resolve({ difficulty, spendHope, useExperience });
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => resolve(null)
          }
        },
        default: "roll"
      }).render(true);
    });

    if (result) {
      this.actor.rollTrait(trait, result);
    }
  }

  /**
   * Handle Hope control buttons
   */
  async _onHopeControl(event) {
    event.preventDefault();
    const action = event.currentTarget.dataset.action;
    const currentHope = this.actor.system.hope || 0;

    if (action === "add-hope" && currentHope < 6) {
      await this.actor.update({"system.hope": currentHope + 1});
    } else if (action === "remove-hope" && currentHope > 0) {
      await this.actor.update({"system.hope": currentHope - 1});
    }
  }
}