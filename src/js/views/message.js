// @flow

import g from '../globals';
import * as ui from '../ui';
import * as league from '../core/league';
import bbgmViewReact from '../util/bbgmViewReact';
import Message from './views/Message';
import type {Message as Message_} from '../util/types';

function get(ctx) {
    return {
        mid: ctx.params.mid ? parseInt(ctx.params.mid, 10) : null,
    };
}

async function updateMessage(inputs, updateEvents, state): Promise<void | {message?: Message_}> {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || state.message.mid !== inputs.mid) {
        let message;
        let readThisPageview;
        await g.dbl.tx("messages", "readwrite", async tx => {
            readThisPageview = false;

            // If mid is null, this will open the *unread* message with the highest mid
            await tx.messages.iterate(inputs.mid, 'prev', (messageLocal: Message_, shortCircuit) => {
                message = messageLocal;

                if (!message.read) {
                    shortCircuit(); // Keep looking until we find an unread one!

                    message.read = true;
                    readThisPageview = true;

                    return message;
                }
            });
        });

        if (readThisPageview) {
            if (g.gameOver) {
                ui.updateStatus("You're fired!");
            }

            await ui.updatePlayMenu(null);

            league.updateLastDbChange();
        }

        return {
            message,
        };
    }
}

export default bbgmViewReact.init({
    id: "message",
    get,
    runBefore: [updateMessage],
    Component: Message,
});
