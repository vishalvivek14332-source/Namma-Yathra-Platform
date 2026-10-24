import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EditorialHero } from './components/EditorialHero';
import { CuratedExperiences } from './components/CuratedExperiences';
import { TripPlannerForm } from './components/TripPlannerForm';
import { EditorialFooter } from './components/EditorialFooter';
import { InteractiveMap } from './components/InteractiveMap';
import { ItineraryWorkspace } from './components/ItineraryWorkspace';
import { BudgetBreakdown } from './components/BudgetBreakdown';
import { CuratedShowcase } from './components/CuratedShowcase';
import { ExportModal } from './components/ExportModal';
import { SavedTripsModal } from './components/SavedTripsModal';
import { AuthModal } from './components/AuthModal';
import { SelectedPlacesPanel } from './components/SelectedPlacesPanel';
import {
  TripPlannerInput,
  TripItinerary,
  SavedTrip,
  BudgetConfig,
  calculateTripBudget,
  StartingLocation,
  SelectedPlace,
  NearbyAttraction
} from './types/itinerary';
import {
  saveTripToDatabase,
  updateTripInDatabase,
  getSavedTrips
} from './services/tripStorageService';
import { getCurrentUser, logoutUser, AuthUser } from './services/authService';
import { getDestinationById, KARNATAKA_DESTINATIONS, Destination } from './data/destinations';
import {
  Compass,
  MapPin,
  Calendar,
  Share2,
  RefreshCw,
  PlusCircle,
  Sparkles,
  AlertCircle,
  ChevronRight,
  BookOpen,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Search,
  Award,
  FolderOpen,
  Database,
  Save,
  Check,
  User,
  LogOut,
  ChevronDown,
  Navigation
} from 'lucide-react';

const STORAGE_KEY = 'namma_yatra_active_itinerary_v1';
const LEGACY_STORAGE_KEY = 'yatraai_active_itinerary_v2';
const START_LOC_KEY = 'namma_yatra_start_location_v1';
const SELECTED_PLACES_KEY = 'namma_yatra_selected_places_v1';

function hydrateStop(stop: any): any {
  const curated = getDestinationById(stop.destinationId);
  if (curated) {
    return {
      ...stop,
      destination: curated
    };
  }
  if (stop.destination && stop.destination.name) {
    return {
      ...stop,
      destination: stop.destination
    };
  }
  if (stop.customAttraction) {
    return {
      ...stop,
      destination: {
        id: stop.customAttraction.id || stop.destinationId,
        name: stop.customAttraction.name,
        kannadaName: stop.customAttraction.kannadaName,
        district: stop.customAttraction.district || 'Karnataka',
        region: 'Central & Heritage',
        lat: stop.customAttraction.lat || 14.5,
        lng: stop.customAttraction.lng || 75.7,
        categories: [stop.customAttraction.category || 'Heritage'],
        shortDescription: stop.customAttraction.shortDescription || stop.reason || 'Custom Karnataka destination stop',
        recommendedDurationMinutes: stop.customAttraction.recommendedDurationMinutes || stop.durationMinutes || 60,
        avgEntryFeeINR: stop.customAttraction.avgEntryFeeINR || stop.estimatedCostINR || 0,
        bestTimeToVisit: 'Daytime',
        accentColor: '#173D2E',
        imageUrl: stop.customAttraction.imageUrl || getItineraryCategoryFallback(stop.customAttraction.category, stop.reason)
      }
    };
  }
  return {
    ...stop,
    destination: {
      id: stop.destinationId || 'custom-destination',
      name: stop.reason || 'Karnataka Destination Stop',
      district: 'Karnataka',
      region: 'Central & Heritage',
      lat: 14.5,
      lng: 75.7,
      categories: ['Heritage'],
      shortDescription: stop.reason || 'Point of interest in Karnataka itinerary.',
      recommendedDurationMinutes: stop.durationMinutes || 60,
      avgEntryFeeINR: stop.estimatedCostINR || 0,
      bestTimeToVisit: 'Daytime',
      accentColor: '#173D2E',
      imageUrl: getItineraryCategoryFallback(stop.destinationId, stop.reason)
    }
  };
}

function getItineraryCategoryFallback(category?: string, reason?: string): string {
  const text = `${category || ''} ${reason || ''}`.toLowerCase();
  if (text.includes('food') || text.includes('dosa') || text.includes('coffee') || text.includes('breakfast') || text.includes('lunch') || text.includes('dinner') || text.includes('culinary')) {
    return '/images/food_bengaluru_darshini.jpg';
  }
  if (text.includes('beach') || text.includes('coast') || text.includes('sea') || text.includes('island')) {
    return '/images/gokarna.jpg';
  }
  if (text.includes('nature') || text.includes('hill') || text.includes('ghat') || text.includes('forest') || text.includes('waterfall') || text.includes('peak')) {
    return '/images/coorg.jpg';
  }
  if (text.includes('temple') || text.includes('spiritual') || text.includes('shrine')) {
    return '/images/chamundeshwari_temple.jpg';
  }
  return '/images/hampi.jpg';
}

