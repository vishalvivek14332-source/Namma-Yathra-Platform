import { Destination, getDestinationById } from '../data/destinations';

export type BudgetStyle = 'economical' | 'comfortable' | 'premium';
export type TravelPace = 'relaxed' | 'balanced' | 'packed';
export type TravelMode = 'private-cab' | 'self-drive' | 'train-bus' | 'mixed';

export interface StartingLocation {
  name: string;
  displayName?: string;
  district?: string;
  lat: number;
  lng: number;
  isCurrentLocation?: boolean;
  isCustom?: boolean;
  accuracyMeters?: number;
}

export type AttractionCategory =
  | 'Heritage'
  | 'Nature'
  | 'Waterfalls'
  | 'Beaches'
  | 'Temples'
  | 'Wildlife'
  | 'Food'
  | 'Adventure'
  | 'Family';

export interface NearbyAttraction {
  id: string;
  name: string;
  kannadaName?: string;
  district?: string;
  lat: number;
  lng: number;
  distanceKm: number;
  category: AttractionCategory;
  destinationType?: 'attraction' | 'restaurant' | 'cafe' | 'bakery' | 'street_food' | 'food_market' | 'food_experience';
  cuisine?: string;
  speciality?: string;
  openingHours?: string;
  priceLevel?: string;
  address?: string;
  directionsUrl?: string;
  shortDescription: string;
  imageUrl?: string;
  objectPosition?: string;
  isVerified: boolean;
  verifiedBadge: string;
  avgEntryFeeINR?: number;
  recommendedDurationMinutes?: number;
  source: 'Curated Catalogue' | 'OpenStreetMap';
  bestTimeToVisit?: string;
  knownConstraints?: string[];
  localSpecialties?: string[];
}

export interface SelectedPlace {
  id: string;
  name: string;
  kannadaName?: string;
  district?: string;
  lat: number;
  lng: number;
  category: string;
  destinationType?: 'attraction' | 'restaurant' | 'cafe' | 'bakery' | 'street_food' | 'food_market' | 'food_experience';
  cuisine?: string;
  speciality?: string;
  openingHours?: string;
  distanceKm?: number;
  imageUrl?: string;
  objectPosition?: string;
  isVerified: boolean;
  avgEntryFeeINR?: number;
  recommendedDurationMinutes?: number;
  order?: number;
  source?: 'Curated Catalogue' | 'OpenStreetMap';
  shortDescription?: string;
  localSpecialties?: string[];
}

export interface UnscheduledDestination {
  id?: string;
  name: string;
  reason: string;
}

export interface TripPlannerInput {
  origin: string;
  destinationPreference: string; // 'All Karnataka' or specific region/interest
  durationDays: number; // 1 to 10
  startDate: string;
  travellersCount: number; // 1 to 20
  totalBudgetINR: number; // in INR
  budgetStyle: BudgetStyle;
  interests: Array<Destination['categories'][number]>;
  travelPace: TravelPace;
  travelMode: TravelMode;
  dietaryPreferences: string; // 'Vegetarian', 'Vegan', 'Jain', 'No restrictions'
  accessibilityNotes?: string;
  selectedPlaces?: SelectedPlace[];
  startingLocation?: StartingLocation;
}

export interface ItineraryStop {
  id: string; // unique client stop id
  destinationId: string;
  destination?: Destination;
  customAttraction?: SelectedPlace;
  arrivalTime: string;
  durationMinutes: number;
  reason: string;
  estimatedCostINR: number; // activity / entry fee
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  dateStr?: string;
  stops: ItineraryStop[];
  travelNotes: string[];
}

export interface BudgetConfig {
  transportINR: number; // Group total
  accommodationINR: number; // Group total for entire trip
  foodINR: number; // Group total for entire trip
  activitiesINR: number; // Group total (sum of stops or override)
  miscellaneousINR: number; // Group total
}

export interface CalculatedBudget {
  transportINR: number;
  accommodationINR: number;
  foodINR: number;
  activitiesINR: number;
  miscellaneousINR: number;
  totalEstimatedINR: number;
  costPerPersonINR: number;
  targetBudgetINR: number;
  differenceINR: number; // target - total (positive = under budget, negative = overrun)
  isOverrun: boolean;
  overrunPercentage: number;
  assumptions: string[];
}

