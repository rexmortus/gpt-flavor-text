import { registerSettings, moduleName } from './settings.js';
import { getGptReplyAsHtml } from './gpt-api.js';
import * as utils from './utils.js';

// Initialise the module and register the module settings
Hooks.once('init', async function () {
  utils.log('Initialisation');
  registerSettings();
  // CONFIG.debug.hooks = true;
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
Hooks.on('dnd5e.rollAttack', async function (item, roll) {
  // Placeholders for the content we want to extract from the game object to construct our prompt 
  // TODO Use a FormApplication to create a dialogue, allowing the GM to specify the details of the flavor text
  // https://foundryvtt.wiki/en/development/guides/understanding-form-applications
  // 1. Scene description
  // At the moment, it will look for a journal page associated with the current scene. This won't always be available.
  // 2. Actor - this will always be available due to the nature of it being hooked on an action
  // 3. Target - targets may not always be idenitifed, and in some cases, there can be multiple targets. There should be a way
  // for the GM to specific which are the targets of the attack
  // I'm imaginging a list of checkboxes with each actor in the scene, ticking the box designates it as a target for the flavor text
  // 4. Item is pretty straighforward 
  // 5. Outcome. I think the final thing is a button with the outcome: critical miss, miss, hit, critical hit

  // ! A source Item name and Actor name are the minimum requirements to generate a prompt.
  // i.e. GPT has to be able to know who is doing some thing and what they're doing it with (at least for an attack)
  // Targets and scene details are optional

  let _actorName = item?.actor?.name;
  let _itemName = item?.name;

  // If the actor or item aren't defined then we can just skip everything else
  if (!_itemName) {
    utils.logError('No attack item / spell available.')
    return;
  }
  if (!_actorName) {
    utils.logError('No actor defined.');
    return;
  }

  let _sceneName = game?.scenes?.active?.journal?.name;
  let _targetName = game?.user?.targets?.first()?.document?.name;
  let _targetAc = game?.user?.targets?.first()?.document?._actor?.system?.attributes?.ac?.value;

  // Guards with console errors
  if (!_targetName) {
    // Lack of target context shouldn't stop a prompt. Just log error for now
    // TODO ? Add settings flag to suppress errors and warnings
    utils.logError('No targets selected.')
  }
  if (!_sceneName) {
    // Lack of scene context shouldn't stop a prompt. Just log error for now
    // TODO ? Add settings flag to suppress errors and warnings
    utils.logError('No scene defined.');
  }

  // let promptText = `${_actorName} attacks ${_targetName} using their ${_itemName} in a/an ${_sceneName}`
  let promptText = `${_actorName} attacks ${_targetName ? _targetName + ' ' : ''}using their ${_itemName} ${_sceneName ? 'in a/an ' + _sceneName : ''}`

  //let promptText = 'In a ' + _sceneName + ', ' + _actorName + ' attacks ' + _targetName + ' with a ' + _itemName;
  if (roll && _targetAc) {
    respondTo(promptText + ', ' + getHitMissPrompt(roll, _targetAc) + '. Provide a brief narration of this in the second-person for the player.', []);
    return;
  }

  new Dialog({
    title: "GPT Flavor Text",
    content: promptText,
    buttons: {
      criticalMiss: {
        label: "Critical Miss",
        callback: () => {
          respondTo(promptText + ', but critically misses. Provide a brief narration of this in the second-person for the player.', []);
        }
      },
      miss: {
        label: "Miss",
        callback: () => {
          respondTo(promptText + ', but misses. Provide a brief narration of this in the second-person for the player.', []);
        }
      },
      hit: {
        label: "Hit",
        callback: () => {
          respondTo(promptText + ', and hits. Provide a brief narration of this in the second-person for the player.', []);
        }
      },
      criticalHit: {
        label: "Critical Hit",
        callback: () => {
          respondTo(promptText + ', and critically hits. Provide a brief narration of this in the second-person for the player.', []);
        }
      },
      killingBlow: {
        label: "Killing Blow",
        callback: () => {
          respondTo(promptText + ', and deals a killing blow, slaying the enemy. Provide a brief narration of this in the second-person for the player.', []);
        }
      }
    },
    default: 'buttonA',
  }).render(true)
});

/**
 * 
 * @param     {D20Roll}   roll  The roll object for the attack. Used to check critical hit/miss as well as the roll value.
 * @param     {number}    ac    The target's AC value.
 * @returns   {string}    Modifier for the prompt describing a hit/miss and the confidence of it
 */
function getHitMissPrompt(roll, ac) {
  // Handle criticals first
  if (roll?.isCritical) {
    if (roll?.isFumble) { return 'but critically misses in a dramatic fashion'; }
    else { return 'and critically hits in a dramatic fashion'; }
  }
  // Return a string based on the hit or miss confidence
  let value = roll.total - ac;
  var str = '';
  if (value >= 10) { str = 'and lands a very confident hit'; }
  else if (value >= 5) { str = 'and hits'; }
  else if (value >= 3) { str = 'and just barely lands a hit'; }
  else if (value >= 0) { str = 'and lands a hit purely out to luck' }
  else if (value > -3) { str = 'but barely misses due to slight ineptness or a hint of bad luck' }
  else if (value > -5) { str = 'but misses with ineptness or bad luck' }
  else if (value > -10) { str = 'but misses with dramatic ineptness or dramatically bad luck' }
  else if (value <= -10) { str = 'but completely misses' }
  else { utils.logError('Could not find an appropriate string for ' + value); } // Shouldn't hit this, so logs as an error
  return str;
}

// RollDamage
// https://github.com/foundryvtt/dnd5e/wiki/Hooks#dnd5erolldamage
Hooks.on('dnd5e.rollDamage', async function (item, roll) {

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
  utils.logDebug('respondTo(question,users)', question, users);
  try {
    const reply = await getGptReplyAsHtml(question);

    const abbr = "By ChatGPT. Statements may be false";
    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ alias: 'GPT-Flavor-Text' }),
      content: `<abbr title="${abbr}" class="ask-chatgpt-to fa-solid fa-microchip-ai"></abbr>
				<span class="ask-chatgpt-reply">${reply}</span>`,
      whisper: users.map(u => u.id),
      sound: CONFIG.sounds.notification,
    });
  } catch (e) {
    utils.logError('Failed to provide response.', e);
    ui.notifications.error(e.message, { permanent: true, console: false });
  }
}
