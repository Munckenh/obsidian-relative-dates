import {
    MarkdownView,
    Plugin,
    moment,
} from 'obsidian';
import {
    getDailyNote,
    getAllDailyNotes,
    createDailyNote,
    getDailyNoteSettings,
} from 'obsidian-daily-notes-interface';
import { ConfirmationModal } from './modal';
import { RelativeDatesSettingTab } from './settings';
import { dateHighlightingPlugin } from './extension';
import {
    DEFAULT_SETTINGS,
    RelativeDatesSettings,
    createDateElement,
    compileDateRegex,
} from './utils';

export default class RelativeDatesPlugin extends Plugin {
    public settings!: RelativeDatesSettings;
    public dateRegex!: RegExp;
    private currentDay!: string;

    async onload() {
        this.currentDay = moment().format('YYYY-MM-DD');
        this.registerInterval(window.setInterval(() => this.checkForNewDay(), 60 * 1000));
        await this.loadSettings();
        this.addSettingTab(new RelativeDatesSettingTab(this.app, this));
        this.registerEditorExtension(dateHighlightingPlugin(
            this.settings,
            () => this.dateRegex,
            (date) => void this.openDailyNote(date),
        ));
        this.registerMarkdownPostProcessor((element) => this.processElement(element));
    }

    onunload() { }

    async loadSettings() {
        const data = await this.loadData() as Partial<RelativeDatesSettings>;
        this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
        this.settings.pillColors = Object.assign({}, DEFAULT_SETTINGS.pillColors, data?.pillColors);
        this.updateRegex();
        this.updateStyles();
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async saveFormattingSettings() {
        this.updateRegex();
        this.refreshViews();
        await this.saveData(this.settings);
    }

    async saveColorSettings() {
        this.updateStyles();
        await this.saveData(this.settings);
    }

    private updateRegex() {
        this.dateRegex = compileDateRegex(this.settings);
    }

    private updateStyles() {
        document.body.setCssProps({
            '--relative-date-overdue': this.settings.pillColors.overdue,
            '--relative-date-today': this.settings.pillColors.today,
            '--relative-date-tomorrow': this.settings.pillColors.tomorrow,
            '--relative-date-this-week': this.settings.pillColors.thisWeek,
            '--relative-date-future': this.settings.pillColors.future,
        });
    }

    private checkForNewDay() {
        const today = moment().format('YYYY-MM-DD');
        if (this.currentDay !== today) {
            this.currentDay = today;
            this.refreshViews();
        }
    }

    private refreshViews() {
        this.app.workspace.updateOptions();
        this.app.workspace.iterateAllLeaves((leaf) => {
            if (leaf.view.getViewType() === 'markdown') {
                const view = leaf.view as MarkdownView;
                view.previewMode?.rerender(true);
            }
        });
    }

    private processElement(element: Element) {
        const items = element.querySelectorAll<HTMLElement>('.task-list-item');
        items.forEach((item: HTMLElement) => this.processTaskItem(item));
    }

    private processTaskItem(item: HTMLElement) {
        if ((item.textContent || '').search(this.dateRegex) === -1) return;

        const nodes = this.getTextNodes(item);
        if (nodes.length > 0) {
            this.processTextNodes(nodes as Text[]);
        }
    }

    private getTextNodes(item: HTMLElement) {
        const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT, (node) => {
            const parentElement = node.parentElement;
            if (parentElement && parentElement !== item) {
                const listAncestor = parentElement.closest('ul, ol');
                if (listAncestor && item.contains(listAncestor)) {
                    return NodeFilter.FILTER_REJECT;
                }
            }
            return NodeFilter.FILTER_ACCEPT;
        });

        const nodes = [];
        while (walker.nextNode()) {
            nodes.push(walker.currentNode);
        }
        return nodes;
    }

    private processTextNodes(nodes: Text[]) {
        nodes.forEach((node) => {
            const value = node.nodeValue || '';
            const matches = Array.from(value.matchAll(this.dateRegex));
            if (matches.length === 0) return;

            const fragment = document.createDocumentFragment();
            let lastIndex = 0;

            for (const match of matches) {
                const matchIndex = match.index;
                const date = moment(`${match[1]} ${match[2] || ''}`, `${this.settings.dateFormat} ${this.settings.timeFormat}`);

                if (matchIndex > lastIndex) {
                    fragment.appendChild(document.createTextNode(value.slice(lastIndex, matchIndex)));
                }

                if (date.isValid()) {
                    fragment.appendChild(createDateElement(date, () => void this.openDailyNote(date)));
                } else {
                    fragment.appendChild(document.createTextNode(match[0]));
                }

                lastIndex = matchIndex + match[0].length;
            }

            if (lastIndex < value.length) {
                fragment.appendChild(document.createTextNode(value.slice(lastIndex)));
            }

            node.parentNode!.replaceChild(fragment, node);
        });
    }

    private async openDailyNote(date: moment.Moment) {
        const dailyNotes = getAllDailyNotes();
        let file = getDailyNote(date, dailyNotes);

        if (file) {
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(file);
            return;
        }

        const createAndOpenFile = async () => {
            file = await createDailyNote(date);
            if (file) {
                const leaf = this.app.workspace.getLeaf();
                await leaf.openFile(file);
            }
        };

        if (!this.settings.requiresConfirmation) {
            await createAndOpenFile();
            return;
        }

        const filename = date.format(getDailyNoteSettings().format);
        const textFragment = document.createDocumentFragment();
        textFragment.appendText('The note ');
        textFragment.createEl('b', { text: filename });
        textFragment.appendText(' does not exist yet. Would you like to create it?');

        new ConfirmationModal(
            this.app,
            'Create',
            'Create new daily note?',
            textFragment,
            () => void createAndOpenFile(),
        ).open();
    }
}
