import type RelativeDatesPlugin from './main';
import { openDailyNote } from './daily-notes';
import { moment } from './moment';
import { createDateElement } from './utils';

export function createMarkdownPostProcessor(plugin: RelativeDatesPlugin) {
    return (element: HTMLElement) => {
        const items = element.querySelectorAll<HTMLElement>('.task-list-item');
        items.forEach((item: HTMLElement) => processTaskItem(plugin, item));
    };
}

function processTaskItem(plugin: RelativeDatesPlugin, item: HTMLElement) {
    if ((item.textContent || '').search(plugin.dateRegex) === -1) return;

    const nodes = getTextNodes(item);
    if (nodes.length > 0) {
        processTextNodes(plugin, nodes as Text[]);
    }
}

function getTextNodes(item: HTMLElement) {
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
