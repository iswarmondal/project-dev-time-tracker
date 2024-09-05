import { Timestamp, type DocumentData } from 'firebase/firestore';

export interface Project extends DocumentData {
	name?: string;
    totalSecondsSpent?: number;
    lastCountStarted?: Timestamp;
    isCounting?: boolean
}
