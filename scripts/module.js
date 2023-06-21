import { registerSettings } from './settings.js';
//import * as lib from './lib/lib.js';
import { hooks, utils } from './lib/index.js'

// Initialise the module and register the module settings
Hooks.once('init', async function () {
  utils.log('Initialisation');
  registerSettings();
  // CONFIG.debug.hooks = true;
})

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

Hooks.on('dnd5e.rollAttack', hooks.rollAttack.main);

// Vesitigial Chat window interface
// Usage:
// /? your prompt
// OR
// /w gpt your prompt

Hooks.on('chatMessage', hooks.chatMessage.main);