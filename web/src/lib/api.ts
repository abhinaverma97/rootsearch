// import allBoardStats from '../../../data/allBoardStats.json';

import { BOARD_CATEGORIES } from './categories';

export interface Evidence {
    post_id: number;
    quote: string;
    relevance: string;
}

export interface Opportunity {
    id: number;
    boards: string;
    category: string;
    pain_points: string[];
    emerging_trend: string;
    solution: string;
    product_concept: string;
    target_audience: string;
    market_score: number;
    complexity: 'Low' | 'Medium' | 'High';
    market_size: 'Niche' | 'Mid-size' | 'Mass Market';
    product_domain: string;
    intent_category: string;
    flair_type: string;
    core_pain: string;
    timestamp: string;
    evidence: Evidence[];
}

export interface BoardStat {
    board: string;
    threads: number;
    replies: number;
    growth: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Token Cache
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAuthToken(): Promise<string | null> {
    const now = Date.now() / 1000;
    if (cachedToken && tokenExpiry && now < tokenExpiry - 60) {
        return cachedToken;
    }

    try {
        const res = await fetch('/api/auth/token');
        if (res.ok) {
            const data = await res.json();
            cachedToken = data.token;
            // Decode exp to set expiry or just assume 50 mins? 
            // Simplified: Just use it.
            return data.token;
        }
    } catch (e) {
        // ignore
    }
    return null;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await getAuthToken();
    const headers = {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    } as HeadersInit;

    return fetch(url, { ...options, headers });
}

export interface GlobalStats {
    posts: number;
    boards: number;
}

export async function fetchGlobalStats(): Promise<GlobalStats> {
    const response = await fetchWithAuth(`${API_BASE_URL}/stats/global`);
    if (!response.ok) {
        throw new Error('Failed to fetch global stats');
    }
    return response.json();
}

/**
 * Fetches opportunities for a list of boards with optional filtering.
 */
export async function fetchOpportunities(boards: string[], filters?: {
    score_min?: number;
    complexity?: string;
    size?: string;
    intent?: string;
    flair?: string;
}): Promise<Opportunity[]> {
    const params = new URLSearchParams();
    params.append('board', boards.join(','));
    params.append('limit', '50');

    if (filters) {
        if (filters.score_min) params.append('score_min', filters.score_min.toString());
        if (filters.complexity) params.append('complexity', filters.complexity);
        if (filters.size) params.append('size', filters.size);
        if (filters.intent) params.append('intent', filters.intent);
        if (filters.flair) params.append('flair', filters.flair);
    }

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/opportunities?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch opportunities');
        return await response.json();
    } catch (error) {
        console.error('Error fetching opportunities:', error);
        return [];
    }
}

/**
 * Resolves a slug (board code or category name) to an array of board codes.
 */
export async function resolveSlugToBoards(slug: string): Promise<string[]> {
    // 1. Check if it's a known category
    const decodedSlug = decodeURIComponent(slug);
    const category = BOARD_CATEGORIES.find(c => c.name === decodedSlug);
    if (category) return category.boards;

    // 2. Check for curated collections
    try {
        const collections = await fetchCollections();
        const collection = collections.find(c => c.name === decodedSlug);
        if (collection) return collection.boards;
    } catch (err) {
        // Silently fail if not authenticated or error
    }

    // 3. Otherwise assume it's a board code (or list of codes)
    return decodedSlug.split(',').map(b => b.trim().toLowerCase());
}

/**
 * Aggregates stats for multiple boards from the local stats file.
 */
export async function fetchAggregatedStats(boards: string[]) {
    let stats: Record<string, any> = {};
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/boards/stats`);
        if (res.ok) {
            stats = await res.json();
        }
    } catch (err) {
        console.error('Failed to fetch board stats:', err);
    }

    let totalThreads = 0;
    let totalReplies = 0;
    let totalImages = 0;
    let growthSum = 0;
    let boardsFound = 0;
    const allTopThreads: any[] = [];
    const allKeywords: string[] = [];

    boards.forEach(board => {
        const boardData = stats[board];
        if (boardData) {
            totalThreads += boardData.threads || 0;
            totalReplies += boardData.replies || 0;
            totalImages += boardData.images || 0;
            growthSum += boardData.growth || 0;
            boardsFound++;

            // Collect top threads
            if (boardData.top_threads) {
                allTopThreads.push(...boardData.top_threads.slice(0, 3));
            }

            // Collect trending keywords
            if (boardData.trending_keywords) {
                allKeywords.push(...boardData.trending_keywords);
            }
        }
    });

    // Sort and get top 5 threads overall
    const topThreads = allTopThreads
        .sort((a, b) => (b.replies || 0) - (a.replies || 0))
        .slice(0, 5);

    // Get unique top keywords
    const uniqueKeywords = [...new Set(allKeywords)].slice(0, 10);

    const avgReplies = totalThreads > 0 ? totalReplies / totalThreads : 0;
    const imageDensity = totalReplies > 0 ? (totalImages / totalReplies) * 100 : 0;

    return {
        boards: boards.join(', '),
        boardsCount: boardsFound,
        threads: totalThreads,
        replies: totalReplies,
        images: totalImages,
        avg_replies: Number(avgReplies.toFixed(1)),
        image_density: Number(imageDensity.toFixed(1)),
        growth: boardsFound > 0 ? Number((growthSum / boardsFound).toFixed(1)) : 0,
        top_threads: topThreads,
        trending_keywords: uniqueKeywords
    };
}

/**
 * Fetches raw stats for ALL boards.
 */
export async function fetchAllBoardStats(): Promise<Record<string, any>> {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/boards/stats`);
        if (!res.ok) throw new Error('Failed to fetch board stats');
        return await res.json();
    } catch (err) {
        console.error('Failed to fetch all board stats:', err);
        return {};
    }
}

