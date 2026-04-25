import {
    PluginSettingTab,
    Setting,
    type App,
} from 'obsidian';
import RelativeDatesPlugin from './main';
import { DEFAULT_SETTINGS } from './utils';

export class RelativeDatesSettingTab extends PluginSettingTab {
    plugin: RelativeDatesPlugin;

    constructor(app: App, plugin: RelativeDatesPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Confirm create note')
            .setDesc('Prompt before creating new note.')
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.requiresConfirmation)
                    .onChange(async (value) => {
                        this.plugin.settings.requiresConfirmation = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('Limit to task items')
            .setDesc('Convert date references only within task list items.')
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.processTaskItemsOnly)
                    .onChange(async (value) => {
                        this.plugin.settings.processTaskItemsOnly = value;
                        await this.plugin.saveFormattingSettings();
                    });
            });

        new Setting(containerEl).setName('Color').setHeading();

        this.addColorSetting(containerEl, 'overdue', 'Overdue', 'Dates that have passed.');
        this.addColorSetting(containerEl, 'today', 'Today', 'Today\'s date.');
        this.addColorSetting(containerEl, 'tomorrow', 'Tomorrow', 'Tomorrow\'s date.');
        this.addColorSetting(containerEl, 'thisWeek', 'This week', 'Dates within the next 7 days.');
        this.addColorSetting(containerEl, 'future', 'Future', 'Dates beyond the next 7 days.');

        new Setting(containerEl).setName('Formatting').setHeading();

        new Setting(containerEl)
            .setName('Prefix')
            .setDesc('Prefix character marking a date.')
            .addText((text) => {
                text
                    .setPlaceholder(DEFAULT_SETTINGS.prefix)
                    .setValue(this.plugin.settings.prefix !== DEFAULT_SETTINGS.prefix ? this.plugin.settings.prefix : '')
                    .onChange(async (value) => {
                        if (value === '') {
                            this.plugin.settings.prefix = DEFAULT_SETTINGS.prefix;
                        } else {
                            this.plugin.settings.prefix = value;
                        }
                        await this.plugin.saveFormattingSettings();
                    });
            });

        const dateDesc = document.createDocumentFragment();
        dateDesc.appendText('Format to parse dates. For syntax, refer to ');
        dateDesc.createEl('a', {
            text: String('format reference'),
            attr: {
                href: 'https://momentjs.com/docs/#/displaying/format/',
                target: '_blank',
            },
        });
        dateDesc.appendText('.');
        dateDesc.createEl('br');
        dateDesc.appendText('Your current syntax looks like this: ');
        const dateSampleEl = dateDesc.createEl('b', 'u-pop');
        new Setting(containerEl)
            .setName('Date format')
            .setDesc(dateDesc)
            .addMomentFormat((momentFormat) => {
                momentFormat
                    .setValue(this.plugin.settings.dateFormat !== DEFAULT_SETTINGS.dateFormat ? this.plugin.settings.dateFormat : '')
                    .setSampleEl(dateSampleEl)
                    .setDefaultFormat(DEFAULT_SETTINGS.dateFormat)
                    .onChange(async (value) => {
                        if (value === '') {
                            this.plugin.settings.dateFormat = DEFAULT_SETTINGS.dateFormat;
                        } else {
                            this.plugin.settings.dateFormat = value;
                        }
                        await this.plugin.saveFormattingSettings();
                    });
            });

        const timeDesc = document.createDocumentFragment();
        timeDesc.appendText('Format to parse times. For syntax, refer to ');
        timeDesc.createEl('a', {
            text: String('format reference'),
            attr: {
                href: 'https://momentjs.com/docs/#/displaying/format/',
                target: '_blank',
            },
        });
        timeDesc.appendText('.');
        timeDesc.createEl('br');
        timeDesc.appendText('Your current syntax looks like this: ');
        const timeSampleEl = timeDesc.createEl('b', 'u-pop');
        new Setting(containerEl)
            .setName('Time format')
            .setDesc(timeDesc)
            .addMomentFormat((momentFormat) => {
                momentFormat
                    .setValue(this.plugin.settings.timeFormat !== DEFAULT_SETTINGS.timeFormat ? this.plugin.settings.timeFormat : '')
                    .setSampleEl(timeSampleEl)
                    .setDefaultFormat(DEFAULT_SETTINGS.timeFormat)
                    .onChange(async (value) => {
                        if (value === '') {
                            this.plugin.settings.timeFormat = DEFAULT_SETTINGS.timeFormat;
                        } else {
                            this.plugin.settings.timeFormat = value;
                        }
                        await this.plugin.saveFormattingSettings();
                    });
            });

        new Setting(containerEl).setName('Support').setHeading();

        new Setting(containerEl)
            .setName('Donate')
            .setDesc('If you find this plugin useful, please consider donating to support its development.')
            .then((setting) => {
                const link = setting.settingEl.createEl('a', {
                    attr: {
                        href: 'https://ko-fi.com/munckenh',
                        target: '_blank',
                    },
                });
                link.createEl('img', {
                    attr: {
                        height: '36',
                        src: 'data:image/png;base64,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',
                        alt: 'Support me at ko-fi.com',
                    },
                });
            });
    }

    private addColorSetting(
        containerEl: HTMLElement,
        key: keyof typeof DEFAULT_SETTINGS.badgeColors,
        name: string,
        description: string,
    ): void {
        new Setting(containerEl)
            .setName(name)
            .setDesc(description)
            .addExtraButton(button => button
                .setIcon('rotate-ccw')
                .setTooltip('Restore default')
                .onClick(async () => {
                    this.plugin.settings.badgeColors[key] = DEFAULT_SETTINGS.badgeColors[key];
                    await this.plugin.saveColorSettings();
                    this.display();
                }),
            )
            .addColorPicker(color => color
                .setValue(this.plugin.settings.badgeColors[key])
                .onChange(async (value) => {
                    this.plugin.settings.badgeColors[key] = value;
                    await this.plugin.saveColorSettings();
                }));
    }
}
