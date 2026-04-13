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
    createDateElement,
    RelativeDatesSettings,
} from './utils';

export class DateWidget extends WidgetType {
    constructor(
        private date: moment.Moment,
        private onClick: () => void,
    ) {
        super();
    }

    toDOM() {
        return createDateElement(this.date, this.onClick);
    }
}

export class DateHighlightingPlugin implements PluginValue {
    decorations: DecorationSet;

    constructor(
        view: EditorView,
        private readonly settings: RelativeDatesSettings,
        private readonly getRegex: () => RegExp,
        private readonly openDailyNote: (date: moment.Moment) => void,
    ) {
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
                    const matches = text.matchAll(this.getRegex());

                    for (const match of matches) {
                        const matchStart = node.from + match.index;
                        const matchEnd = matchStart + match[0].length;

                        const cursorInRange = cursorPos >= matchStart && cursorPos <= matchEnd;
                        if (!cursorInRange) {
                            const date = moment(`${match[1]} ${match[2] || ''}`, `${this.settings.dateFormat} ${this.settings.timeFormat}`);

                            if (date.isValid()) {
                                const decoration = Decoration.replace({
                                    widget: new DateWidget(date, () => this.openDailyNote(date)),
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

export function dateHighlightingPlugin(
    settings: RelativeDatesSettings,
    getRegex: () => RegExp,
    openDailyNote: (date: moment.Moment) => void,
): Extension {
    const plugin = ViewPlugin.fromClass(
        class extends DateHighlightingPlugin {
            constructor(view: EditorView) {
                super(view, settings, getRegex, openDailyNote);
            };
        },
        { decorations: (value: DateHighlightingPlugin) => value.decorations },
    );
    return plugin;
}