export interface AdvancedSearchParams {
    q: string;
    mode: 'live' | 'analyzed';
    page?: number;
    limit?: number;
    filters?: {
        boards?: string;
        score_min?: number;
        complexity?: string;
        size?: string;
        intent?: string;
        flair?: string;
        category?: string;
    };
    sort_by?: 'date' | 'score';
    sort_order?: 'asc' | 'desc';
}

export interface SearchResult {
    results: any[];
    meta: {
        total: number;
        page: number;
        limit: number;
        mode: 'live' | 'analyzed';
    };
    aggregations: any;
}

export async function searchAdvanced(params: AdvancedSearchParams): Promise<SearchResult> {
    const query = new URLSearchParams();
    query.append('q', params.q);
    query.append('mode', params.mode);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);

    if (params.filters) {
        if (params.filters.boards) query.append('boards', params.filters.boards);
        if (params.filters.score_min) query.append('score_min', params.filters.score_min.toString());
        if (params.filters.complexity) query.append('complexity', params.filters.complexity);
        if (params.filters.size) query.append('size', params.filters.size);
        if (params.filters.intent) query.append('intent', params.filters.intent);
        if (params.filters.flair) query.append('flair', params.filters.flair);
        if (params.filters.category) query.append('category', params.filters.category);
    }

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/advanced-search?${query.toString()}`);
        if (!response.ok) throw new Error('Search failed');
        return await response.json();
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}

export interface ThreadPost {
    no: number;
    time: number;
    com: string;
    is_op: number;
}

export interface ThreadDetail {
    thread_id: number;
    board: string;
    subject: string;
    last_modified: number;
    reply_count: number;
    image_count: number;
    posts: ThreadPost[];
}

export async function fetchThread(board: string, thread_id: number): Promise<ThreadDetail | null> {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/threads/${board}/${thread_id}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Fetch thread error:', error);
        return null;
    }
}

// --- Keywords API ---

export interface KeywordStats {
    keyword: string;
    label: string;
    unread_count: number;
    last_match_at: string | null;
}

export interface KeywordMatch {
    post_id: number;
    board: string;
    thread_id: number;
    comment: string;
    found_at: number;
    is_read: number;
}

export async function getKeywords(): Promise<{ keywords: KeywordStats[] }> {
    const res = await fetchWithAuth('/api/keywords');
    if (!res.ok) throw new Error('Failed to fetch keywords');
    return res.json();
}

export async function fetchKeywordMatches(keyword: string): Promise<{ matches: KeywordMatch[] }> {
    const res = await fetchWithAuth(`/api/keywords/matches?keyword=${encodeURIComponent(keyword)}`);
    if (!res.ok) throw new Error('Failed to fetch matches');
    return res.json();
}

export async function addKeyword(keyword: string, label?: string): Promise<any> {
    const res = await fetchWithAuth('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, label })
    });
    if (!res.ok) throw new Error('Failed to add keyword');
    return res.json();
}

export async function markKeywordRead(keyword: string): Promise<any> {
    const res = await fetchWithAuth(`/api/keywords/${encodeURIComponent(keyword)}/read`, {
        method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to mark read');
    return res.json();
}

// --- Saved Items API ---

export async function fetchSavedOpportunities(): Promise<any[]> {
    const response = await fetchWithAuth('/api/saved');
    if (!response.ok) throw new Error('Failed to fetch saved items');
    return response.json();
}

export async function saveOpportunity(opportunity: Opportunity): Promise<void> {
    const response = await fetchWithAuth('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            opportunityId: opportunity.id,
            data: opportunity
        })
    });
    if (!response.ok) throw new Error('Failed to save opportunity');
}

export async function unsaveOpportunity(id: number): Promise<void> {
    const response = await fetchWithAuth(`/api/saved/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to unsave opportunity');
}

// --- Collections API ---

export async function fetchCollections(): Promise<any[]> {
    const response = await fetchWithAuth('/api/collections');
    if (!response.ok) throw new Error('Failed to fetch collections');
    return response.json();
}

export async function saveCollection(name: string, boards: string[]): Promise<void> {
    const response = await fetchWithAuth('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, boards })
    });
    if (!response.ok) throw new Error('Failed to save collection');
}

export async function deleteCollectionApi(name: string): Promise<void> {
    const response = await fetchWithAuth(`/api/collections/${encodeURIComponent(name)}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete collection');
}
