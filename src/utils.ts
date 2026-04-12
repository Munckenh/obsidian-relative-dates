import { moment } from 'obsidian';

export const DEFAULT_SETTINGS: RelativeDatesSettings = {
    prefix: '@',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    pillColors: {
        overdue: '#d1453b',
        today: '#058527',
        tomorrow: '#ad6200',
        thisWeek: '#692ec2',
        future: '#808080',
    },
    requiresConfirmation: true,
};

export interface RelativeDatesSettings {
    prefix: string,
    dateFormat: string;
    timeFormat: string;
    pillColors: {
        overdue: string;
        today: string;
        tomorrow: string;
        thisWeek: string;
        future: string;
    };
    requiresConfirmation: boolean;
}

export function buildRegex(settings: RelativeDatesSettings): RegExp {
    const datePattern = settings.dateFormat
        .replace(/YYYY/g, '\\d{4}')
        .replace(/YY/g, '\\d{2}')
        .replace(/MM/g, '\\d{2}')
        .replace(/DD/g, '\\d{2}');

    const timePattern = settings.timeFormat
        .replace(/HH/g, '\\d{2}')
        .replace(/hh/g, '\\d{2}')
        .replace(/mm/g, '\\d{2}')
        .replace(/a/g, '[ap]m')
        .replace(/A/g, '[AP]M');

    return new RegExp(`${settings.prefix}\\s*(${datePattern})\\s*(${timePattern})?`, 'g');
}

export function getRelativeText(date: moment.Moment): string {
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');
    const hasTime = date.minutes() !== 0 || date.hours() !== 0;
    const timeString = hasTime ? date.minutes() === 0 ? ` ${date.format('h A')}` : ` ${date.format('h:mm A')}` : '';

    if (date.isSame(today, 'day')) {
        return `Today${timeString}`;
    } else if (date.isSame(tomorrow, 'day')) {
        return `Tomorrow${timeString}`;
    } else if (date.isBetween(today, moment().add(7, 'days').endOf('day'), 'day')) {
        return `${date.format('dddd')}${timeString}`;
    } else if (date.year() === today.year()) {
        return `${date.format('D MMM')}${timeString}`;
    } else {
        return `${date.format('D MMM YYYY')}${timeString}`;
    }
}

export function getDateCategory(date: moment.Moment): string {
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');
    const sevenDaysFromNow = moment().add(7, 'days').endOf('day');

    if (date.isBefore(today, 'day')) {
        return 'rd-overdue';
    } else if (date.isSame(today, 'day')) {
        return 'rd-today';
    } else if (date.isSame(tomorrow, 'day')) {
        return 'rd-tomorrow';
    } else if (date.isBetween(tomorrow, sevenDaysFromNow, 'day')) {
        return 'rd-this-week';
    }
    return 'rd-future';
}

export function createDateElement(
    date: moment.Moment,
    isStruckThrough: boolean = false,
    onClick?: () => void,
): HTMLElement {
    const span = document.createElement('span');
    span.textContent = getRelativeText(date);
    span.className = `relative-date ${getDateCategory(date)}${isStruckThrough ? ' rd-struck-through' : ''}`;
    if (onClick) span.addEventListener('click', onClick);
    return span;
}
