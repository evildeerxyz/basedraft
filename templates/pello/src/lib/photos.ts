/*
 * Where the photos are, in public/photos: Fieldwork's people by id, customers and pello's own
 * team by name, and a few scenes. Each one is printed by the dither in components/site/dither.tsx.
 * Credits are in public/photos/CREDITS.txt.
 */

const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, "-");

export const personPhoto = (id: string) => `/photos/people/${id}.jpg`;
export const customerPhoto = (name: string) => `/photos/customers/${slug(name)}.jpg`;
export const teamPhoto = (name: string) => `/photos/team/${slug(name)}.jpg`;

export const SCENES = {
  laughing: "/photos/scenes/laughing-at-laptop.jpg",
  office: "/photos/scenes/office-floor.jpg",
  allHands: "/photos/scenes/all-hands.jpg",
  meeting: "/photos/scenes/meeting-room.jpg",
  hands: "/photos/scenes/hands-on-laptop.jpg",
  desk: "/photos/scenes/desk-by-window.jpg",
  laptops: "/photos/scenes/team-at-laptops.jpg",
  planning: "/photos/scenes/planning-wall.jpg",
} as const;
