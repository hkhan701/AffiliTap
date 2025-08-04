export type LinkType = 'amazon' | 'posttap' | 'joylink' | 'geniuslink';

export interface Template {
    id: string;
    name: string;
    content: string;
    titleWordLimit: number;
    trackingId: string;
    isDefault: boolean;
    linkType: LinkType;
}