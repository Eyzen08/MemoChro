/* Two pre-optimized local sizes avoid processing public samples at request time. */
/* eslint-disable @next/next/no-img-element */
export function SamplePhoto({ name, alt, priority = false }: {name: string; alt: string; priority?: boolean}) {
  return <img src={`/samples/${name}-1280.webp`} srcSet={`/samples/${name}-640.webp ${name === "journey" ? 320 : 640}w, /samples/${name}-1280.webp ${name === "journey" ? 640 : 1280}w`}
    sizes="(max-width: 767px) 90vw, (max-width: 1199px) 45vw, 400px"
    width={name === "journey" ? 640 : 1280} height={name === "journey" ? 960 : name === "beach" ? 721 : 854}
    alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} />;
}
