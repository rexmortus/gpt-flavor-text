import { gptApi, utils } from "./index.js";
/**
 * Functions and utilities related to VTT chat/messaging
 */
export async function respondTo(prompt, users) {

    utils.logDebug("respondTo(question,users)", prompt, users);
    
    try {
        // Create a chat message indicating that a request for flavor text is underway
        let noticeMessage = await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ alias: "GPT-Flavor-Text" }),
            content: `<abbr class="gpt-flavor-text fa-solid fa-spinner fa-spin"></abbr>
        <span class="gpt-flavor-text-reply">Fetching flavor text</span><p><small>${prompt}</small></p>`,
            whisper: users.map((u) => u.id),
        }).then(function (result) {
            return result;
        });

        const reply = await gptApi.getGptReplyAsHtml(prompt);

        // Then, create the chat message that will display the text
        await ChatMessage.create({
            user: game.user.id,
            flags: {'gpt-flavor-text': {
                gpt: true,
                prompt: prompt,
            }},
            speaker: ChatMessage.getSpeaker({ alias: "GPT-Flavor-Text" }),
            content: `<abbr class="gpt-flavor-text fa-solid fa-microchip-ai"></abbr>
                  <span class="gpt-flavor-text-reply">${reply}</span>`,
            whisper: users.map((u) => u.id),
            sound: CONFIG.sounds.notification,
        }).then(function (chatMessage) {
            noticeMessage.delete();
        });
    } catch (e) {
        utils.logError("Failed to provide response.", e);
        ui.notifications.error(e.message, { permanent: true, console: false });
    }
}
