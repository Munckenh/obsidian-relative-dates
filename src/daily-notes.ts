import {
    TFile,
    type App,
} from 'obsidian';
import {
    createDailyNote,
    getAllDailyNotes,
    getDailyNote,
    getDailyNoteSettings,
} from 'obsidian-daily-notes-interface';
import { ConfirmationModal } from './modal';
import type { Moment } from './moment';
import type { RelativeDatesSettings } from './utils';

export async function openDailyNote(app: App, settings: RelativeDatesSettings, date: Moment) {
    const dailyNotes = getAllDailyNotes();
    const file = getDailyNote(date, dailyNotes);

    if (file) {
        const leaf = app.workspace.getLeaf();
        await leaf.openFile(file);
        return;
    }

    const createAndOpenFile = async () => {
        const newFile = await createDailyNote(date);
        if (newFile instanceof TFile) {
            const leaf = app.workspace.getLeaf();
            await leaf.openFile(newFile);
        }
    };

    if (!settings.requiresConfirmation) {
        await createAndOpenFile();
        return;
    }

    const filename = date.format(getDailyNoteSettings().format);
    const textFragment = createFragment();
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
