/**
 * Generate prompts for the rollAttack hook.
 * Use create() for the main prompt function
 */
import { utils } from "../../index.js";

const promptInstructions = ". Provide a brief narration of this in the second-person for the player.";

export const createPrompt = (actor, item, target, scene, roll) => {
    let _actorName = actor?.name;
    let _itemName = item?.name;

    // If the actor or item aren't defined then we can just skip everything else
    if (!_itemName) {
        utils.logError("No attack item / spell available.");
        return;
    }
    if (!_actorName) {
        utils.logError("No actor defined.");
        return;
    }

    let _sceneName = scene?.name;
    let _targetName = target?.name;

    // Guards with console errors
    if (!_targetName) {
        // Lack of target context shouldn't stop a prompt. Just log error for now
        // TODO ? Add settings flag to suppress errors and warnings
        utils.logError("No targets selected.");
    }
    if (!_sceneName) {
        // Lack of scene context shouldn't stop a prompt. Just log error for now
        // TODO ? Add settings flag to suppress errors and warnings
        utils.logError("No scene defined.");
    }

    let prompt = `${_actorName} attacks ${_targetName ? _targetName + " " : ""} using their ${_itemName} ${
        _sceneName ? "in a/an " + _sceneName : ", "
    } ${getHitMissPrompt(roll, target)} ${promptInstructions}`;

    utils.log(prompt);

    return prompt;
};

/**
 *
 * @param     {D20Roll}   roll  The roll object for the attack. Used to check critical hit/miss as well as the roll value.
 * @param     {number}    target    The target
 * @returns   {string}    Modifier for the prompt describing a hit/miss and the confidence of it
 */
function getHitMissPrompt(roll, target) {
    let _targetAc = target?.system?.attributes?.ac?.value;

    // Handle criticals first
    if (roll?.isCritical) {
        if (roll?.isFumble) {
            return "but critically misses in a dramatic fashion";
        } else {
            return "and critically hits in a dramatic fashion";
        }
    }
    // Return a string based on the hit or miss confidence
    let value = roll.total - _targetAc;
    var str = "";

    if (value >= 10) {
        str = "and lands a very confident hit";
    } else if (value >= 5) {
        str = "and hits";
    } else if (value >= 3) {
        str = "and just barely lands a hit";
    } else if (value >= 0) {
        str = "and lands a hit purely out of luck";
    } else if (value > -3) {
        str = "but barely misses due to slight ineptness or a hint of bad luck";
    } else if (value > -5) {
        str = "but misses with ineptness or bad luck";
    } else if (value > -10) {
        str = "but misses with dramatic ineptness or dramatically bad luck";
    } else if (value <= -10) {
        str = "but completely misses";
    } else {
        utils.logError("Could not find an appropriate string for " + value);
    } // Shouldn't hit this, so logs as an error
    return str;
}
