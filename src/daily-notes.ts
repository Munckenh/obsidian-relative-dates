import { App } from 'obsidian';
import {
    createDailyNote,
    getAllDailyNotes,
    getDailyNote,
    getDailyNoteSettings,
} from 'obsidian-daily-notes-interface';
import { ConfirmationModal } from './modal';
import { Moment } from './moment';
import { RelativeDatesSettings } from './utils';

export async function openDailyNote(app: App, settings: RelativeDatesSettings, date: Moment) {
    const dailyNotes = getAllDailyNotes();
    let file = getDailyNote(date, dailyNotes);

    if (file) {
        const leaf = app.workspace.getLeaf();
        await leaf.openFile(file);
        return;
    }

    const createAndOpenFile = async () => {
        file = await createDailyNote(date);
        if (file) {
            const leaf = app.workspace.getLeaf();
            await leaf.openFile(file);
        }
    };

    if (!settings.requiresConfirmation) {
        await createAndOpenFile();
        return;
    }

    const filename = date.format(getDailyNoteSettings().format);
    const textFragment = document.createDocumentFragment();
    textFragment.appendText('The note ');
    textFragment.createEl('b', { text: filename });
    textFragment.appendText(' does not exist yet. Would you like to create it?');

    new ConfirmationModal(
        app,
        'Create',
        'Create new daily note?',
        textFragment,
        () => void createAndOpenFile(),
    ).open();
}
