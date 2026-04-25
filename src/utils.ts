import { moment, type Moment } from './moment';

export interface RelativeDatesSettings {
    prefix: string,
    dateFormat: string;
    timeFormat: string;
    badgeColors: {
        overdue: string;
        today: string;
        tomorrow: string;
        thisWeek: string;
        future: string;
    };
    requiresConfirmation: boolean;
    processTaskItemsOnly: boolean;
}

export const DEFAULT_SETTINGS: RelativeDatesSettings = {
    prefix: '@',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    badgeColors: {
        overdue: '#d1453b',
        today: '#058527',
        tomorrow: '#ad6200',
        thisWeek: '#692ec2',
        future: '#808080',
    },
    requiresConfirmation: true,
    processTaskItemsOnly: true,
};

function escapeRegex(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function compileDateRegex(settings: RelativeDatesSettings): RegExp {
    let datePattern = escapeRegex(settings.dateFormat);
    let timePattern = escapeRegex(settings.timeFormat);
    const prefix = escapeRegex(settings.prefix);

    datePattern = datePattern
        .replace(/YYYY/g, '\\d{4}')
        .replace(/YY/g, '\\d{2}')
        .replace(/MM/g, '\\d{2}')
        .replace(/DD/g, '\\d{2}');

    timePattern = timePattern
        .replace(/HH/g, '\\d{2}')
        .replace(/hh/g, '\\d{2}')
        .replace(/mm/g, '\\d{2}')
        .replace(/a/g, '[ap]m')
        .replace(/A/g, '[AP]M');

    return new RegExp(`${prefix}\\s*(${datePattern})(?:\\s+(${timePattern}))?`, 'g');
}

function getRelativeText(date: Moment): string {
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
    onClick?: () => void,
): HTMLElement {
    const span = document.createElement('span');
    span.textContent = getRelativeText(date);
    span.className = 'relative-date';
    span.dataset.category = getDateCategory(date);
    if (onClick) span.addEventListener('click', onClick);
    return span;
}
