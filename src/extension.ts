import { syntaxTree } from '@codemirror/language';
import {
    Extension,
    RangeSetBuilder,
} from '@codemirror/state';
import {
    Decoration,
    DecorationSet,
    EditorView,
    PluginValue,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from '@codemirror/view';
import { moment } from 'obsidian';
import {
    getRelativeText,
    getDateCategory,
    createDateElement,
    RelativeDatesSettings,
    buildRegex,
} from './utils';

export class DateWidget extends WidgetType {
    constructor(
        private text: string,
        private category: string,
        private isStruckThrough: boolean = false,
    ) {
        super();
    }

    toDOM() {
        return createDateElement(this.text, this.category, this.isStruckThrough);
    }
}

export class DateHighlightingPlugin implements PluginValue {
    decorations: DecorationSet;

    constructor(view: EditorView, private readonly settings: RelativeDatesSettings) {
        this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || update.selectionSet || update.focusChanged) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    buildDecorations(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>();
        const cursorPos = view.state.selection.main.head;

        syntaxTree(view.state).iterate({
            enter: (node) => {
                if (node.type.name.startsWith('list')) {
                    const text = view.state.doc.sliceString(node.from, node.to);
                    const matches = text.matchAll(buildRegex(this.settings));

                    for (const match of matches) {
                        const matchStart = node.from + match.index;
                        const matchEnd = matchStart + match[0].length;

                        const cursorInRange = cursorPos >= matchStart && cursorPos <= matchEnd;
                        if (!cursorInRange) {
                            const date = moment(`${match[1]} ${match[2] || ''}`, `${this.settings.dateFormat} ${this.settings.timeFormat}`);

                            if (date.isValid()) {
                                const relativeText = getRelativeText(date);
                                const category = getDateCategory(date);
                                const lineText = view.state.doc.lineAt(node.from).text;
                                const isStruckThrough = /\[[x-]\]/i.test(lineText);

                                const decoration = Decoration.replace({
                                    widget: new DateWidget(relativeText, category, isStruckThrough),
                                });

                                builder.add(matchStart, matchEnd, decoration);
                            }
                        }
                    }
                }
            },
        });

        return builder.finish();
    }
}

export function dateHighlightingPlugin(settings: RelativeDatesSettings): Extension {
    const plugin = ViewPlugin.fromClass(
        class extends DateHighlightingPlugin {
            constructor(view: EditorView) {
                super(view, settings);
            };
        },
        { decorations: (value: DateHighlightingPlugin) => value.decorations },
    );
    return plugin;
}