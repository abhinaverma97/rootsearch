import requests
import json
from collections import Counter
import re
import time
from pathlib import Path

def get_board_stats(board_code, quiet=False):
    """
    Fetches the catalog for a board and calculates high-level statistics.
    """
    base_url = "https://a.4cdn.org"
    
    if not quiet:
        print(f"[*] Fetching live catalog for /{board_code}/...")
    
    try:
        response = requests.get(f"{base_url}/{board_code}/catalog.json")
        response.raise_for_status()
        catalog = response.json()
    except Exception as e:
        if not quiet:
            print(f"[!] Error: Could not fetch catalog for /{board_code}/. {e}")
        return None

    total_threads = 0
    total_replies = 0
    total_images = 0
    all_subjects = []
    thread_popularity = [] # List of (thread_id, replies, subject)

    for page in catalog:
        for thread in page['threads']:
            total_threads += 1
            replies = thread.get('replies', 0)
            images = thread.get('images', 0)
            total_replies += replies
            total_images += images
            
            sub = thread.get('sub') or thread.get('com') or ""
            # Clean up HTML tags for word counting
            clean_sub = re.sub('<[^<]+?>', '', str(sub))
            all_subjects.append(clean_sub)
            
            thread_popularity.append({
                'id': thread['no'],
                'replies': replies,
                'subject': clean_sub[:50] + "..." if len(clean_sub) > 50 else clean_sub
            })

    # Find common words in OPs (excluding common stop words)
    stop_words = {'the', 'a', 'to', 'and', 'is', 'in', 'it', 'of', 'for', 'on', 'with', 'this', 'that', 'are', 'be', 'an', 'at', 'as'}
    words = re.findall(r'\w+', " ".join(all_subjects).lower())
    common_words = Counter(w for w in words if len(w) > 3 and w not in stop_words).most_common(10)

    # Sort threads by popularity
    top_threads = sorted(thread_popularity, key=lambda x: x['replies'], reverse=True)[:5]

    stats = {
        'board': board_code,
        'threads': total_threads,
        'replies': total_replies,
        'images': total_images,
        'avg_replies': total_replies / total_threads if total_threads > 0 else 0,
        'image_density': (total_images / (total_replies + total_threads)) * 100 if (total_replies + total_threads) > 0 else 0,
        'top_threads': top_threads,
        'trending_keywords': [w for w, c in common_words]
    }

    if not quiet:
        # Output Stats
        print("\n" + "="*40)
        print(f" STATS FOR /{board_code}/")
        print("="*40)
        print(f"Total Active Threads:  {stats['threads']}")
        print(f"Total Active Replies:  {stats['replies']}")
        print(f"Total Active Images:   {stats['images']}")
        print(f"Avg Replies/Thread:    {stats['avg_replies']:.2f}")
        print(f"Image density:         {stats['image_density']:.1f}%")
        
        print("\nTop 5 Most Popular Threads:")
        for i, t in enumerate(stats['top_threads'], 1):
            print(f" {i}. [{t['id']}] {t['replies']} replies - {t['subject']}")

        print("\nTrending Keywords (in OPs):")
        print(f" {', '.join(stats['trending_keywords'])}")
        print("="*40)
    
    return stats

def get_all_boards_stats():
    """
    Fetches stats for ALL boards and saves them to a single JSON file.
    """
    print("[*] Retrieving board list from 4chan...")
    try:
        r = requests.get("https://a.4cdn.org/boards.json")
        r.raise_for_status()
        boards_list = [b['board'] for b in r.json()['boards']]
    except Exception as e:
        print(f"[!] Failed to get boards list: {e}")
        return

    all_stats = {}
    total = len(boards_list)
    print(f"[*] Found {total} boards. This will take approx {total} seconds due to API limits.")

    # Initialize DB for history tracking and Caching
    from analysis_db import AnalysisDB
    db = AnalysisDB()
    
    for i, board in enumerate(boards_list, 1):
        # API Rule: 1 request per second
        time.sleep(1.1)
        print(f"[{i}/{total}] Processing /{board}/...", end="\r")
        
        stats = get_board_stats(board, quiet=True)
        if stats:
            # 1. Get History for Growth Calc
            prev = db.get_previous_stats(board)
            growth = 0.0
            
            if prev and prev['replies'] > 0:
                # Calculate growth based on replies (activity)
                # growth = ((current - previous) / previous) * 100
                diff = stats['replies'] - prev['replies']
                growth = (diff / prev['replies']) * 100
                
            stats['growth'] = round(growth, 2)
            
            # 2. Save Current to History
            db.save_board_stats(board, stats['threads'], stats['replies'])
            
            # 3. Save Full Stats to DB Cache (for API)
            db.save_board_cache(board, stats)
            
            all_stats[board] = stats
    
    # We no longer write to local JSON file to avoid Docker volume issues
    # But we can still verify count
    print(f"\n[*] Finished! Stats for {len(all_stats)} boards saved to DB Cache.")

if __name__ == "__main__":
    get_all_boards_stats()
