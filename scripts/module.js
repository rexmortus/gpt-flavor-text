import { registerSettings, moduleName } from './settings.js';
import { getGptReplyAsHtml } from './gpt-api.js';

// Initialise the module and register the module settings
Hooks.once('init', async function() {
    console.log(`${moduleName} | Initialization`);
	registerSettings();
});

/*

TODO - implement hooks for each
TODO - make hook registration a subsystem, where it only registers hooks that are appropriate for the game system you've selected

--- Complete list of dnd5e hooks ---
https://github.com/foundryvtt/dnd5e/wiki/Hooks

dnd5e.preRollAbilityTest
dnd5e.rollAbilityTest
dnd5e.preRollAbilitySave
dnd5e.rollAbilitySave
dnd5e.preRollDeathSave
dnd5e.rollDeathSave
dnd5e.preRollSkill
dnd5e.rollSkill
dnd5e.preRollHitDie
dnd5e.rollHitDie
dnd5e.preRollClassHitPoints
dnd5e.rollClasshitPoints
dnd5e.preRollNPCHitPoints
dnd5e.rollNPChitPoints
dnd5e.preRollInitiative
dnd5e.rollInitiative
dnd5e.preShortRest
dnd5e.preLongRest
dnd5e.preRestCompleted
dnd5e.restCompleted
dnd5e.transformActor

Advancement
dnd5e.preAdvancementManagerRender
dnd5e.preAdvancementManagerComplete
dnd5e.advancementManagerComplete

Item
dnd5e.preUseItem
dnd5e.preItemUsageConsumption
dnd5e.itemUsageConsumption
dnd5e.preDisplayCard
dnd5e.displayCard
dnd5e.useItem
dnd5e.preRollAttack
dnd5e.rollAttack
dnd5e.preRollDamage
dnd5e.rollDamage
dnd5e.preRollFormula
dnd5e.rollFormula
dnd5e.preRollRecharge
dnd5e.rollRecharge
dnd5e.preRollToolCheck
dnd5e.rollToolCheck

Item Sheet
dnd5e.dropItemSheetData

*/

// For now, we'll just implement two hooks

// RollAttack
// https://github.com/foundryvtt/dnd5e/wiki/Hooks#dnd5erollattack
Hooks.on('dnd5e.rollAttack', async function(item, roll) {
    
    // Placeholders for the content we want to extract from the game object to construct our prompt 
    let _scene = game.scenes.active.journal.name;
    let _actor = item.actor.name;
    let _target = game.user.targets.first().document.name;
    let _item = item.name;

    let promptText = 'In a ' + _scene + ', ' + _actor + ' attacks ' + _target + ' with a ' + _item;

    respondTo(promptText + '. Provide a brief narration of this in the second-person for the player.', []);

});

// RollDamage
// https://github.com/foundryvtt/dnd5e/wiki/Hooks#dnd5erolldamage
Hooks.on('dnd5e.rollDamage', async function(item, roll) {
    
        // Placeholders for the content we want to extract from the game object to construct our prompt 
        let _scene = game.scenes.active.journal.name;
        let _actor = item.actor.name;
        let _target = game.user.targets.first().document.name;
        let _item = item.name;
    
        let promptText = 'In a ' + _scene + ', ' + _actor + ' hits ' + _target + ' with a ' + _item;
    
        respondTo(promptText + '. Provide a brief narration of this in the second-person for the player.', []);

});

// Vesitigial Chat window interface
// Usage:
// /? your prompt
// OR
// /w gpt your prompt

Hooks.on('chatMessage', (chatLog, message, chatData) => {
	const echoChatMessage = async (chatData, question) => {
		const toGptHtml = '<span class="ask-chatgpt-to">To: GPT</span><br>';
		chatData.content = `${toGptHtml}${question.replace(/\n/g, "<br>")}`;
		await ChatMessage.create(chatData);
	};

	let match;

	const reWhisper = new RegExp(/^(\/w(?:hisper)?\s)(\[(?:[^\]]+)\]|(?:[^\s]+))\s*([^]*)/, "i");
	match = message.match(reWhisper);
	if (match) {
		const gpt = 'gpt';
		const userAliases = match[2].replace(/[[\]]/g, "").split(",").map(n => n.trim());
		const question = match[3].trim();
		if (userAliases.some(u => u.toLowerCase() === gpt)) {
			const users = userAliases
				.filter(n => n.toLowerCase() !== gpt)
				.reduce((arr, n) => arr.concat(ChatMessage.getWhisperRecipients(n)), [game.user]);

			// same error logic as in Foundry
			if (!users.length) throw new Error(game.i18n.localize("ERROR.NoTargetUsersForWhisper"));
			if (users.some(u => !u.isGM && u.id != game.user.id) && !game.user.can("MESSAGE_WHISPER")) {
				throw new Error(game.i18n.localize("ERROR.CantWhisper"));
			}

			chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
			chatData.whisper = users.map(u => u.id);
			chatData.sound = CONFIG.sounds.notification;
			echoChatMessage(chatData, question);

			respondTo(question, users);

			// prevent further processing, since an unknown whisper target would trigger an error
			return false;
		}
	}

	const rePublic = new RegExp(/^(\/\?\s)\s*([^]*)/, "i");
	match = message.match(rePublic);
	if (match) {
		const question = match[2].trim();
		echoChatMessage(chatData, question);

		respondTo(question, []);

		// prevent further processing, since an unknown command would trigger an error
		return false;
	}

	return true;
});

async function respondTo(question, users) {
	console.debug(`${moduleName} | respondTo(question = "${question}", users =`, users, ')');
	try {
		const reply = await getGptReplyAsHtml(question);

		const abbr = "By ChatGPT. Statements may be false";
		await ChatMessage.create({
			user: game.user.id,
			speaker: ChatMessage.getSpeaker({alias: 'GPT'}),
			content: `<abbr title="${abbr}" class="ask-chatgpt-to fa-solid fa-microchip-ai"></abbr>
				<span class="ask-chatgpt-reply">${reply}</span>`,
			whisper: users.map(u => u.id),
			sound: CONFIG.sounds.notification,
		});
	} catch (e) {
		console.error(`${moduleName} | Failed to provide response.`, e);
		ui.notifications.error(e.message, {permanent: true, console: false});
	}
}