export default function App() {
  const [itinerary, setItinerary] = useState<TripItinerary | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<'home' | 'planner' | 'atlas' | 'itinerary'>('home');
  const [activeFormPreset, setActiveFormPreset] = useState<Partial<TripPlannerInput> | undefined>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showSavedModal, setShowSavedModal] = useState<boolean>(false);
  const [savedTripsCount, setSavedTripsCount] = useState<number>(0);
  const [activeSavedTripId, setActiveSavedTripId] = useState<string | null>(null);
  const [isSavingTrip, setIsSavingTrip] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Location-based discovery & selection state (persisted across sessions and auth)
  const [startingLocation, setStartingLocation] = useState<StartingLocation | null>(() => {
    try {
      const saved = localStorage.getItem(START_LOC_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name && parsed.name !== 'All Karnataka') {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });

  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlace[]>(() => {
    try {
      const saved = localStorage.getItem(SELECTED_PLACES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      if (localStorage.getItem('namma_yatra_logged_out') === 'true') {
        return null;
      }
      const cached = localStorage.getItem('namma_yatra_auth_user');
      return cached ? JSON.parse(cached) : { id: 'usr-vishal-1', fullName: 'Vishal', email: 'vishal@nammayatra.ai' };
    } catch {
      return null;
    }
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [pendingSaveAfterAuth, setPendingSaveAfterAuth] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [formResetKey, setFormResetKey] = useState<number>(0);

  // Persist discovery state in localStorage for guest and authenticated persistence
  useEffect(() => {
    if (startingLocation && startingLocation.name !== 'All Karnataka') {
      localStorage.setItem(START_LOC_KEY, JSON.stringify(startingLocation));
    } else {
      localStorage.removeItem(START_LOC_KEY);
    }
  }, [startingLocation]);

  useEffect(() => {
    localStorage.setItem(SELECTED_PLACES_KEY, JSON.stringify(selectedPlaces));
  }, [selectedPlaces]);

  // Restore cached trip and check user session on mount
  useEffect(() => {
    // 1. Check user authentication status via session cookie
    getCurrentUser()
      .then((res) => {
        if (res.success && res.user) {
          localStorage.removeItem('namma_yatra_logged_out');
          localStorage.setItem('namma_yatra_auth_user', JSON.stringify(res.user));
          setCurrentUser(res.user);
          // Fetch count of trips owned by this user
          getSavedTrips().then((tripsRes) => {
            if (tripsRes.success) {
              setSavedTripsCount(tripsRes.count);
            }
          });
        } else {
          if (localStorage.getItem('namma_yatra_logged_out') === 'true') {
            setCurrentUser(null);
            setSavedTripsCount(0);
          } else {
            const cached = localStorage.getItem('namma_yatra_auth_user');
            if (cached) {
              setCurrentUser(JSON.parse(cached));
            } else {
              setCurrentUser({ id: 'usr-vishal-1', fullName: 'Vishal', email: 'vishal@nammayatra.ai' });
            }
          }
        }
      })
      .catch(() => {
        if (localStorage.getItem('namma_yatra_logged_out') === 'true') {
          setCurrentUser(null);
          setSavedTripsCount(0);
        } else {
          const cached = localStorage.getItem('namma_yatra_auth_user');
          if (cached) {
            setCurrentUser(JSON.parse(cached));
          } else {
            setCurrentUser({ id: 'usr-vishal-1', fullName: 'Vishal', email: 'vishal@nammayatra.ai' });
          }
        }
      })
      .finally(() => {
        setIsAuthLoading(false);
      });

    // 2. Restore active itinerary from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const hydratedDays = parsed.days.map((d: any) => ({
          ...d,
          stops: d.stops.map((s: any) => hydrateStop(s))
        }));

        const calculated = calculateTripBudget(
          parsed.budget,
          parsed.travellersCount,
          parsed.durationDays,
          parsed.budgetStyle,
          hydratedDays,
          parsed.calculatedBudget?.targetBudgetINR || 35000
        );

        setItinerary({
          ...parsed,
          days: hydratedDays,
          calculatedBudget: calculated
        });
        if (parsed.id) {
          setActiveSavedTripId(parsed.id);
        }
      }
    } catch (err) {
      console.warn('Could not restore cached itinerary:', err);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#user-dropdown-menu') && !target.closest('#user-dropdown-trigger')) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [userDropdownOpen]);

  // Update itinerary state and browser cache
  const updateItineraryAndCache = (newItinerary: TripItinerary | null) => {
    setItinerary(newItinerary);
    if (newItinerary) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItinerary));
      } catch (e) {
        console.warn('Failed to cache itinerary:', e);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  };

  // Auth event handlers
  const handleAuthSuccess = (user: AuthUser) => {
    try {
      localStorage.removeItem('namma_yatra_logged_out');
      localStorage.setItem('namma_yatra_auth_user', JSON.stringify(user));
    } catch (e) {}

    setCurrentUser(user);
    setToastMessage(`Welcome back, ${user.fullName}!`);
    setTimeout(() => setToastMessage(null), 4000);

    // Refresh trips count for newly authenticated user
    getSavedTrips().then((res) => {
      if (res.success) {
        setSavedTripsCount(res.count);
      }
    }).catch(() => {});

    // If user clicked "Save to Atlas" before logging in, proceed with save now
    if (pendingSaveAfterAuth && itinerary) {
      setPendingSaveAfterAuth(false);
      setTimeout(() => {
        saveTripToDatabase(itinerary).then((res) => {
          if (res.success && res.trip) {
            setActiveSavedTripId(res.trip.id);
            setSavedTripsCount((prev) => prev + 1);
            setSaveSuccess(true);
            setToastMessage('Journey saved to your Namma Yatra account!');
            updateItineraryAndCache({
              ...itinerary,
              id: res.trip.id
            } as any);
            setTimeout(() => setSaveSuccess(false), 3000);
            setTimeout(() => setToastMessage(null), 4000);
          }
        }).catch((err) => {
          console.error('Auto-save after auth failed:', err);
        });
      }, 350);
    }
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    setShowSavedModal(false);
    setShowAuthModal(false);
    setShowExportModal(false);

    try {
      await logoutUser();
    } catch (err: any) {
      console.error('Logout error:', err);
    }

    // 1. Clear authenticated user session
    setCurrentUser(null);
    setSavedTripsCount(0);
    setActiveSavedTripId(null);
    setPendingSaveAfterAuth(false);

    // 2. Clear all active journey, itinerary, map selections, and custom stops from website
    setItinerary(null);
    setActiveDayIndex(0);
    setSelectedStopId(null);
    setSelectedPlaces([]);
    setStartingLocation(null);
    setActiveFormPreset(undefined);
    setErrorMsg(null);

    // 3. Remount TripPlannerForm to pristine initial state
    setFormResetKey((prev) => prev + 1);

    // 4. Purge all localStorage and sessionStorage so no residual data persists
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(START_LOC_KEY);
      localStorage.removeItem(SELECTED_PLACES_KEY);
      localStorage.removeItem('namma_yatra_auth_user');
      localStorage.setItem('namma_yatra_logged_out', 'true');
      sessionStorage.clear();
    } catch (e) {
      console.error('Storage clear error:', e);
    }

    // 5. Smoothly scroll to fresh homepage view
    setActiveNav('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setToastMessage('Signed out. All journey and profile data cleared.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Destination selection handlers
  const handleTogglePlace = (attraction: NearbyAttraction) => {
    const existingIndex = selectedPlaces.findIndex(p => p.id === attraction.id);
    if (existingIndex >= 0) {
      setSelectedPlaces(prev =>
        prev.filter(p => p.id !== attraction.id).map((p, idx) => ({ ...p, order: idx + 1 }))
      );
      setToastMessage(`Removed ${attraction.name} from journey list`);
    } else {
      const newPlace: SelectedPlace = {
        id: attraction.id,
        name: attraction.name,
        kannadaName: attraction.kannadaName,
        district: attraction.district,
        lat: attraction.lat,
        lng: attraction.lng,
        category: attraction.category,
        distanceKm: attraction.distanceKm,
        imageUrl: attraction.imageUrl,
        isVerified: attraction.isVerified,
        avgEntryFeeINR: attraction.avgEntryFeeINR,
        recommendedDurationMinutes: attraction.recommendedDurationMinutes,
        order: selectedPlaces.length + 1,
        source: attraction.source,
        shortDescription: attraction.shortDescription
      };
      setSelectedPlaces(prev => [...prev, newPlace]);
      setToastMessage(`Added ${attraction.name} to journey list`);
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRemoveSelectedPlace = (id: string) => {
    setSelectedPlaces(prev =>
      prev.filter(p => p.id !== id).map((p, idx) => ({ ...p, order: idx + 1 }))
    );
  };

  const handleMoveSelectedPlace = (id: string, direction: 'up' | 'down') => {
    setSelectedPlaces(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const cloned = [...prev];
      const [item] = cloned.splice(idx, 1);
      cloned.splice(targetIdx, 0, item);
      return cloned.map((p, i) => ({ ...p, order: i + 1 }));
    });
  };

  const handleClearAllSelectedPlaces = () => {
    setSelectedPlaces([]);
    setToastMessage('Cleared all selected places');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePlanJourneyFromSelected = () => {
    const startName = startingLocation?.displayName || startingLocation?.name || 'Bengaluru';
    setActiveFormPreset({
      origin: startName,
      startingLocation: startingLocation || undefined,
      selectedPlaces: selectedPlaces
    });
    scrollToPlanner();
    setToastMessage(`Transferring ${selectedPlaces.length} selected places to planner...`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Generate full trip itinerary via server endpoint
  const handlePlanTrip = async (input: TripPlannerInput) => {
    setIsLoading(true);
    setErrorMsg(null);

    const requestPayload = {
      ...input,
      selectedPlaces: input.selectedPlaces || selectedPlaces,
      startingLocation: input.startingLocation || startingLocation
    };

    try {
      const response = await fetch('/api/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.itinerary) {
        throw new Error(data.error || 'Failed to generate itinerary');
      }

      const raw = data.itinerary;

      // Hydrate stops with destination metadata & imagery
      const hydratedDays = raw.days.map((day: any) => ({
        ...day,
        stops: day.stops.map((stop: any) => hydrateStop(stop))
      }));

      // Deterministic Budget calculation
      const calculatedBudget = calculateTripBudget(
        raw.budget,
        input.travellersCount,
        input.durationDays,
        input.budgetStyle,
        hydratedDays,
        input.totalBudgetINR
      );

      const completeTrip: TripItinerary = {
        tripTitle: raw.tripTitle,
        overview: raw.overview,
        origin: input.origin,
        startDate: input.startDate,
        durationDays: input.durationDays,
        travellersCount: input.travellersCount,
        budgetStyle: input.budgetStyle,
        travelPace: input.travelPace,
        days: hydratedDays,
        budget: raw.budget,
        calculatedBudget,
        cautions: raw.cautions || [],
        assumptions: raw.assumptions || [],
        generatedAt: new Date().toISOString(),
        selectedPlaces: raw.selectedPlaces || requestPayload.selectedPlaces,
        startingLocation: raw.startingLocation || requestPayload.startingLocation,
        unscheduledDestinations: raw.unscheduledDestinations || []
      };

      updateItineraryAndCache(completeTrip);
      setActiveSavedTripId(null);
      setActiveDayIndex(0);
      setSelectedStopId(hydratedDays[0]?.stops[0]?.id || null);

      // Smoothly direct user to upper page where generated itinerary data is presented
      scrollToItineraryWorkspace();
    } catch (err: any) {
      console.error('Trip planning error:', err);
      setErrorMsg(err.message || 'Unable to connect to planning engine. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate single day
  const handleRegenerateDay = async (dayNumber: number, customPrompt?: string) => {
    if (!itinerary) return;
    setIsRegenerating(true);

    try {
      const response = await fetch('/api/regenerate-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripInput: {
            travelPace: itinerary.travelPace,
            travellersCount: itinerary.travellersCount,
            budgetStyle: itinerary.budgetStyle
          },
          currentTrip: itinerary,
          dayNumber,
          customPrompt
        })
      });

      const data = await response.json();
      if (!data.success || !data.day) {
        throw new Error(data.error || 'Failed to refresh day');
      }

      const refreshedDay = data.day;
      const hydratedStops = refreshedDay.stops.map((s: any) => hydrateStop(s));

      const updatedDays = itinerary.days.map((d) => {
        if (d.dayNumber === dayNumber) {
          return {
            ...d,
            title: refreshedDay.title || d.title,
            stops: hydratedStops,
            travelNotes: refreshedDay.travelNotes || d.travelNotes
          };
        }
        return d;
      });

      const recalculatedBudget = calculateTripBudget(
        itinerary.budget,
        itinerary.travellersCount,
        itinerary.durationDays,
        itinerary.budgetStyle,
        updatedDays,
        itinerary.calculatedBudget.targetBudgetINR
      );

      const updatedItinerary: TripItinerary = {
        ...itinerary,
        days: updatedDays,
        calculatedBudget: recalculatedBudget
      };

      updateItineraryAndCache(updatedItinerary);
    } catch (err: any) {
      console.error('Day regeneration failed:', err);
      setErrorMsg(`Day ${dayNumber} regeneration failed: ${err.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Remove stop
  const handleRemoveStop = (dayIndex: number, stopIndex: number) => {
    if (!itinerary) return;

    const newDays = [...itinerary.days];
    const targetDay = { ...newDays[dayIndex] };
    const removedStop = targetDay.stops[stopIndex];
    targetDay.stops = targetDay.stops.filter((_, idx) => idx !== stopIndex);
    newDays[dayIndex] = targetDay;

    // Recalculate deterministic budget
    const recalculatedBudget = calculateTripBudget(
      itinerary.budget,
      itinerary.travellersCount,
      itinerary.durationDays,
      itinerary.budgetStyle,
      newDays,
      itinerary.calculatedBudget.targetBudgetINR
    );

    updateItineraryAndCache({
      ...itinerary,
      days: newDays,
      calculatedBudget: recalculatedBudget
    });

    if (selectedStopId === removedStop?.id) {
      setSelectedStopId(null);
    }
  };

  // Move stop up or down
  const handleMoveStop = (dayIndex: number, stopIndex: number, direction: 'up' | 'down') => {
    if (!itinerary) return;

    const newDays = [...itinerary.days];
    const targetDay = { ...newDays[dayIndex] };
    const stops = [...targetDay.stops];

    const targetIndex = direction === 'up' ? stopIndex - 1 : stopIndex + 1;
    if (targetIndex < 0 || targetIndex >= stops.length) return;

    const [moved] = stops.splice(stopIndex, 1);
    stops.splice(targetIndex, 0, moved);

    targetDay.stops = stops;
    newDays[dayIndex] = targetDay;

    updateItineraryAndCache({
      ...itinerary,
      days: newDays
    });
  };

  // Update budget configuration (user manual tweaking)
  const handleUpdateBudgetConfig = (newConfig: BudgetConfig) => {
    if (!itinerary) return;

    const recalculated = calculateTripBudget(
      newConfig,
      itinerary.travellersCount,
      itinerary.durationDays,
      itinerary.budgetStyle,
      itinerary.days,
      itinerary.calculatedBudget.targetBudgetINR
    );

    updateItineraryAndCache({
      ...itinerary,
      budget: newConfig,
      calculatedBudget: recalculated
    });
  };

  // Preset selector
  const handleLoadQuickCircuit = (preset: Partial<TripPlannerInput>) => {
    setActiveFormPreset(preset);
    setActiveNav('planner');
    const elem = document.getElementById('planner-form');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  // Add individual destination into planner
  const handleSelectDestinationForPlan = (dest: Destination) => {
    setActiveFormPreset({
      destinationPreference: dest.name,
      interests: dest.categories,
    });
    setActiveNav('planner');
    const elem = document.getElementById('planner-form');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  // Save or update active trip in MongoDB Atlas
  const handleSaveTripToAtlas = async () => {
    if (!itinerary) return;

    // Authentication gating: Require user to be signed in
    if (!currentUser) {
      setPendingSaveAfterAuth(true);
      setAuthModalInitialMode('login');
      setShowAuthModal(true);
      setToastMessage('Please sign in or create an account to save your journey');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    setIsSavingTrip(true);
    setErrorMsg(null);

    try {
      if (activeSavedTripId) {
        // Update existing trip in database
        const res = await updateTripInDatabase(activeSavedTripId, {
          tripTitle: itinerary.tripTitle,
          overview: itinerary.overview,
          days: itinerary.days,
          budget: itinerary.budget,
          calculatedBudget: itinerary.calculatedBudget,
          cautions: itinerary.cautions,
          assumptions: itinerary.assumptions
        });

        if (res.success) {
          setSaveSuccess(true);
          setToastMessage('Trip updated in your Namma Yatra account!');
          setTimeout(() => setSaveSuccess(false), 3000);
          setTimeout(() => setToastMessage(null), 4000);
        } else {
          if (res.error?.includes('Unauthorized') || res.error?.includes('sign in')) {
            setCurrentUser(null);
            setPendingSaveAfterAuth(true);
            setAuthModalInitialMode('login');
            setShowAuthModal(true);
          }
          setErrorMsg(res.error || 'Failed to update trip in database');
        }
      } else {
        // Save new trip to database
        const res = await saveTripToDatabase(itinerary);
        if (res.success && res.trip) {
          setActiveSavedTripId(res.trip.id);
          setSavedTripsCount((prev) => prev + 1);
          setSaveSuccess(true);
          setToastMessage('Trip successfully saved to your Namma Yatra account!');
          // Update cached copy with assigned ID
          updateItineraryAndCache({
            ...itinerary,
            id: res.trip.id
          } as any);
          setTimeout(() => setSaveSuccess(false), 3000);
          setTimeout(() => setToastMessage(null), 4000);
        } else {
          if (res.unauthenticated) {
            setCurrentUser(null);
            setPendingSaveAfterAuth(true);
            setAuthModalInitialMode('login');
            setShowAuthModal(true);
          }
          setErrorMsg(res.error || 'Failed to save trip to database');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Database error');
    } finally {
      setIsSavingTrip(false);
    }
  };

  // Load a saved trip from MongoDB Atlas into the workspace
  const handleLoadSavedTrip = (saved: SavedTrip) => {
    const hydratedDays = saved.days.map((d: any) => ({
      ...d,
      stops: d.stops.map((s: any) => hydrateStop(s))
    }));

    const calculated = calculateTripBudget(
      saved.budget,
      saved.travellersCount,
      saved.durationDays,
      saved.budgetStyle,
      hydratedDays,
      saved.calculatedBudget?.targetBudgetINR || saved.totalBudgetINR || 35000
    );

    const fullTrip: TripItinerary = {
      ...saved,
      days: hydratedDays,
      calculatedBudget: calculated
    };

    updateItineraryAndCache(fullTrip);
    setActiveSavedTripId(saved.id);
    setActiveDayIndex(0);
    setSelectedStopId(hydratedDays[0]?.stops[0]?.id || null);
    setToastMessage(`Loaded: ${saved.tripTitle}`);
    setTimeout(() => setToastMessage(null), 4000);

    scrollToItineraryWorkspace();
  };

  const scrollToItineraryWorkspace = () => {
    setActiveNav('itinerary');
    const executeScroll = () => {
      const workspaceElem = document.getElementById('itinerary-workspace');
      if (workspaceElem) {
        workspaceElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }
      return false;
    };

    // Retry across animation frames and timeout microtasks to guarantee React has mounted the workspace DOM
    requestAnimationFrame(() => {
      if (!executeScroll()) {
        setTimeout(() => {
          if (!executeScroll()) {
            setTimeout(() => {
              if (!executeScroll()) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }, 120);
          }
        }, 50);
      }
    });
  };

  const handleGoToDashboard = () => {
    setActiveNav('home');
    setItinerary(null);
    setActiveSavedTripId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToPlanner = () => {
    setActiveNav('planner');
    const elem = document.getElementById('planner-form');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAtlas = () => {
    setActiveNav('atlas');
    const elem = document.getElementById('atlas-section');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearchClick = () => {
    scrollToAtlas();
    setTimeout(() => {
      const input = document.getElementById('atlas-search-input');
      if (input) {
        input.focus();
      }
    }, 350);
  };

  const activeDayStops = itinerary?.days[activeDayIndex]?.stops || [];

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#292D29] flex flex-col font-sans selection:bg-[#D8A735]/25 selection:text-[#102D23] overflow-x-clip">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#FBF8F2]/95 backdrop-blur-md border-b border-[#E5DFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 sm:gap-6">
          {/* Zone 1: Brand emblem & wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleGoToDashboard();
              }}
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-[#102D23] border border-[#D8A735] shadow-xs shrink-0 flex items-center justify-center">
                <Compass className="w-5 h-5 text-[#D8A735]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-bold font-editorial text-[#102D23] tracking-tight leading-none group-hover:text-[#173D2E] transition-colors">
                    Namma Yatra
                  </span>
                </div>
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#77786F] mt-0.5">
                  Your Karnataka · Your Journey
                </span>
              </div>
            </a>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-[#555850]">
            <button
              onClick={handleGoToDashboard}
              className={`hover:text-[#102D23] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeNav === 'home'
                  ? 'text-[#102D23] font-bold border-b-2 border-[#102D23] pb-1'
                  : 'text-[#555850] pb-1 font-medium'
              }`}
            >
              Discover
            </button>
            {itinerary && (
              <button
                onClick={scrollToItineraryWorkspace}
                className={`hover:text-[#102D23] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeNav === 'itinerary'
                    ? 'text-[#102D23] font-bold border-b-2 border-[#102D23] pb-1'
                    : 'text-[#173D2E] pb-1 font-semibold'
                }`}
              >
                Active Itinerary
              </button>
            )}
            <button
              onClick={scrollToPlanner}
              className={`hover:text-[#102D23] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeNav === 'planner'
                  ? 'text-[#102D23] font-bold border-b-2 border-[#102D23] pb-1'
                  : 'text-[#555850] pb-1 font-medium'
              }`}
            >
              Trip Planner
            </button>
            <button
              onClick={scrollToAtlas}
              className={`hover:text-[#102D23] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeNav === 'atlas'
                  ? 'text-[#102D23] font-bold border-b-2 border-[#102D23] pb-1'
                  : 'text-[#555850] pb-1 font-medium'
              }`}
            >
              Karnataka Atlas
            </button>
            <button
              onClick={() => setShowSavedModal(true)}
              className="hover:text-[#102D23] transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 pb-1 text-[#555850] font-medium"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#D8A735]" />
              <span>Saved Trips</span>
              {savedTripsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-[#102D23] text-[#D8A735] text-[10px] font-bold rounded-full">
                  {savedTripsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: Actions & User Authentication */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Search Atlas */}
            <button
              type="button"
              onClick={handleSearchClick}
              title="Search Karnataka Atlas"
              className="w-10 h-10 rounded-full border border-[#D5CEBF] bg-[#FFFEFA] hover:bg-[#EDE8DE] hover:border-[#102D23] text-[#555850] hover:text-[#102D23] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Primary Action Button */}
            {itinerary ? (
              <button
                onClick={() => setShowExportModal(true)}
                className="hidden sm:flex px-4 py-2.5 text-xs font-semibold text-[#FFFEFA] bg-[#102D23] hover:bg-[#071913] rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-[#D8A735]" />
                <span>Export</span>
              </button>
            ) : (
              <button
                onClick={scrollToPlanner}
                className="hidden sm:flex px-5 py-2.5 text-xs font-semibold text-[#FFFEFA] bg-[#102D23] hover:bg-[#071913] rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer items-center gap-2 group"
              >
                <span>Plan Journey</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D8A735] group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* User Account Controls */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="user-dropdown-trigger"
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#D5CEBF] bg-[#FFFEFA] hover:border-[#102D23] transition-all cursor-pointer shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-full bg-[#102D23] text-[#D8A735] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-[#102D23] max-w-[100px] truncate">
                    {currentUser.fullName.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#77786F]" />
                </button>

                {/* Floating User Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    id="user-dropdown-menu"
                    className="absolute right-0 mt-2 w-56 bg-[#FFFEFA] border border-[#D5CEBF] rounded-xl shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="px-4 py-2 border-b border-[#E5DFD3]">
                      <div className="font-bold text-[#102D23] truncate">{currentUser.fullName}</div>
                      <div className="text-[11px] text-[#77786F] truncate">{currentUser.email}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setShowSavedModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-[#292D29] hover:bg-[#F7F4EC] hover:text-[#173D2E] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-3.5 h-3.5 text-[#D8A735]" />
                        <span>My Saved Trips</span>
                      </div>
                      {savedTripsCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-[#173D2E] text-[#D8A735] text-[10px] font-bold rounded-full">
                          {savedTripsCount}
                        </span>
                      )}
                    </button>

                    <div className="border-t border-[#E5DFD3] my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-700 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalInitialMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-[#173D2E] hover:text-[#102D23] hover:bg-[#EDE8DE] rounded-lg transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalInitialMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#FFFEFA] bg-[#B9684B] hover:bg-[#9B4E33] rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden text-[#292D29] hover:bg-[#EDE8DE] rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FFFEFA] border-b border-[#E5DFD3] px-4 py-3 space-y-2 text-sm font-semibold">
            {currentUser && (
              <div className="p-3 bg-[#F7F4EC] rounded-xl border border-[#D5CEBF] mb-2 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#102D23] text-xs">{currentUser.fullName}</div>
                  <div className="text-[11px] text-[#77786F]">{currentUser.email}</div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="px-2.5 py-1 text-xs text-red-700 font-semibold border border-red-200 rounded-md hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleGoToDashboard();
              }}
              className="block w-full text-left py-2 text-[#555850]"
            >
              Discover Karnataka
            </button>
            {itinerary && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollToItineraryWorkspace();
                }}
                className="block w-full text-left py-2 text-[#173D2E] font-bold"
              >
                Active Itinerary
              </button>
            )}
            <button
              onClick={() => {
                scrollToPlanner();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-[#555850]"
            >
              Trip Planner
            </button>
            <button
              onClick={() => {
                scrollToAtlas();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-[#555850]"
            >
              Karnataka Atlas
            </button>
            <button
              onClick={() => {
                setShowSavedModal(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between w-full py-2 text-[#173D2E]"
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#D8A735]" />
                <span>Saved Trips</span>
              </div>
              {savedTripsCount > 0 && (
                <span className="px-2 py-0.5 bg-[#173D2E] text-[#D8A735] text-xs font-bold rounded-full">
                  {savedTripsCount}
                </span>
              )}
            </button>

            {!currentUser && (
              <div className="pt-2 border-t border-[#E5DFD3] grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalInitialMode('login');
                    setShowAuthModal(true);
                  }}
                  className="w-full py-2 text-center text-xs font-semibold text-[#173D2E] border border-[#173D2E] rounded-lg"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalInitialMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="w-full py-2 text-center text-xs font-semibold text-[#FFFEFA] bg-[#B9684B] rounded-lg"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 2. FULL-WIDTH EDITORIAL HERO (Protected, Unchanged) */}
      {!itinerary && (
        <EditorialHero
          onPlanClick={scrollToPlanner}
          onExploreClick={scrollToAtlas}
        />
      )}

      {/* 3. POST-HERO CONTINUOUS SCENIC BACKGROUND WRAPPER */}
      <div className="post-hero-scenic-wrapper relative w-full overflow-hidden">
        {/* Curated Experiences (Explore by Experience) */}
        {!itinerary && (
          <CuratedExperiences
            onExploreClick={scrollToAtlas}
            onSelectCategory={() => scrollToAtlas()}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-12 overflow-x-clip relative z-10">
        {/* Error notification banner with Retry action */}
        {errorMsg && (
          <div className="p-4 bg-[#B9684B]/10 border border-[#B9684B]/30 rounded-xl text-[#8C3B1F] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B9684B]" />
              <div>
                <span className="font-semibold">Planning Notice: </span>
                <span>{errorMsg}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  scrollToPlanner();
                }}
                className="px-3 py-1 bg-[#173D2E] text-white hover:bg-[#102D23] font-semibold rounded-lg text-xs cursor-pointer transition-colors"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-[#8C3B1F] hover:text-[#5C2310] font-semibold cursor-pointer px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* 3. IMMERSIVE DESTINATIONS & GEOGRAPHIC ATLAS */}
        {!itinerary && (
          <section id="atlas-section" className="scroll-mt-24">
            <CuratedShowcase
              onSelectQuickCircuit={handleLoadQuickCircuit}
              onSelectDestinationForPlan={handleSelectDestinationForPlan}
              startingLocation={startingLocation}
              onSelectStartingLocation={setStartingLocation}
              selectedPlaces={selectedPlaces}
              onTogglePlace={handleTogglePlace}
            />
          </section>
        )}

        {/* 4. ACTIVE ITINERARY WORKSPACE (When trip has been planned) */}
        {itinerary && (
          <section id="itinerary-workspace" className="space-y-6 scroll-mt-24">
            {/* Itinerary Control Bar */}
            <div className="bg-[#FFFEFA] p-6 rounded-2xl border border-[#D5CEBF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#77786F] mb-1">
                  <span className="font-bold text-[#173D2E]">Active Itinerary</span>
                  <span aria-hidden="true">·</span>
                  <span>Origin: <strong className="text-[#292D29]">{itinerary.origin}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>{itinerary.durationDays} Days</span>
                  <span aria-hidden="true">·</span>
                  <span>{itinerary.travellersCount} Travellers</span>
                </div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#102D23]">
                  {itinerary.tripTitle}
                </h2>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Save to Atlas Button */}
                <button
                  type="button"
                  onClick={handleSaveTripToAtlas}
                  disabled={isSavingTrip}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60 whitespace-nowrap ${
                    saveSuccess
                      ? 'bg-[#173D2E] text-[#D8A735]'
                      : activeSavedTripId
                      ? 'bg-[#FFFEFA] border border-[#173D2E] text-[#173D2E] hover:bg-[#F7F4EC]'
                      : 'bg-[#B9684B] hover:bg-[#9B4E33] text-[#FFFEFA]'
                  }`}
                >
                  {isSavingTrip ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FFFEFA]" />
                  ) : saveSuccess ? (
                    <Check className="w-3.5 h-3.5 text-[#D8A735]" />
                  ) : (
                    <Database className="w-3.5 h-3.5 text-[#D8A735]" />
                  )}
                  <span>
                    {isSavingTrip
                      ? 'Saving...'
                      : saveSuccess
                      ? 'Saved to Atlas!'
                      : activeSavedTripId
                      ? 'Update in Atlas'
                      : 'Save to Atlas'}
                  </span>
                </button>

                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-4 py-2.5 bg-[#173D2E] hover:bg-[#102D23] text-[#FFFEFA] text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#D8A735]" />
                  <span>Export / Print</span>
                </button>
                <button
                  onClick={() => {
                    updateItineraryAndCache(null);
                    setActiveSavedTripId(null);
                  }}
                  className="px-4 py-2.5 bg-[#F7F4EC] hover:bg-[#EDE8DE] text-[#292D29] border border-[#D5CEBF] text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Create New Trip
                </button>
              </div>
            </div>

            {/* Overview Narrative */}
            <div className="bg-[#FFFEFA] p-6 rounded-2xl border border-[#D5CEBF] text-xs text-[#555850] leading-relaxed shadow-xs">
              <span className="font-bold text-[#102D23] text-sm block mb-1">Curator’s Overview</span>
              <p>{itinerary.overview}</p>
            </div>

            {/* Two-Column Responsive Workspace: Schedule on Left, Map & Budget on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Itinerary Stops & Day Navigation (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <ItineraryWorkspace
                  itinerary={itinerary}
                  activeDayIndex={activeDayIndex}
                  onSelectDay={setActiveDayIndex}
                  selectedStopId={selectedStopId}
                  onSelectStop={setSelectedStopId}
                  onRemoveStop={handleRemoveStop}
                  onMoveStop={handleMoveStop}
                  onRegenerateDay={handleRegenerateDay}
                  isRegenerating={isRegenerating}
                />
              </div>

              {/* Right Column: Interactive OpenStreetMap & Budget Breakdown (5 cols) */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                {/* Map Container */}
                <InteractiveMap
                  stops={activeDayStops}
                  selectedStopId={selectedStopId}
                  onSelectStop={setSelectedStopId}
                  dayNumber={activeDayIndex + 1}
                />

                {/* Deterministic Budget Calculator */}
                <BudgetBreakdown
                  calculatedBudget={itinerary.calculatedBudget}
                  budgetConfig={itinerary.budget}
                  onUpdateBudgetConfig={handleUpdateBudgetConfig}
                  travellersCount={itinerary.travellersCount}
                  durationDays={itinerary.durationDays}
                />
              </div>
            </div>
          </section>
        )}

        {/* 5. REFERENCE ATLAS (When viewing planned itinerary) */}
        {itinerary && (
          <section id="atlas-section" className="scroll-mt-24 pt-6">
            <CuratedShowcase
              onSelectQuickCircuit={handleLoadQuickCircuit}
              onSelectDestinationForPlan={handleSelectDestinationForPlan}
              startingLocation={startingLocation}
              onSelectStartingLocation={setStartingLocation}
              selectedPlaces={selectedPlaces}
              onTogglePlace={handleTogglePlace}
            />
          </section>
        )}
      </main>

      {/* PERSISTENT SELECTED PLACES PANEL */}
      <SelectedPlacesPanel
        startingLocation={startingLocation}
        selectedPlaces={selectedPlaces}
        onRemovePlace={handleRemoveSelectedPlace}
        onMovePlace={handleMoveSelectedPlace}
        onClearAll={handleClearAllSelectedPlaces}
        onPlanJourney={handlePlanJourneyFromSelected}
      />
      {/* ============================================================ */}
      {/* END OF PAGE: TRIP PLANNER & INTEGRATED EDITORIAL FOOTER      */}
      {/* ============================================================ */}
      <section
        id="planner"
        className="relative w-full scroll-mt-12 overflow-hidden mt-8 z-10"
      >
        {/* Centered Trip Planner Form Card */}
        <div className="relative z-10 max-w-[1468px] mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14">
          <TripPlannerForm
            key={formResetKey}
            onPlanTrip={handlePlanTrip}
            isLoading={isLoading}
            initialValues={activeFormPreset}
          />
        </div>

        {/* Integrated Editorial Footer */}
        <EditorialFooter
          onNavigateHome={handleGoToDashboard}
          onNavigatePlanner={scrollToPlanner}
          onNavigateAtlas={scrollToAtlas}
          onNavigateExperiences={() => {
            const exp = document.getElementById('curated-experiences');
            if (exp) exp.scrollIntoView({ behavior: 'smooth' });
            else window.scrollTo({ top: 400, behavior: 'smooth' });
          }}
        />
      </section>
      </div> {/* End .post-hero-scenic-wrapper */}


      {/* Export Modal */}
      {itinerary && (
        <ExportModal
          itinerary={itinerary}
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Saved Trips Modal */}
      <SavedTripsModal
        isOpen={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        onLoadTrip={handleLoadSavedTrip}
        activeTripId={activeSavedTripId}
        onSavedTripsCountChange={setSavedTripsCount}
        currentUser={currentUser}
        onRequestLogin={() => {
          setAuthModalInitialMode('login');
          setShowAuthModal(true);
        }}
      />

      {/* User Authentication Modal (Sign In / Register / Forgot Password) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingSaveAfterAuth(false);
        }}
        onSuccess={handleAuthSuccess}
        initialMode={authModalInitialMode}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#173D2E] text-[#FFFEFA] px-4 py-3 rounded-xl shadow-lg border border-[#D8A735]/40 flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#D8A735]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
