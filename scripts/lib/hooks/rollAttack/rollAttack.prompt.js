/**
 * Generate prompts for the rollAttack hook.
 * Use create() for the main prompt function
 */
import { utils } from "../../index.js";

const promptInstructions = "Provide a brief narration of this in the second-person for the player.";

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

    let prompt =
        `${_actorName}, ${getHealthPrompt(actor)} ${getEffectsPrompt(actor)}` + // Main actor details
        `, attacks ${_targetName}, ${getHealthPrompt(target)} ${getEffectsPrompt(target)}` + // Target details
        `, using their ${_itemName} ${_sceneName ? "in a/an " + _sceneName : ", "}` + // Item and possible scene
        `${getHitMissPrompt(roll, target)}. ${promptInstructions}`; // Hit/miss prompt and final instructions

    utils.log(prompt);

    return prompt;
};

/**
 *
 * @param    {D20Roll}  roll    The roll object for the attack. Used to check critical hit/miss as well as the roll value.
 * @param    {number}   target  The target
 * @returns  {string}           Modifier for the prompt describing a hit/miss and the confidence of it
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

/**
 *
 * @param     {actor}   actor  The actor
 * @returns   {string}         Modifier for the prompt describing a relevative health of the actor
 */
function getHealthPrompt(actor) {
    let _actorTotalHP = actor?.system?.attributes?.hp?.max;
    let _actorCurrentHP = actor?.system?.attributes?.hp?.value;

    let percentage = _actorCurrentHP / _actorTotalHP;
    var str = "";

    if (percentage == 1) {
        str = "in perfect health";
    } else if (percentage >= 0.8) {
        str = "in excellent health";
    } else if (percentage >= 0.6 && percentage < 0.8) {
        str = "in good health";
    } else if (percentage >= 0.4 && percentage < 0.6) {
        str = "in middling health";
    } else if (percentage >= 0.2 && percentage < 0.4) {
        str = "in poor health";
    } else if (percentage >= 0.0 && percentage < 0.2) {
        str = "in terrible health";
    } else {
        utils.logError("Could not find an appropriate string for " + percentage);
    }
    return str;
}

/**
 *
 * @param    {actor}   actor  The actor
 * @returns  {string}         Modifier for the prompt describing a relevative health of the actor
 */
function getEffectsPrompt(actor) {
    // Guard for any failures (null actor, null temp effects, or 0 length array of effects)
    if (!actor?.temporaryEffects?.length) {
        return "";
    }

    var str = "(who is currently ";
    actor.temporaryEffects.forEach((effect, index) => {
        str +=
            `${index > 0 ? ", " : ""}` + // hope nobody minds an Oxford comma
            `${index === actor.temporaryEffects.length - 1 ? "and " : ""}` +
            `${effect.label.toLowerCase()}`;
    });
    return (str += ")");
}
