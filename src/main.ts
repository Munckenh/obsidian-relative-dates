import {
    Plugin,
    type MarkdownView,
} from 'obsidian';
import { openDailyNote } from './daily-notes';
import { dateHighlightingPlugin } from './extension';
import { moment } from './moment';
import { createMarkdownPostProcessor } from './post-processor';
import { RelativeDatesSettingTab } from './settings';
import {
    compileDateRegex,
    DEFAULT_SETTINGS,
    type RelativeDatesSettings,
} from './utils';

export default class RelativeDatesPlugin extends Plugin {
    public declare settings: RelativeDatesSettings;
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
        if (this.settings.textColor) {
            activeDocument.body.setCssProps({
                '--relative-date-text-color': this.settings.textColor,
            });
        } else {
            activeDocument.body.style.removeProperty('--relative-date-text-color');
        }
        activeDocument.body.setCssProps({
            '--relative-date-overdue': this.settings.badgeColorOverdue,
            '--relative-date-today': this.settings.badgeColorToday,
            '--relative-date-tomorrow': this.settings.badgeColorTomorrow,
            '--relative-date-this-week': this.settings.badgeColorThisWeek,
            '--relative-date-future': this.settings.badgeColorFuture,
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
