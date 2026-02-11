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
            // eslint-disable-next-line obsidianmd/ui/sentence-case
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
                    /* eslint-disable obsidianmd/ui/sentence-case */
                    .addOption('YYYY-MM-DD', 'YYYY-MM-DD')
                    .addOption('DD-MM-YYYY', 'DD-MM-YYYY')
                    .addOption('MM-DD-YYYY', 'MM-DD-YYYY')
                    /* eslint-enable obsidianmd/ui/sentence-case */
                    .setValue(this.plugin.settings.dateFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.dateFormat = value;
                        await this.plugin.saveFormattingSettings();
                    });
            });

        const timeDesc = document.createDocumentFragment();
        timeDesc.appendText('Format to parse times. For syntax, refer to ');
        timeDesc.createEl('a', {
            // eslint-disable-next-line obsidianmd/ui/sentence-case
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
                    /* eslint-disable obsidianmd/ui/sentence-case */
                    .addOption('HH:mm', 'HH:mm')
                    .addOption('hh:mm a', 'hh:mm a')
                    .addOption('hh:mm A', 'hh:mm A')
                    /* eslint-enable obsidianmd/ui/sentence-case */
                    .setValue(this.plugin.settings.timeFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.timeFormat = value;
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
                        style: 'border:0px;height:36px;',
                        src: 'https://storage.ko-fi.com/cdn/kofi1.png?v=6',
                        border: '0',
                        alt: 'Support me at ko-fi.com',
                    },
                });
            });
    }

    private addColorSetting(
        containerEl: HTMLElement,
        key: keyof typeof DEFAULT_SETTINGS.pillColors,
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
                    this.plugin.settings.pillColors[key] = DEFAULT_SETTINGS.pillColors[key];
                    await this.plugin.saveColorSettings();
                    this.display();
                }),
            )
            .addColorPicker(color => color
                .setValue(this.plugin.settings.pillColors[key])
                .onChange(async (value) => {
                    this.plugin.settings.pillColors[key] = value;
                    await this.plugin.saveColorSettings();
                }));
    }
}
