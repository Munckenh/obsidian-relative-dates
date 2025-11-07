import {
    MarkdownView,
    Plugin,
    moment,
} from 'obsidian';
import { RelativeDatesSettingTab } from './settings';
import { dateHighlightingPlugin } from './extension';
import {
    DEFAULT_SETTINGS,
    RelativeDatesSettings,
    getRelativeText,
    getDateCategory,
    createDateElement,
    buildRegex,
} from './utils';

export default class RelativeDatesPlugin extends Plugin {
    settings: RelativeDatesSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new RelativeDatesSettingTab(this.app, this));
        this.registerEditorExtension(dateHighlightingPlugin(this.settings));

        this.registerMarkdownPostProcessor((element) => {
            this.processElement(element);
        });

        this.registerDomEvent(document, 'click', (event) => {
            this.processClickEvent(event);
        });
    }

    onunload() { }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this.updateStyles();
    }

    async saveFormattingSettings() {
        this.app.workspace.getActiveViewOfType(MarkdownView)?.previewMode.rerender(true);
        await this.saveData(this.settings);
    }

    async saveColorSettings() {
        this.updateStyles();
        await this.saveData(this.settings);
    }

    private updateStyles() {
        document.body.setCssProps({
            '--date-pill-overdue': this.settings.pillColors.overdue,
            '--date-pill-today': this.settings.pillColors.today,
            '--date-pill-tomorrow': this.settings.pillColors.tomorrow,
            '--date-pill-this-week': this.settings.pillColors.thisWeek,
            '--date-pill-future': this.settings.pillColors.future,
        });
    }

    private processElement(element: Element) {
        const items = element.querySelectorAll('.task-list-item');
        items.forEach((item: HTMLElement) => this.processTaskItem(item));
    }

    private processClickEvent(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.type !== 'checkbox') return;

        const clickedItem = target.closest('.task-list-item') as HTMLElement;
        if (!clickedItem) return;

        // Allow DOM to update checkbox state first
        setTimeout(() => {
            const items = [clickedItem, ...Array.from(clickedItem.querySelectorAll('.task-list-item'))];
            items.forEach((item: HTMLElement) => {
                item.querySelectorAll('.date-pill').forEach((pill) => {
                    pill.classList.toggle('struck-through', this.isStruckThrough(item));
                });
            });
        }, 10);
    }

    private isStruckThrough(item: HTMLElement) {
        let current = item;
        while (current) {
            if (current.classList.contains('task-list-item')) {
                const taskAttribute = current.getAttribute('data-task');
                if (taskAttribute === 'x' || taskAttribute === '-') return true;
            }

            const parent = current.parentElement?.closest('.task-list-item') as HTMLElement;
            if (parent) {
                current = parent;
            } else {
                break;
            }
        }
        return false;
    }

    private processTaskItem(item: HTMLElement) {
        if ((item.textContent || '').search(buildRegex(this.settings)) === -1) return;

        const nodes = this.getTextNodes(item);
        if (nodes.length > 0) {
            this.processTextNodes(nodes as Text[], this.isStruckThrough(item));
        }
    }

    private getTextNodes(item: HTMLElement) {
        const walker = document.createTreeWalker(
            item,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    let parent = node.parentNode;
                    while (parent && parent !== item) {
                        if (parent.nodeName === 'UL' || parent.nodeName === 'OL') {
                            return NodeFilter.FILTER_REJECT;
                        }
                        parent = parent.parentNode;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                },
            },
        );

        const nodes = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const value = node.nodeValue || '';
            if (value.search(buildRegex(this.settings)) !== -1) nodes.push(node);
        }
        return nodes;
    }

    private processTextNodes(nodes: Text[], isStruckThrough: boolean) {
        nodes.forEach((node) => {
            const value = node.nodeValue || '';
            const matches = Array.from(value.matchAll(buildRegex(this.settings)));
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
                    fragment.appendChild(createDateElement(
                        getRelativeText(date),
                        getDateCategory(date),
                        isStruckThrough,
                    ));
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
}
