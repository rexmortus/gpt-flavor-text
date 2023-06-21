import { respondTo } from "../../chat.js";

export async function main(chatLog, message, chatData) {
    const echoChatMessage = async (chatData, question) => {
        const toGptHtml = '<span class="ask-chatgpt-to">To: GPT</span><br>';
        chatData.content = `${toGptHtml}${question.replace(/\n/g, "<br>")}`;
        await ChatMessage.create(chatData);
    };

    let match;

    const reWhisper = new RegExp(/^(\/w(?:hisper)?\s)(\[(?:[^\]]+)\]|(?:[^\s]+))\s*([^]*)/, "i");
    match = message.match(reWhisper);
    if (match) {
        const gpt = "gpt";
        const userAliases = match[2]
            .replace(/[[\]]/g, "")
            .split(",")
            .map((n) => n.trim());
        const question = match[3].trim();
        if (userAliases.some((u) => u.toLowerCase() === gpt)) {
            const users = userAliases
                .filter((n) => n.toLowerCase() !== gpt)
                .reduce((arr, n) => arr.concat(ChatMessage.getWhisperRecipients(n)), [game.user]);

            // same error logic as in Foundry
            if (!users.length) throw new Error(game.i18n.localize("ERROR.NoTargetUsersForWhisper"));
            if (users.some((u) => !u.isGM && u.id != game.user.id) && !game.user.can("MESSAGE_WHISPER")) {
                throw new Error(game.i18n.localize("ERROR.CantWhisper"));
            }

            chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
            chatData.whisper = users.map((u) => u.id);
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
}
