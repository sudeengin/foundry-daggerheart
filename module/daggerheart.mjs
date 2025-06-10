// Import our custom classes
import { DaggerheartRoll } from "./dice/daggerheart-roll.mjs";
import { DaggerheartActor } from "./documents/actor.mjs";
import { DaggerheartActorSheet } from "./sheets/actor-sheet.mjs";

console.log("Daggerheart | System Loading...");

Hooks.once('init', async function() {
    console.log("Daggerheart | Initializing System");
    
    // Register our custom classes
    CONFIG.Actor.documentClass = DaggerheartActor;
    CONFIG.Dice.rolls.push(DaggerheartRoll);
    CONFIG.Dice.DaggerheartRoll = DaggerheartRoll;
    
    // Register actor sheet
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("daggerheart", DaggerheartActorSheet, { 
        types: ["character"], 
        makeDefault: true 
    });

    ui.notifications.info("Daggerheart system loaded!");
});

Hooks.once('ready', async function() {
    // Add a test button to the UI
    const testButton = $(`
        <button id="daggerheart-test" style="
            position: fixed; 
            top: 10px; 
            right: 10px; 
            z-index: 1000; 
            padding: 10px; 
            background: #8B4513; 
            color: white; 
            border: none; 
            border-radius: 5px;
            cursor: pointer;
        ">
            🎲 Test Daggerheart Roll
        </button>
    `);
    
    $('body').append(testButton);
    
    testButton.click(async function() {
        await makeDaggerheartRoll(1, 12, "agility");
    });
});

// Function to make a Daggerheart roll (keep for testing)
async function makeDaggerheartRoll(modifier = 0, difficulty = 10, trait = "agility") {
    const roll = new DaggerheartRoll("2d12 + @modifier", {modifier}, {difficulty, trait});
    await roll.evaluate();
    
    const messageData = {
        content: `
            <div class="daggerheart-roll" style="
                border: 2px solid #8B4513; 
                padding: 10px; 
                margin: 5px; 
                border-radius: 8px;
                background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
            ">
                <h3 style="margin: 0 0 10px 0; color: #8B4513;">
                    🗡️ Daggerheart Roll (${trait.toUpperCase()})
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
    return roll;
}