export interface TripItinerary {
  tripTitle: string;
  overview: string;
  origin: string;
  startDate: string;
  durationDays: number;
  travellersCount: number;
  budgetStyle: BudgetStyle;
  travelPace: TravelPace;
  days: ItineraryDay[];
  budget: BudgetConfig;
  calculatedBudget: CalculatedBudget;
  cautions: string[];
  assumptions: string[];
  generatedAt: string;
  startingLocation?: StartingLocation;
  selectedPlaces?: SelectedPlace[];
  unscheduledDestinations?: UnscheduledDestination[];
}

/**
 * Deterministic budget recalculator:
 * Enforces real arithmetic, stops sum, room formulas, and prevents double-counting.
 */
export function calculateTripBudget(
  budgetConfig: BudgetConfig,
  travellersCount: number,
  durationDays: number,
  budgetStyle: BudgetStyle,
  days: ItineraryDay[],
  targetBudgetINR: number
): CalculatedBudget {
  const safeTravellers = Math.max(1, travellersCount);
  const safeDays = Math.max(1, durationDays);

  // 1. Activities: Sum of estimated cost of all stops in all days
  let activitiesSum = 0;
  for (const day of days) {
    for (const stop of day.stops) {
      // Entry fee * travellers if applicable or given per-stop cost
      const dest = getDestinationById(stop.destinationId);
      const baseCost = stop.estimatedCostINR > 0
        ? stop.estimatedCostINR
        : (dest?.avgEntryFeeINR || stop.customAttraction?.avgEntryFeeINR || 0) * safeTravellers;
      activitiesSum += baseCost;
    }
  }

  // Use the larger of configured activity budget or actual stops sum
  const finalActivities = Math.max(budgetConfig.activitiesINR, activitiesSum);

  const transport = Math.max(0, budgetConfig.transportINR);
  const accommodation = Math.max(0, budgetConfig.accommodationINR);
  const food = Math.max(0, budgetConfig.foodINR);
  const misc = Math.max(0, budgetConfig.miscellaneousINR);

  const totalEstimatedINR = transport + accommodation + food + finalActivities + misc;
  const costPerPersonINR = Math.round(totalEstimatedINR / safeTravellers);
  const differenceINR = targetBudgetINR - totalEstimatedINR;
  const isOverrun = totalEstimatedINR > targetBudgetINR;
  const overrunPercentage = targetBudgetINR > 0
    ? Math.round((Math.abs(differenceINR) / targetBudgetINR) * 100)
    : 0;

  // Rooms calculation assumption (2 people per hotel room, ceiling)
  const roomsNeeded = Math.ceil(safeTravellers / 2);
  const nights = Math.max(1, safeDays - 1);

  const assumptions: string[] = [
    `Accommodation estimated for ${roomsNeeded} room(s) across ${nights} night(s) at ${budgetStyle} hospitality rates.`,
    `Food estimated for ${safeTravellers} person(s) across ${safeDays} full day(s) (approx. ₹${Math.round(food / (safeTravellers * safeDays))} per person/day).`,
    `Transport budgeted as a group total based on travel style and Karnataka regional distances.`,
    `Activity fees account for entry tickets across ${days.reduce((acc, d) => acc + d.stops.length, 0)} scheduled sightseeing stops.`
  ];

  return {
    transportINR: transport,
    accommodationINR: accommodation,
    foodINR: food,
    activitiesINR: finalActivities,
    miscellaneousINR: misc,
    totalEstimatedINR,
    costPerPersonINR,
    targetBudgetINR,
    differenceINR,
    isOverrun,
    overrunPercentage,
    assumptions
  };
}

/**
 * Format INR currency with Indian numbering system (e.g. ₹1,25,000)
 */
export function formatINR(amount: number): string {
  const rounded = Math.round(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(rounded);
}

export interface SavedTrip extends TripItinerary {
  id: string;
  _id?: string;
  destinations: string[];
  totalBudgetINR?: number;
  userNotes?: string;
  createdAt: string;
  updatedAt: string;
}
