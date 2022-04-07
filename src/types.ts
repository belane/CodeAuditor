export enum fileState {
    Pending = 'pending',
    Reviewed = 'reviewed',
    Excluded = 'excluded',
}

export enum noteState {
    Open  = 'open',
    Confirmed = 'confirmed',
    Discarded = 'discarded',
}

export enum noteType {
    Note = 'note',
    Issue = 'issue',
}

export type Note = {
    length: number;
    message?: string;
    type: noteType;
    state: noteState;
}

export type FileNotes = {
    lines: number;
    state: fileState;
    notes:{ [key: number]: Note };
}

export interface CodeAuditorData {
    exclude: string[];
    files: { [key: string]: FileNotes };
}
