import {
    MarkdownView,
    Plugin,
} from 'obsidian';
import { openDailyNote } from './daily-notes';
import { dateHighlightingPlugin } from './extension';
import { moment } from './moment';
import { createMarkdownPostProcessor } from './post-processor';
import { RelativeDatesSettingTab } from './settings';
import {
    compileDateRegex,
    DEFAULT_SETTINGS,
    RelativeDatesSettings,
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
            (date) => void openDailyNote(this.app, this.settings, date),
        ));
        this.registerMarkdownPostProcessor(createMarkdownPostProcessor(this));
    }

    onunload() { }

    async loadSettings() {
        const data = await this.loadData() as Partial<RelativeDatesSettings>;
        this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
        this.settings.badgeColors = Object.assign({}, DEFAULT_SETTINGS.badgeColors, data?.badgeColors);
        this.updateRegex();
        this.updateStyles();
        await this.saveSettings();
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
            '--relative-date-overdue': this.settings.badgeColors.overdue,
            '--relative-date-today': this.settings.badgeColors.today,
            '--relative-date-tomorrow': this.settings.badgeColors.tomorrow,
            '--relative-date-this-week': this.settings.badgeColors.thisWeek,
            '--relative-date-future': this.settings.badgeColors.future,
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
}
