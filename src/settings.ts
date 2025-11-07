import RelativeDatesPlugin from './main';
import { DEFAULT_SETTINGS } from './utils';
import {
    App,
    PluginSettingTab,
    Setting,
} from 'obsidian';

export class RelativeDatesSettingTab extends PluginSettingTab {
    plugin: RelativeDatesPlugin;

    constructor(app: App, plugin: RelativeDatesPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl).setName('Color').setHeading();

        new Setting(containerEl)
            .setName('Overdue')
            .setDesc('Dates that have passed.')
            .addExtraButton(button => button
                .setIcon('rotate-ccw')
                .setTooltip('Restore default')
                .onClick(async () => {
                    this.plugin.settings.pillColors.overdue = DEFAULT_SETTINGS.pillColors.overdue;
                    this.plugin.saveColorSettings();
                    this.display();
                }),
            )
            .addColorPicker(color => color
                .setValue(this.plugin.settings.pillColors.overdue)
                .onChange(async (value) => {
                    this.plugin.settings.pillColors.overdue = value;
                    this.plugin.saveColorSettings();
                }));

        new Setting(containerEl)
            .setName('Today')
            .setDesc('Today\'s date.')
            .addExtraButton(button => button
                .setIcon('rotate-ccw')
                .setTooltip('Restore default')
                .onClick(async () => {
                    this.plugin.settings.pillColors.today = DEFAULT_SETTINGS.pillColors.today;
                    this.plugin.saveColorSettings();
                    this.display();
                }),
            )
            .addColorPicker(color => color
                .setValue(this.plugin.settings.pillColors.today)
                .onChange(async (value) => {
                    this.plugin.settings.pillColors.today = value;
                    this.plugin.saveColorSettings();
                }));

        new Setting(containerEl)
            .setName('Tomorrow')
            .setDesc('Tomorrow\'s date.')
            .addExtraButton(button => button
                .setIcon('rotate-ccw')
                .setTooltip('Restore default')
                .onClick(async () => {
                    this.plugin.settings.pillColors.tomorrow = DEFAULT_SETTINGS.pillColors.tomorrow;
                    this.plugin.saveColorSettings();
                    this.display();
                }),
            )
            .addColorPicker(color => color
                .setValue(this.plugin.settings.pillColors.tomorrow)
                .onChange(async (value) => {
                    this.plugin.settings.pillColors.tomorrow = value;
                    this.plugin.saveColorSettings();
                }));

        new Setting(containerEl)
            .setName('This week')
            .setDesc('Dates within the next 7 days.')
            .addExtraButton(button => button
                .setIcon('rotate-ccw')
                .setTooltip('Restore default')
                .onClick(async () => {
                    this.plugin.settings.pillColors.thisWeek = DEFAULT_SETTINGS.pillColors.thisWeek;
                    this.plugin.saveColorSettings();
                    this.display();
                }),
            )
            .addColorPicker(color => color
                .setValue(this.plugin.settings.pillColors.thisWeek)
                .onChange(async (value) => {
                    this.plugin.settings.pillColors.thisWeek = value;
                    this.plugin.saveColorSettings();
                }));

        new Setting(containerEl)
            .setName('Future')
            .setDesc('Dates beyond the next 7 days.')
            .addExtraButton(button => button
                .setIcon('rotate-ccw')
                .setTooltip('Restore default')
                .onClick(async () => {
                    this.plugin.settings.pillColors.future = DEFAULT_SETTINGS.pillColors.future;
                    this.plugin.saveColorSettings();
                    this.display();
                }),
            )
            .addColorPicker(color => color
                .setValue(this.plugin.settings.pillColors.future)
                .onChange(async (value) => {
                    this.plugin.settings.pillColors.future = value;
                    this.plugin.saveColorSettings();
                }));

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
                        this.plugin.saveFormattingSettings();
                    });
            });

        const dateDesc = document.createDocumentFragment();
        dateDesc.appendText('Format to parse dates. For syntax, refer to ');
        dateDesc.createEl('a', {
            text: 'format reference',
            attr: {
                href: 'https://momentjs.com/docs/#/displaying/format/',
                target: '_blank',
            },
        });
        dateDesc.appendText('.');
        new Setting(containerEl)
            .setName('Date format')
            .setDesc(dateDesc)
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('YYYY-MM-DD', 'YYYY-MM-DD')
                    .addOption('DD-MM-YYYY', 'DD-MM-YYYY')
                    .addOption('MM-DD-YYYY', 'MM-DD-YYYY')
                    .setValue(this.plugin.settings.dateFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.dateFormat = value;
                        this.plugin.saveFormattingSettings();
                    });
            });

        const timeDesc = document.createDocumentFragment();
        timeDesc.appendText('Format to parse times. For syntax, refer to ');
        timeDesc.createEl('a', {
            text: 'format reference',
            attr: {
                href: 'https://momentjs.com/docs/#/displaying/format/',
                target: '_blank',
            },
        });
        timeDesc.appendText('.');
        new Setting(containerEl)
            .setName('Time format')
            .setDesc(timeDesc)
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('HH:mm', 'HH:mm')
                    .addOption('hh:mm a', 'hh:mm a')
                    .addOption('hh:mm A', 'hh:mm A')
                    .setValue(this.plugin.settings.timeFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.timeFormat = value;
                        this.plugin.saveFormattingSettings();
                    });
            });
    }
}
