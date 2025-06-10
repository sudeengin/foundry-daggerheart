/**
 * Extend the base Actor document to support Daggerheart-specific functionality
 */
export class DaggerheartActor extends Actor {

  /** @inheritdoc */
  prepareData() {
    super.prepareData();
  }

  /** @inheritdoc */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;

    // Calculate derived values for characters
    if (actorData.type === 'character') {
      this._prepareCharacterData(systemData);
    }
  }

  /**
   * Prepare Character-specific data
   */
  _prepareCharacterData(systemData) {
    // Calculate Evasion (10 + Agility + armor bonuses)
    const agilityMod = systemData.traits?.agility || 0;
    const armorBonus = systemData.armor?.evasionBonus || 0;
    systemData.evasion = 10 + agilityMod + armorBonus;

    // Calculate damage thresholds (base + level)
    const level = systemData.level || 1;
    if (systemData.armor?.thresholds) {
      systemData.damageThresholds = {
        minor: systemData.armor.thresholds.minor + level,
        major: systemData.armor.thresholds.major + level
      };
    }
  }

  /**
   * Make a trait roll
   */
  async rollTrait(traitName, options = {}) {
    const traitValue = this.system.traits?.[traitName] || 0;
    const difficulty = options.difficulty || 10;
    
    // Import our roll class
    const { DaggerheartRoll } = await import("../dice/daggerheart-roll.mjs");
    
    // Create the roll
    const roll = new DaggerheartRoll("2d12 + @modifier", 
      { modifier: traitValue }, 
      { difficulty, trait: traitName }
    );
    
    await roll.evaluate();

    // Create chat message
    const messageData = {
      speaker: ChatMessage.getSpeaker({actor: this}),
      content: `
        <div class="daggerheart-roll" style="
          border: 2px solid #8B4513; 
          padding: 10px; 
          margin: 5px; 
          border-radius: 8px;
          background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
        ">
          <h3 style="margin: 0 0 10px 0; color: #8B4513;">
            🗡️ ${this.name} - ${traitName.toUpperCase()} Roll
          </h3>
          <div style="font-size: 18px; margin: 5px 0;">
            <strong>Total: ${roll.total}</strong> vs Difficulty ${difficulty}
          </div>
          <div style="margin: 5px 0;">
            Hope Die: <span style="color: #4CAF50; font-weight: bold;">${roll.hopeResult}</span> | 
            Fear Die: <span style="color: #F44336; font-weight: bold;">${roll.fearResult}</span>
          </div>
          <div style="
            padding: 8px; 
            margin: 8px 0; 
            border-radius: 4px;
            background: ${roll.isSuccess() ? '#E8F5E8' : '#FFE8E8'};
            border-left: 4px solid ${roll.isSuccess() ? '#4CAF50' : '#F44336'};
          ">
            <strong>${roll.getOutcomeDescription()}</strong>
          </div>
          ${roll.isCritical ? '<div style="text-align: center; font-size: 20px; color: gold;">🎉 CRITICAL SUCCESS! 🎉</div>' : ''}
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    };

    ChatMessage.create(messageData);

    // Handle Hope/Fear generation (we'll implement this next)
    if (roll.generatesHope()) {
      await this.addHope(1);
    }

    return roll;
  }

  /**
   * Add Hope tokens to character
   */
  async addHope(amount) {
    const currentHope = this.system.hope || 0;
    const newHope = Math.min(currentHope + amount, 6); // Max 6 Hope
    await this.update({"system.hope": newHope});
    ui.notifications.info(`${this.name} gains ${amount} Hope!`);
  }
}