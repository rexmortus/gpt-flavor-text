import { moduleName } from '../../../settings.js';
import { createPrompt } from './rollAttack.prompt.js';
import { AttackRollPromptFormApplication } from './rollAttack.FormApplication.js'
import { chat, utils } from '../../index.js';


export async function main(item, roll) {
    utils.logDebug('Start of rollAttack.main', item, roll);

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

    // Get the GM user, making sure the messages are whispered to them
    // TODO make some utility functions that are available across the module to do this 
    let gmUser = game.users.find(user => user.isGM);

    // item and roll are provided by the hook
    let actor = item?.actor;
    let target = game?.user?.targets?.first()?.actor;
    let scene = game?.scenes?.active;

    if (game.settings.get(moduleName, 'rollAttack-autoPrompt') && roll && target) {
        utils.logDebug('Auto prompt')
        let prompt = createPrompt(actor, item, target, scene, roll);
        chat.respondTo(prompt, gmUser);
    } else {
        utils.logDebug('Manual prompt')
        new AttackRollPromptFormApplication(game.scenes.active, item, game.user.targets, roll, chat.respondTo, createPrompt).render(true);
    }
    // TODO - would like to have the branches above both just return a fully fledged prompt and then call chat.respondTo() once below
    // chat.respondTo(prompt, gmUser);
}