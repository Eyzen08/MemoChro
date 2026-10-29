import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import { requireUser, check } from "@/lib/supabase";
import { PageHeading, Empty, Pagination } from "@/components/archive";
import { PAGE_SIZE, pageNumber } from "@/lib/data";
import type { Search } from "@/lib/types";
export default async function People({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const page = pageNumber(search.page);
  const { db } = await requireUser();
  let query = db.from("people").select("*", { count: "exact" }).order("name");
  if (search.q) query = query.ilike("name", `%${search.q.slice(0, 200)}%`);
  const { data, error, count } = await query.range(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE - 1,
  );
  check(error);
  return (
    <>
      <PageHeading
        title="The people in your story."
        description="Names, connections, and the moments you share."
        action={{ href: "/settings/people/new", label: "Add a person" }}
      />
      <form className="collection-search">
        <input
          type="search"
          name="q"
          aria-label="Search people"
          placeholder="Find someone…"
          defaultValue={search.q}
          maxLength={200}
        />
        <button className="button secondary">Search</button>
      </form>
      {data?.length ? (
        <div className="people-list">
          {data.map((p) => (
            <div className="list-row" key={p.id}>
              <Users size={22} />
              <div>
                <h2>{p.name}</h2>
                <p>{p.relationship || p.note}</p>
              </div>
              <Link className="small-link" href={`/memories?person=${p.id}`}>
                Memories
                <ArrowUpRight size={14} />
              </Link>
              <Link className="small-link" href={`/settings/people/${p.id}`}>
                Edit
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <Empty kind="people" filtered={!!search.q} />
      )}
      <Pagination
        page={page}
        count={count || 0}
        search={search}
        path="/settings/people"
      />
    </>
  );
}
