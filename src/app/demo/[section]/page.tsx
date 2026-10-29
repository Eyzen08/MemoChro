import Link from "next/link";
import { notFound } from "next/navigation";
import { Filters, MemoryGrid, PageHeading, SectionTitle } from "@/components/archive";
import { SamplePhoto } from "@/components/sample-photo";
import { filterSampleMemories, sampleMemories, sampleAlbums, sampleStories, samplePlaces, samplePeople, sampleTags } from "@/lib/sample-archive";
import type { Search } from "@/lib/types";

export default async function SampleSection({params, searchParams}: {params: Promise<{section:string}>; searchParams: Promise<Search>}) {
  const {section} = await params;
  if (!["home", "timeline", "memories", "albums", "stories", "places"].includes(section)) notFound();
  const search = await searchParams;
  const memories = filterSampleMemories(search);
  if (section === "home") return <>
    <div className="sample-intro"><div><h1>A life made of little things.</h1><p>Six moments, familiar faces, and the stories between them. Take a look around this fictional archive and imagine what you might keep in yours.</p><Link className="button primary" href="/signup">Start your own archive</Link></div><SamplePhoto name="picnic" alt="Friends sharing an evening picnic" priority /></div>
    <SectionTitle title="Recently remembered" href="/demo/memories" /><MemoryGrid memories={sampleMemories.slice(0,3)} demo />
    <SectionTitle title="The chapters, collected" href="/demo/albums" /><Collections section="albums" />
  </>;
  return <>
    <PageHeading title={section.charAt(0).toUpperCase()+section.slice(1)} description={section === "memories" || section === "timeline" ? "Six sample moments. Search by a detail, a person or a place." : "A few chapters from this fictional life."} />
    {section === "memories" || section === "timeline" ? <>
      <Filters search={search} lookups={{places:samplePlaces,people:samplePeople,albums:sampleAlbums,tags:sampleTags}} section={`demo/${section}`} />
      <p className="sample-results" role="status">{memories.length} {memories.length === 1 ? "moment" : "moments"}</p>
      {section === "timeline" ? <div className="sample-timeline">{memories.map(m=><section key={m.id}><h2>{new Date(m.memory_date+"T12:00:00").toLocaleDateString("en",{month:"long",year:"numeric"})}</h2><MemoryGrid memories={[m]} demo /></section>)}</div> : <MemoryGrid memories={memories} demo />}
      {!memories.length && <p className="empty-state">No sample moments match. <Link className="small-link" href={`/demo/${section}`}>Clear filters</Link></p>}
    </> : <Collections section={section} />}
  </>;
}

function Collections({section}: {section:string}) {
  const items = section === "albums" ? sampleAlbums : section === "stories" ? sampleStories : samplePlaces;
  return <div className="sample-collections">{items.map((item,index)=><article className="sample-collection" key={item.id}>
    <Link href={`/demo/${section}/${item.id}`}><SamplePhoto name={section === "places" ? index === 0 ? "baking" : "journey" : index === 0 ? "dinner" : "baking"} alt={"title" in item ? item.title : item.name} />
      <h2>{"title" in item ? item.title : item.name}</h2><p>{"description" in item ? item.description : "A longer reflection on the days spent together."}</p><span className="small-link">Open {section === "stories" ? "story" : section.slice(0,-1)} →</span></Link>
  </article>)}</div>;
}
