import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Compass,
  Calendar,
  MapPin,
  Users,
  Wallet,
  Clock,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  Search,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Database,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { SavedTrip, formatINR } from '../types/itinerary';
import {
  getSavedTrips,
  deleteTripFromDatabase,
  updateTripInDatabase,
  fetchDatabaseStatus,
  DatabaseStatus
} from '../services/tripStorageService';

interface SavedTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTrip: (trip: SavedTrip) => void;
  activeTripId?: string | null;
  onSavedTripsCountChange?: (count: number) => void;
  currentUser?: { id: string; fullName: string; email: string } | null;
  onRequestLogin?: () => void;
}

export const SavedTripsModal: React.FC<SavedTripsModalProps> = ({
  isOpen,
  onClose,
  onLoadTrip,
  activeTripId,
  onSavedTripsCountChange,
  currentUser,
  onRequestLogin
}) => {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Editing state
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Load trips and status when opened
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async (query?: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const [status, tripsRes] = await Promise.all([
        fetchDatabaseStatus(),
        getSavedTrips(query !== undefined ? query : searchQuery)
      ]);

      setDbStatus(status);

      if (!tripsRes.success) {
        if (!tripsRes.unauthenticated && currentUser) {
          setErrorMsg(tripsRes.error || 'Failed to retrieve trips');
        }
        setTrips([]);
      } else {
        setTrips(tripsRes.trips);
        if (onSavedTripsCountChange) {
          onSavedTripsCountChange(tripsRes.trips.length);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with database');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(searchQuery);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteTripFromDatabase(id);
      if (res.success) {
        const remaining = trips.filter(t => t.id !== id);
        setTrips(remaining);
        if (onSavedTripsCountChange) {
          onSavedTripsCountChange(remaining.length);
        }
        setConfirmDeleteId(null);
      } else {
        alert(res.error || 'Failed to delete trip');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete trip');
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (trip: SavedTrip) => {
    setEditingTripId(trip.id);
    setEditTitle(trip.tripTitle);
    setEditNotes(trip.userNotes || '');
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    setIsUpdating(true);
    try {
      const res = await updateTripInDatabase(id, {
        tripTitle: editTitle.trim(),
        userNotes: editNotes.trim()
      });
      if (res.success && res.trip) {
        setTrips(trips.map(t => (t.id === id ? res.trip! : t)));
        setEditingTripId(null);
      } else {
        alert(res.error || 'Failed to update trip');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update trip');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#102D23]/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-[#FFFEFA] rounded-2xl border border-[#D5CEBF] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-[#F7F4EC] via-[#FFFEFA] to-[#F7F4EC] border-b border-[#E5DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#173D2E] flex items-center justify-center text-[#D8A735]">
                  <Database className="w-4 h-4" />
                </div>
                <h2 className="text-2xl font-bold font-editorial text-[#102D23] tracking-tight">
                  Saved Itineraries
                </h2>
              </div>
              <p className="text-xs text-[#77786F]">
                {currentUser ? (
                  <>Personal Karnataka trips saved for <strong className="text-[#102D23]">{currentUser.fullName}</strong> ({currentUser.email})</>
                ) : (
                  'Personal Karnataka trips stored securely in your Namma Yatra account'
                )}
              </p>
            </div>

            {/* DB Status & Controls */}
            <div className="flex items-center gap-3">
              {/* Atlas Status Pill */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  dbStatus?.connected
                    ? 'bg-[#173D2E]/10 border-[#173D2E]/30 text-[#173D2E]'
                    : 'bg-[#B9684B]/10 border-[#B9684B]/30 text-[#B9684B]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    dbStatus?.connected ? 'bg-[#173D2E] animate-pulse' : 'bg-[#B9684B]'
                  }`}
                />
                <span>
                  {dbStatus?.connecting
                    ? 'Connecting to Atlas...'
                    : dbStatus?.connected
                    ? `Atlas: Connected (${dbStatus.database || 'YatraAI'})`
                    : dbStatus?.reason === 'auth_failed'
                    ? 'Atlas: Auth Failed'
                    : dbStatus?.reason === 'network_timeout'
                    ? 'Atlas: IP Blocked / Timeout'
                    : dbStatus?.reason === 'dns_failed'
                    ? 'Atlas: DNS Failed'
                    : 'Atlas: Standby Mode'}
                </span>
              </div>

              {/* Refresh button */}
              <button
                type="button"
                onClick={() => loadData()}
                disabled={isLoading}
                title="Refresh saved trips"
                className="p-2 rounded-lg border border-[#D5CEBF] bg-[#FFFEFA] hover:bg-[#F7F4EC] text-[#555850] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg border border-[#D5CEBF] bg-[#FFFEFA] hover:bg-[#F7F4EC] text-[#555850] hover:text-[#102D23] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-6 sm:px-8 py-3 bg-[#F7F4EC]/60 border-b border-[#E5DFD3]">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-[#77786F]" />
              <input
                type="text"
                placeholder="Search saved trips by title, origin city, or destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-20 py-2 text-xs bg-[#FFFEFA] border border-[#D5CEBF] rounded-lg focus:outline-none focus:border-[#173D2E] focus:ring-1 focus:ring-[#173D2E] placeholder-[#999990]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    loadData('');
                  }}
                  className="absolute right-12 text-xs text-[#77786F] hover:text-[#102D23]"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 px-2.5 py-1 text-[11px] font-semibold bg-[#173D2E] text-[#FFFEFA] rounded hover:bg-[#102D23] transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Main Body */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
            {/* Error Banner */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold">Notice from Database Service</div>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Standby Alert or Connection Diagnosis if Atlas URI missing or failing */}
            {!dbStatus?.connected && !isLoading && (
              <div className="p-4 rounded-xl bg-[#F7F4EC] border border-[#D5CEBF] text-xs text-[#555850] space-y-2">
                <div className="font-semibold text-[#102D23] flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#D8A735]" />
                  <span>
                    {dbStatus?.reason === 'auth_failed'
                      ? 'MongoDB Atlas Authentication Failed'
                      : dbStatus?.reason === 'network_timeout'
                      ? 'MongoDB Atlas Network Access / Timeout'
                      : dbStatus?.reason === 'dns_failed'
                      ? 'MongoDB Atlas Hostname Resolution Failed'
                      : 'MongoDB Atlas Connection Required for Persistent Storage'}
                  </span>
                </div>
                <p>
                  {dbStatus?.error
                    ? dbStatus.error
                    : (
                      <>
                        To save and synchronize your Karnataka trips across sessions, add your MongoDB Atlas connection string to the server environment variable <code className="px-1.5 py-0.5 bg-[#FFFEFA] border border-[#D5CEBF] rounded text-[#173D2E] font-mono">MONGODB_URI</code> in <code className="px-1.5 py-0.5 bg-[#FFFEFA] border border-[#D5CEBF] rounded text-[#173D2E] font-mono">.env</code>.
                      </>
                    )}
                </p>
              </div>
            )}

            {/* Loading Skeletons */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="p-5 rounded-xl border border-[#E5DFD3] bg-[#F7F4EC]/40 animate-pulse space-y-3"
                  >
                    <div className="h-5 bg-[#E5DFD3] rounded w-2/3" />
                    <div className="h-3 bg-[#E5DFD3] rounded w-1/2" />
                    <div className="h-4 bg-[#E5DFD3] rounded w-1/4" />
                  </div>
                ))}
              </div>
            )}

            {/* Unauthenticated State */}
            {!currentUser && !isLoading && (
              <div className="text-center py-10 px-6 space-y-4 bg-gradient-to-b from-[#F7F4EC]/80 to-[#FFFEFA] rounded-2xl border border-[#D5CEBF] my-4">
                <div className="w-14 h-14 rounded-full bg-[#173D2E]/10 border border-[#173D2E]/20 mx-auto flex items-center justify-center text-[#173D2E]">
                  <Compass className="w-7 h-7 text-[#D8A735]" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-lg font-bold font-editorial text-[#102D23]">
                    Sign in to View Your Karnataka Itineraries
                  </h3>
                  <p className="text-xs text-[#77786F] leading-relaxed">
                    Personal itineraries are linked securely to your Namma Yatra account. Sign in or create a free account to view, rename, and manage your trips across devices.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRequestLogin?.();
                    }}
                    className="px-5 py-2.5 text-xs font-semibold bg-[#173D2E] text-[#FFFEFA] hover:bg-[#102D23] rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D8A735]" />
                    <span>Sign In or Sign Up</span>
                  </button>
                </div>
              </div>
            )}

            {/* Empty State when logged in */}
            {currentUser && !isLoading && trips.length === 0 && (
              <div className="text-center py-12 px-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#F7F4EC] border border-[#D5CEBF] mx-auto flex items-center justify-center text-[#B9684B]">
                  <Compass className="w-7 h-7 text-[#D8A735]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold font-editorial text-[#102D23]">
                    {searchQuery ? 'No Matching Itineraries Found' : 'No Saved Itineraries Yet'}
                  </h3>
                  <p className="text-xs text-[#77786F] max-w-md mx-auto">
                    {searchQuery
                      ? `No trips match "${searchQuery}". Try searching for another destination or clear the filter.`
                      : 'Generate your dream Karnataka itinerary using the Trip Planner and click "Save to Atlas" to store it securely.'}
                  </p>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      loadData('');
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-[#173D2E] text-[#FFFEFA] rounded-lg hover:bg-[#102D23] transition-colors"
                  >
                    View All Trips
                  </button>
                )}
              </div>
            )}

            {/* Trips List */}
            {!isLoading && trips.length > 0 && (
              <div className="space-y-4">
                {trips.map((trip) => {
                  const isActive = trip.id === activeTripId;
                  const isEditing = editingTripId === trip.id;
                  const isDeleting = deletingId === trip.id;
                  const isConfirming = confirmDeleteId === trip.id;

                  return (
                    <motion.div
                      key={trip.id}
                      layout
                      className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                        isActive
                          ? 'border-[#173D2E] bg-[#173D2E]/5 shadow-sm ring-1 ring-[#173D2E]'
                          : 'border-[#D5CEBF] bg-[#FFFEFA] hover:border-[#173D2E]/50 shadow-xs'
                      }`}
                    >
                      {/* Top Row: Title & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#E5DFD3]">
                        <div className="space-y-1.5 flex-1">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full text-base font-bold text-[#102D23] font-editorial px-3 py-1.5 bg-[#FFFEFA] border border-[#173D2E] rounded-lg focus:outline-none"
                                placeholder="Trip title..."
                              />
                              <textarea
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="Personal travel notes (optional)..."
                                rows={2}
                                className="w-full text-xs text-[#555850] p-2 bg-[#FFFEFA] border border-[#D5CEBF] rounded-lg focus:outline-none focus:border-[#173D2E]"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveEdit(trip.id)}
                                  disabled={isUpdating}
                                  className="px-3 py-1 text-xs font-semibold bg-[#173D2E] text-[#FFFEFA] rounded-md hover:bg-[#102D23] flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingTripId(null)}
                                  className="px-3 py-1 text-xs font-semibold border border-[#D5CEBF] text-[#555850] rounded-md hover:bg-[#F7F4EC] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-bold font-editorial text-[#102D23] leading-snug">
                                  {trip.tripTitle}
                                </h3>
                                {isActive && (
                                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#173D2E] text-[#D8A735] rounded-full">
                                    Active Trip
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#77786F] line-clamp-2">
                                {trip.overview}
                              </p>
                              {trip.userNotes && (
                                <p className="text-xs italic text-[#B9684B] bg-[#F7F4EC] p-2 rounded-lg border border-[#E5DFD3]">
                                  Note: {trip.userNotes}
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Action buttons */}
                        {!isEditing && (
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Edit title/notes */}
                            <button
                              type="button"
                              onClick={() => startEdit(trip)}
                              title="Edit trip title or notes"
                              className="p-2 rounded-lg border border-[#D5CEBF] bg-[#FFFEFA] hover:bg-[#F7F4EC] text-[#555850] hover:text-[#102D23] transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            {isConfirming ? (
                              <div className="flex items-center gap-1.5 p-1 bg-red-50 border border-red-200 rounded-lg">
                                <span className="text-[10px] font-semibold text-red-700 px-1">Delete?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(trip.id)}
                                  disabled={isDeleting}
                                  className="px-2 py-1 text-[10px] font-bold bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
                                >
                                  {isDeleting ? '...' : 'Yes'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 text-[10px] font-semibold bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(trip.id)}
                                title="Delete trip from MongoDB Atlas"
                                className="p-2 rounded-lg border border-[#D5CEBF] bg-[#FFFEFA] hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-[#555850] transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Load / Open Trip */}
                            <button
                              type="button"
                              onClick={() => {
                                onLoadTrip(trip);
                                onClose();
                              }}
                              className="px-3.5 py-2 text-xs font-semibold bg-[#173D2E] text-[#FFFEFA] hover:bg-[#102D23] rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>{isActive ? 'Loaded' : 'Open Trip'}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#D8A735]" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Metadata Pill Strip */}
                      <div className="pt-3 flex flex-wrap items-center gap-3 text-xs text-[#555850]">
                        {/* Origin */}
                        <div className="flex items-center gap-1 text-[#173D2E] font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-[#B9684B]" />
                          <span>From {trip.origin}</span>
                        </div>

                        <span className="text-[#D5CEBF]">•</span>

                        {/* Duration */}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#77786F]" />
                          <span>{trip.durationDays} Days</span>
                        </div>

                        <span className="text-[#D5CEBF]">•</span>

                        {/* Travellers */}
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#77786F]" />
                          <span>{trip.travellersCount} People</span>
                        </div>

                        <span className="text-[#D5CEBF]">•</span>

                        {/* Budget */}
                        <div className="flex items-center gap-1 font-semibold text-[#102D23]">
                          <Wallet className="w-3.5 h-3.5 text-[#D8A735]" />
                          <span>
                            {formatINR(
                              trip.calculatedBudget?.totalEstimatedINR || trip.totalBudgetINR || 0
                            )}
                          </span>
                        </div>

                        <span className="text-[#D5CEBF]">•</span>

                        {/* Saved Date */}
                        <div className="flex items-center gap-1 text-[11px] text-[#77786F] ml-auto">
                          <Clock className="w-3 h-3" />
                          <span>Updated {formatDate(trip.updatedAt || trip.createdAt)}</span>
                        </div>
                      </div>

                      {/* Destination Badges */}
                      {trip.destinations && trip.destinations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#F7F4EC] flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] uppercase font-semibold text-[#77786F] mr-1">
                            Stops:
                          </span>
                          {trip.destinations.slice(0, 6).map((destId) => (
                            <span
                              key={destId}
                              className="px-2 py-0.5 text-[11px] font-medium bg-[#F7F4EC] text-[#102D23] rounded-md border border-[#E5DFD3]"
                            >
                              {destId.replace(/-/g, ' ')}
                            </span>
                          ))}
                          {trip.destinations.length > 6 && (
                            <span className="text-[10px] text-[#77786F] font-semibold">
                              +{trip.destinations.length - 6} more
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 bg-[#F7F4EC] border-t border-[#E5DFD3] flex items-center justify-between text-xs text-[#77786F]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#102D23]">{trips.length}</span>
              <span>itineraries saved in database</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-xs text-[#555850] hover:text-[#102D23] rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
