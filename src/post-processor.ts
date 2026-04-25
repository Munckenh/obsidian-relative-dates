import type { MarkdownPostProcessor } from 'obsidian';
import { openDailyNote } from './daily-notes';
import type RelativeDatesPlugin from './main';
import { moment } from './moment';
import { createDateElement } from './utils';

export function createMarkdownPostProcessor(plugin: RelativeDatesPlugin): MarkdownPostProcessor {
    return (root: HTMLElement) => {
        if (plugin.settings.processTaskItemsOnly) {
            const items = root.querySelectorAll<HTMLElement>('.task-list-item');
            items.forEach((item) => processElement(plugin, item));
        } else {
            processElement(plugin, root);
        }
    };
}

function processElement(plugin: RelativeDatesPlugin, element: HTMLElement) {
    // Return if element doesn't contain a date reference
    if ((element.textContent || '').search(plugin.dateRegex) === -1) return;

    const nodes = getTextNodes(element, plugin.settings.processTaskItemsOnly);
    if (nodes.length === 0) return;

    processTextNodes(plugin, nodes);
}

function getTextNodes(element: HTMLElement, processTaskItemsOnly: boolean): Text[] {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        (node) => {
            if (!node.textContent || node.textContent.trim() === '') {
                return NodeFilter.FILTER_REJECT;
            }

            if (processTaskItemsOnly) {
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;

                const owner = parent.closest('li');
                if (owner !== element) return NodeFilter.FILTER_REJECT;
            }

            return NodeFilter.FILTER_ACCEPT;
        });

    const nodes: Text[] = [];
    while (walker.nextNode()) {
        nodes.push(walker.currentNode as Text);
    }
    return nodes;
}

function processTextNodes(plugin: RelativeDatesPlugin, nodes: Text[]) {
    nodes.forEach((node) => {
        const value = node.nodeValue || '';
        const matches = Array.from(value.matchAll(plugin.dateRegex));
        if (matches.length === 0) return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        for (const match of matches) {
            const matchIndex = match.index;
            const date = moment(`${match[1]} ${match[2] || ''}`, `${plugin.settings.dateFormat} ${plugin.settings.timeFormat}`);

            if (matchIndex > lastIndex) {
                fragment.appendChild(document.createTextNode(value.slice(lastIndex, matchIndex)));
            }

            if (date.isValid()) {
                fragment.appendChild(createDateElement(date, () => void openDailyNote(plugin.app, plugin.settings, date)));
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
