import Link from "next/link";
import { notFound } from "next/navigation";
import { MemoryGrid, PageHeading } from "@/components/archive";
import { PhotoGallery } from "@/components/forms";
import { sampleMemories, sampleAlbums, sampleStories, samplePlaces, samplePeople, sampleLinks } from "@/lib/sample-archive";

export default async function SampleDetail({params}: {params:Promise<{section:string;id:string}>}) {
  const {section,id} = await params;
  const back = <Link className="small-link" href={`/demo/${section}`}>← Back to {section}</Link>;
  if (section === "memories") {
    const memory = sampleMemories.find(m=>m.id===id); if (!memory) notFound();
    const links = sampleLinks(id), place = samplePlaces.find(p=>p.id===memory.place_id);
    return <>{back}<PageHeading title={memory.title} description={new Date(memory.memory_date+"T12:00:00").toLocaleDateString("en",{dateStyle:"long"})} />
      <PhotoGallery demo media={memory.media || []} /><div className="sample-reflection"><p>{memory.description}</p><p className="muted">Feeling {memory.mood.toLowerCase()}</p>
      {place && <Link className="small-link" href={`/demo/places/${place.id}`}>{place.name}</Link>}
      <p>With {samplePeople.filter(p=>links.people.includes(p.id)).map(p=>p.name).join(", ")}</p>
      <div className="detail-tags">{links.tags.map(t=><Link key={t} className="small-link" href={`/demo/memories?tag=${t}`}>#{t}</Link>)}</div>
      {sampleAlbums.filter(a=>links.albums.includes(a.id)).map(a=><Link key={a.id} className="small-link" href={`/demo/albums/${a.id}`}>{a.title} →</Link>)}</div></>;
  }
  if (section === "stories") {
    const story = sampleStories.find(s=>s.id===id); if (!story) notFound();
    return <>{back}<PageHeading title={story.title} /><PhotoGallery demo media={sampleMemories[0].media || []} /><div className="sample-reflection story-body">{story.body.split("\n\n").map(p=><p key={p}>{p}</p>)}</div><MemoryGrid memories={sampleMemories.slice(0,3)} demo /></>;
  }
  if (section !== "albums" && section !== "places") notFound();
  const item = section === "albums" ? sampleAlbums.find(a=>a.id===id) : samplePlaces.find(p=>p.id===id); if (!item) notFound();
  const memories = sampleMemories.filter(m=>section === "albums" ? sampleLinks(m.id).albums.includes(id) : m.place_id===id);
  return <>{back}<PageHeading title={"title" in item ? item.title : item.name} description={item.description} /><MemoryGrid memories={memories} demo /></>;
}
