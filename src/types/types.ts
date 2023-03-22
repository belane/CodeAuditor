export enum fileState {
    Pending = 'pending',
    Reviewed = 'reviewed',
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

export type NoteCollection = {
    [key: number]: Note ;
}

export type FileCollection = {
    [key: string]: FileInfo ;
}

export type FileInfo = {
    lines: number;
    state: fileState;
    notes: NoteCollection;
}

export interface CodeAuditorData {
    exclude: string[];
    files: FileCollection;
}
