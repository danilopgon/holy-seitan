const TILE_COUNT = 5

// Stable tint per recipe: the same slug always lands on the same tile
export function getEmojiTile(slug: string): number {
	let hash = 0
	for (const char of slug) {
		hash = (hash * 31 + char.charCodeAt(0)) >>> 0
	}
	return (hash % TILE_COUNT) + 1
}
