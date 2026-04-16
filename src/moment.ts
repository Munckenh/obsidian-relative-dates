import { moment as _moment } from 'obsidian';

export type Moment = ReturnType<typeof _moment.utc>;

export const moment = _moment as unknown as {
    (...args: Parameters<typeof _moment.utc>): Moment;
} & typeof _moment;