import { moment, type Moment } from './moment';

export interface RelativeDatesSettings {
    prefix: string,
    dateFormat: string;
    timeFormat: string;
    textColor: string;
    badgeColors: {
        overdue: string;
        today: string;
        tomorrow: string;
        thisWeek: string;
        future: string;
    };
    requiresConfirmation: boolean;
    processTaskItemsOnly: boolean;
    relativeFutureDates: boolean;
}

export const DEFAULT_SETTINGS: RelativeDatesSettings = {
    prefix: '@',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    textColor: '',
    badgeColors: {
        overdue: '#d1453b',
        today: '#058527',
        tomorrow: '#ad6200',
        thisWeek: '#692ec2',
        future: '#808080',
    },
    requiresConfirmation: true,
    processTaskItemsOnly: true,
    relativeFutureDates: false,
};

function escapeRegex(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TOKEN_PATTERNS: Record<string, string> = {
    YYYY: '\\d{4}',
    YY: '\\d{2}',
    MMMM: '\\p{L}+',
    MMM: '\\p{L}+\\.?',
    MM: '\\d{2}',
    M: '\\d{1,2}',
    DD: '\\d{2}',
    D: '\\d{1,2}',
    dddd: '\\p{L}+',
    ddd: '\\p{L}+\\.?',
    HH: '\\d{2}',
    H: '\\d{1,2}',
    hh: '\\d{2}',
    h: '\\d{1,2}',
    mm: '\\d{2}',
    m: '\\d{1,2}',
    ss: '\\d{2}',
    s: '\\d{1,2}',
    A: '[AP]M',
    a: '[ap]m',
};

const FORMAT_TOKEN = /\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|A|a|[\s\S]/g;

function formatToPattern(format: string): string {
    return format.replace(FORMAT_TOKEN, (token, literal: string | undefined) => {
        if (literal !== undefined) return escapeRegex(literal);
        return TOKEN_PATTERNS[token] ?? escapeRegex(token);
    });
}

export function compileDateRegex(settings: RelativeDatesSettings): RegExp {
    const prefix = escapeRegex(settings.prefix);
    const datePattern = formatToPattern(settings.dateFormat);
    const timePattern = formatToPattern(settings.timeFormat);

    return new RegExp(`${prefix}\\s*(${datePattern})(?:\\s+(${timePattern}))?(?!\\d)`, 'gu');
}

function getRelativeText(date: Moment, settings: RelativeDatesSettings): string {
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');
    const hasTime = date.minutes() !== 0 || date.hours() !== 0;

    let timeString = '';
    if (hasTime) {
        timeString = date.minutes() === 0 ? ` ${date.format('h A')}` : ` ${date.format('h:mm A')}`;
    }

    if (date.isSame(today, 'day')) {
        return `Today${timeString}`;
    }
    if (date.isSame(tomorrow, 'day')) {
        return `Tomorrow${timeString}`;
    }
    if (date.isBetween(today, moment().add(7, 'days').endOf('day'), 'day')) {
        return `${date.format('dddd')}${timeString}`;
    }
    if (settings.relativeFutureDates && date.isAfter(today, 'day')) {
        const days = date.clone().startOf('day').diff(today, 'days');
        let text: string;
        if (days < 14) {
            text = `in ${days} days`;
        } else if (days < 60) {
            text = `in ${Math.round(days / 7)} weeks`;
        } else {
            text = moment.duration(days, 'days').humanize(true);
        }
        return `${text}${timeString}`;
    }
    if (date.year() === today.year()) {
        return `${date.format('D MMM')}${timeString}`;
    }
    return `${date.format('D MMM YYYY')}${timeString}`;
}

function getDateCategory(date: Moment): string {
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');
    const sevenDaysFromNow = moment().add(7, 'days').endOf('day');

    if (date.isBefore(today, 'day')) {
        return 'overdue';
    }
    if (date.isSame(today, 'day')) {
        return 'today';
    }
    if (date.isSame(tomorrow, 'day')) {
        return 'tomorrow';
    }
    if (date.isBetween(tomorrow, sevenDaysFromNow, 'day')) {
        return 'this-week';
    }
    return 'future';
}

export function createDateElement(
    date: Moment,
    settings: RelativeDatesSettings,
    onClick?: () => void,
): HTMLElement {
    const span = createSpan();
    span.textContent = getRelativeText(date, settings);
    span.className = 'relative-date';
    span.dataset.category = getDateCategory(date);
    if (onClick) span.addEventListener('click', onClick);
    return span;
}
