export class AttackRollFormApplication extends FormApplication {
    constructor(scene, item, targets, roll, promptText, respondTo, getHitMissPrompt) {
      super();

        let hostileTokens = game.scenes.active.tokens.contents.filter(token => {
          if (token.disposition === -1) {
              return true;
          } else {
              return false;
          }
        })

        // Data 
        this.scene = scene;
        this.item = item;
        this.actor = item.actor;
        this.targets = targets;
        this.hostileTokens = hostileTokens;
        this.roll = roll;
        this.promptText = promptText
        
        // Callback functions
        this.respondTo = respondTo;
        this.getHitMissPrompt = getHitMissPrompt;
    }
  
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ['form'],
        popOut: true,
        template: 'modules/gpt-flavor-text/scripts/prompts/AttackRollFormApplication.html',
        id: 'gpt-flavor-text',
        title: 'GPT Flavor Text',
      });
    }
  
    getData() {
      return {
        scene: this.scene.journal.name,
        actor: this.item.actor.name,
        targets: this.targets,
        item: this.item.name,
        roll: this.roll,
        hostileTokens: this.hostileTokens
      };
    }
  
    activateListeners(html) {
      super.activateListeners(html);
    }
  
    async _updateObject(event, formData) {

      let gmUser = game.users.filter(user => {
        if (user.isGM) {
            return true;
        } else {
            return false;
        }
      })

      // Get the new target actor
      let target = game?.scenes?.active?.tokens?.get(formData.targetInput)?.actor;
      
      // Get target AC of user-selected 
      let _targetAc = target?.system?.attributes?.ac?.value;

      // Regenerate the prompt text using the formData
      let promptText = `${this.actor.name} attacks ${target.name ? target.name + ' ' : ''}using their ${this.item.name} ${this.scene.journal.name ? 'in a/an ' + this.scene.journal.name : ''}`

      this.respondTo(promptText + ', ' + this.getHitMissPrompt(this.roll, _targetAc) + '. Provide a brief narration of this in the second-person for the player.', gmUser);
    }
  }
