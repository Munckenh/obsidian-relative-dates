import {
    PluginSettingTab,
    type App,
    type Setting,
    type SettingDefinitionItem,
    type SettingGroupItem,
} from 'obsidian';
import RelativeDatesPlugin from './main';
import { KOFI_IMAGE } from './assets';
import { DEFAULT_SETTINGS, type RelativeDatesSettings } from './utils';

function isSettingKey(key: string): key is keyof RelativeDatesSettings {
    return key in DEFAULT_SETTINGS;
}

export class RelativeDatesSettingTab extends PluginSettingTab {
    plugin: RelativeDatesPlugin;

    constructor(app: App, plugin: RelativeDatesPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    private getThemeTextColor(): string {
        return document.body.hasClass('theme-dark') ? '#ffffff' : '#000000';
    }

    async setControlValue(key: string, value: unknown): Promise<void> {
        if (!isSettingKey(key)) return;
        (this.plugin.settings[key] as unknown) = value;

        if (key.startsWith('badgeColor')) {
            await this.plugin.saveColorSettings();
        } else if (key === 'processTaskItemsOnly' || key === 'relativeFutureDates') {
            await this.plugin.saveFormattingSettings();
        } else {
            await this.plugin.saveSettings();
        }
    }

    getSettingDefinitions(): SettingDefinitionItem[] {
        return [
            {
                name: 'Confirm create note',
                desc: 'Prompt before creating new note.',
                control: { type: 'toggle', key: 'requiresConfirmation' },
            },
            {
                name: 'Limit to task items',
                desc: 'Convert date references only within task list items.',
                control: { type: 'toggle', key: 'processTaskItemsOnly' },
            },
            {
                name: 'Relative future dates',
                desc: 'Show dates beyond the next 7 days as relative text (e.g., in 10 days, in 3 weeks, in 2 months) instead of an absolute date.',
                control: { type: 'toggle', key: 'relativeFutureDates' },
            },
            {
                type: 'group',
                heading: 'Color',
                items: [
                    {
                        name: 'Text color',
                        desc: 'Defaults to match Obsidian\'s color scheme.',
                        render: (setting: Setting) => {
                            setting
                                .addExtraButton(button => button
                                    .setIcon('rotate-ccw')
                                    .setTooltip('Restore default')
                                    .setDisabled(!this.plugin.settings.textColor)
                                    .onClick(async () => {
                                        this.plugin.settings.textColor = '';
                                        await this.plugin.saveColorSettings();
                                        this.update();
                                    }),
                                )
                                .addColorPicker(color => color
                                    .setValue(this.plugin.settings.textColor || this.getThemeTextColor())
                                    .onChange(async (value) => {
                                        this.plugin.settings.textColor = value;
                                        await this.plugin.saveColorSettings();
                                        this.update();
                                    }));
                        },
                    },
                    {
                        name: 'Overdue',
                        desc: 'Dates that have passed.',
                        control: { type: 'color', key: 'badgeColorOverdue', defaultValue: DEFAULT_SETTINGS.badgeColorOverdue },
                    },
                    {
                        name: 'Today',
                        desc: 'Today\'s date.',
                        control: { type: 'color', key: 'badgeColorToday', defaultValue: DEFAULT_SETTINGS.badgeColorToday },
                    },
                    {
                        name: 'Tomorrow',
                        desc: 'Tomorrow\'s date.',
                        control: { type: 'color', key: 'badgeColorTomorrow', defaultValue: DEFAULT_SETTINGS.badgeColorTomorrow },
                    },
                    {
                        name: 'This week',
                        desc: 'Dates within the next 7 days.',
                        control: { type: 'color', key: 'badgeColorThisWeek', defaultValue: DEFAULT_SETTINGS.badgeColorThisWeek },
                    },
                    {
                        name: 'Future',
                        desc: 'Dates beyond the next 7 days.',
                        control: { type: 'color', key: 'badgeColorFuture', defaultValue: DEFAULT_SETTINGS.badgeColorFuture },
                    },
                ],
            },
            {
                type: 'group',
                heading: 'Formatting',
                items: [
                    {
                        name: 'Prefix',
                        desc: 'Prefix character marking a date.',
                        render: (setting: Setting) => {
                            setting.addText((text) => {
                                text
                                    .setPlaceholder(DEFAULT_SETTINGS.prefix)
                                    .setValue(this.plugin.settings.prefix !== DEFAULT_SETTINGS.prefix ? this.plugin.settings.prefix : '')
                                    .onChange(async (value) => {
                                        this.plugin.settings.prefix = value === '' ? DEFAULT_SETTINGS.prefix : value;
                                        await this.plugin.saveFormattingSettings();
                                    });
                            });
                        },
                    },
                    this.momentFormatDefinition('dateFormat', 'Date format', 'Format to parse dates.'),
                    this.momentFormatDefinition('timeFormat', 'Time format', 'Format to parse times.'),
                ],
            },
            {
                type: 'group',
                heading: 'Support',
                items: [
                    {
                        name: 'Donate',
                        desc: 'If you find this plugin useful, please consider donating to support its development.',
                        render: (setting: Setting) => {
                            setting.controlEl.empty();
                            const link = setting.controlEl.createEl('a', {
                                attr: {
                                    href: 'https://ko-fi.com/munckenh',
                                    target: '_blank',
                                },
                            });
                            link.createEl('img', {
                                attr: {
                                    height: '36',
                                    src: KOFI_IMAGE,
                                    alt: 'Support me at ko-fi.com',
                                },
                            });
                        },
                    },
                ],
            },
        ];
    }

    private momentFormatDefinition(key: 'dateFormat' | 'timeFormat', name: string, desc: string): SettingGroupItem {
        return {
            name,
            desc,
            render: (setting: Setting) => {
                const fragment = createFragment();
                fragment.appendText(`${desc} For syntax, refer to `);
                fragment.createEl('a', {
                    text: String('format reference'),
                    attr: {
                        href: 'https://momentjs.com/docs/#/displaying/format/',
                        target: '_blank',
                    },
                });
                fragment.appendText('.');
                fragment.createEl('br');
                fragment.appendText('Your current syntax looks like this: ');
                const sampleEl = fragment.createEl('b', 'u-pop');
                setting.setDesc(fragment);
                setting.addMomentFormat((momentFormat) => {
                    momentFormat
                        .setValue(this.plugin.settings[key] !== DEFAULT_SETTINGS[key] ? this.plugin.settings[key] : '')
                        .setSampleEl(sampleEl)
                        .setDefaultFormat(DEFAULT_SETTINGS[key])
                        .onChange(async (value) => {
                            this.plugin.settings[key] = value === '' ? DEFAULT_SETTINGS[key] : value;
                            await this.plugin.saveFormattingSettings();
                        });
                });
            },
        };
    }
}
