export interface UploadResponse {
    message: string;
    document_id: string;
    filename: string;
    status: string;
}

export interface SearchMatch {
    document_id: string;
    filename: string;
}

export interface SearchResponse {
    query: string;
    matches: SearchMatch[];
}