/** Public places only. A plan's venue must come from this list, so no wingcat can agree to a private address. */
export interface Venue {
  id: string;
  name: string;
  area: string;
  activity: string;
  costPerPerson: number;
  tags: string[];
}

export const VENUES: Venue[] = [
  { id: 'ven_koji', name: 'Koji Ramen Bar', area: 'Downtown', activity: 'Ramen dinner', costPerPerson: 18, tags: ['ramen', 'dinner'] },
  { id: 'ven_greenbowl', name: 'Green Bowl', area: 'Downtown', activity: 'Vegetarian dinner', costPerPerson: 22, tags: ['vegetarian', 'dinner'] },
  { id: 'ven_dice', name: 'Dice and Slice', area: 'Downtown', activity: 'Board games and pizza', costPerPerson: 20, tags: ['board games', 'pizza'] },
  { id: 'ven_bluenote', name: 'Blue Note Cafe', area: 'Riverside', activity: 'Live music and coffee', costPerPerson: 15, tags: ['live music', 'coffee'] },
  { id: 'ven_catcafe', name: 'Whisker Cafe', area: 'Riverside', activity: 'Cat cafe and cake', costPerPerson: 12, tags: ['cats', 'coffee', 'cake'] },
  { id: 'ven_gallery', name: 'Riverside Gallery', area: 'Riverside', activity: 'Art gallery walk', costPerPerson: 8, tags: ['art', 'walk'] },
  { id: 'ven_rooftop', name: 'Sky Garden', area: 'Uptown', activity: 'Rooftop cocktails', costPerPerson: 35, tags: ['cocktails', 'views'] },
];
