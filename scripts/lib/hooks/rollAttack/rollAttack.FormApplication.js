export class AttackRollPromptFormApplication extends FormApplication {
    constructor(scene, item, targets, roll, respondTo, createAttackRollGPTPrompt) {
        super();

        // TODO move this into a utility function
        let hostileTokens = game.scenes.active.tokens.contents.filter((token) => {
            if (token.disposition === -1) {
                return true;
            } else {
                return false;
            }
        });

        // Data
        this.scene = scene;
        this.item = item;
        this.actor = item.actor;
        this.targets = targets;
        this.hostileTokens = hostileTokens;
        this.roll = roll;

        // Callback functions
        // TODO move these into utility functions
        this.respondTo = respondTo;
        this.createAttackRollGPTPrompt = createAttackRollGPTPrompt;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["form"],
            popOut: true,
            template: "modules/gpt-flavor-text/scripts/lib/hooks/rollAttack/rollAttack.FormApplication.html",
            id: "gpt-flavor-text",
            title: "GPT Flavor Text",
        });
    }

    getData() {
        return {
            scene: this.scene.journal.name,
            actor: this.item.actor.name,
            targets: this.targets,
            item: this.item.name,
            roll: this.roll,
            hostileTokens: this.hostileTokens,
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(event, formData) {
        let gmUser = game.users.filter((user) => {
            if (user.isGM) {
                return true;
            } else {
                return false;
            }
        });

        // Get the new target actor
        let target = game?.scenes?.active?.tokens?.get(formData.targetInput)?.actor;

        this.respondTo(this.createAttackRollGPTPrompt(this.actor, this.item, target, this.scene, this.roll), gmUser);
    }
}
