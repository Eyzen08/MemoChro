import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleMemories, sampleAlbums, sampleStories, samplePlaces, samplePeople, sampleLinks, filterSampleMemories } from "../src/lib/sample-archive.ts";

test("sample relationships and filters operate only on the local archive", () => {
  assert.deepEqual([sampleMemories.length,sampleAlbums.length,sampleStories.length,samplePlaces.length,samplePeople.length],[6,2,1,2,3]);
  const original = sampleMemories.map(m=>m.id);
  assert.equal(filterSampleMemories({q:"Sunday"})[0]?.id,"sunday-table");
  assert.equal(filterSampleMemories({q:"Maya"}).length,3);
  assert.equal(filterSampleMemories({place:"at-home"}).length,3);
  assert.equal(filterSampleMemories({album:"together"}).length,3);
  assert.equal(filterSampleMemories({person:"june",tag:"family"}).length,2);
  assert.equal(filterSampleMemories({type:"written"}).length,0);
  assert.equal(filterSampleMemories({favorites:"true"}).length,3);
  assert.equal(filterSampleMemories({from:"2026-09-01",to:"2026-09-30"}).length,2);
  assert.equal(filterSampleMemories({order:"oldest"})[0]?.id,"beyond-the-bend");
  assert.deepEqual(sampleMemories.map(m=>m.id),original);
  for (const memory of sampleMemories) {
    const links=sampleLinks(memory.id);
    assert.ok(links.people.every(id=>samplePeople.some(p=>p.id===id)));
    assert.ok(links.albums.every(id=>sampleAlbums.some(a=>a.id===id)));
  }
});
