import type { Memory, Album, Story, Place, Person, Search } from "./types";

// Presentation-only fixtures. No database client, mutations or user identifiers.
export const samplePeople: Person[] = [
  { id: "maya", name: "Maya", relationship: "Friend", note: "Always makes room at the table." },
  { id: "leo", name: "Leo", relationship: "Brother", note: "Collector of small adventures." },
  { id: "june", name: "June", relationship: "Family", note: "The heart of every gathering." },
];
export const samplePlaces: Place[] = [
  { id: "at-home", name: "At home", description: "The kitchen, the garden, the familiar corners. A fictional place for everyday memories.", address: "A place of our own", latitude: null, longitude: null },
  { id: "away", name: "Out in the world", description: "A stretch of coast, a mountain lake, a little more sky. A fictional collection of places visited.", address: "Along the way", latitude: null, longitude: null },
];
const rows = [
  ["sunday-table", "Sunday, with room for everyone", "2026-09-20", "dinner", "The meal went cold while the conversation carried on. Nobody minded. We pulled up another chair and stayed until the light was gone.", "at-home", "Grateful", ["maya", "leo"], ["together"], ["together", "weekends"]],
  ["flour-everywhere", "Flour on the counter, laughter in the kitchen", "2026-09-06", "baking", "We tried the recipe twice. The second batch was better, but the first is the one we will remember. A slow morning, with nowhere else to be.", "at-home", "Content", ["june"], ["ordinary"], ["family", "little-things"]],
  ["one-more-wish", "One more wish", "2026-08-22", "birthday", "All the candles, all the voices, all at once. The cake leaned a little to the left. It was perfect.", "at-home", "Joyful", ["june", "leo"], ["together"], ["family", "together"]],
  ["last-light", "We stayed for the last light", "2026-07-18", "beach", "Shoes in our hands and sand in everything. We took the long way back so the evening could last a little longer.", "away", "Peaceful", ["maya", "leo"], ["together", "ordinary"], ["weekends", "little-things"]],
  ["nothing-planned", "An afternoon with nothing planned", "2026-06-13", "picnic", "Someone brought a blanket. Someone brought too much bread. We talked about everything and nothing, and watched the afternoon turn into evening.", "away", "Easy", ["maya"], ["ordinary"], ["together", "weekends"]],
  ["beyond-the-bend", "A little further, beyond the bend in the lake", "2026-05-04", "journey", "The water was quiet enough to hear the oars. For a while, the only plan was to keep looking.", "away", "Wonder", ["leo"], ["ordinary"], ["travel", "little-things"]],
] as const;
export const sampleMemories: Memory[] = rows.map(([id, title, date, image, description, place, mood], index) => ({
  id, title, memory_date: date, memory_time: null, description, mood, favorite: index % 2 === 0,
  place_id: place, created_at: `${date}T12:00:00Z`,
  media: [{ id: `${id}-photo`, memory_id: id, path: `/samples/${image}-1280.webp`, caption: ["Friends sharing a meal outdoors", "A parent and child kneading dough", "Family gathered around birthday candles", "Friends walking together along the beach", "Friends talking over an evening picnic", "A boat on a mountain lake"][index], position: 0, url: `/samples/${image}-1280.webp`, preview_url: `/samples/${image}-640.webp` }],
}));
export const sampleAlbums: Album[] = [
  {id:"together", title:"The people, the days", description:"The table gets longer. The stories get better. A few moments spent together.", cover_media_id:"sunday-table-photo", created_at:"2026-09-20"},
  {id:"ordinary", title:"The beautiful ordinary", description:"No occasion needed. A collection of small things that turned out to be the big things.", cover_media_id:"flour-everywhere-photo", created_at:"2026-09-06"},
];
export const sampleStories: Story[] = [{id:"room-at-the-table", title:"There is always room at the table", body:"I used to think the days worth remembering would announce themselves. A birthday. A departure. The first time we saw a place we had only imagined.\n\nBut looking back, so much of a life happens between those days. The bread that did not rise. The walk that took longer than it should. Another chair pulled up to a table that was already full.\n\nThese are the things I want to keep: how it felt to be there, and who was beside me. The beautiful, ordinary business of being together.", status:"saved", cover_media_id:"sunday-table-photo", created_at:"2026-09-21"}];
export const sampleTags = [...new Set(rows.flatMap(r => [...r[9]]))].map(name => ({id:name, name}));
export function sampleLinks(id: string) {
  const row = rows.find(r => r[0] === id);
  return { people: row ? [...row[7]] as string[] : [], albums: row ? [...row[8]] as string[] : [], tags: row ? [...row[9]] as string[] : [] };
}
export function filterSampleMemories(search: Search) {
  const q = (search.q || "").trim().toLowerCase();
  return sampleMemories.filter(memory => {
    const links = sampleLinks(memory.id);
    const text = [memory.title, memory.description, memory.mood, samplePlaces.find(p=>p.id===memory.place_id)?.name,
      ...samplePeople.filter(p=>links.people.includes(p.id)).map(p=>p.name), ...sampleAlbums.filter(a=>links.albums.includes(a.id)).map(a=>a.title), ...links.tags].join(" ").toLowerCase();
    return (!q || text.includes(q)) && (!search.from || memory.memory_date >= search.from) && (!search.to || memory.memory_date <= search.to)
      && (!search.place || memory.place_id === search.place) && (!search.person || links.people.includes(search.person))
      && (!search.album || links.albums.includes(search.album)) && (!search.tag || links.tags.includes(search.tag))
      && (search.favorites !== "true" || memory.favorite) && (search.type !== "written");
  }).toSorted((a,b) => search.order === "oldest" ? a.memory_date.localeCompare(b.memory_date) : b.memory_date.localeCompare(a.memory_date));
}
