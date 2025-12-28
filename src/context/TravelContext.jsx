import React, { createContext, useContext, useState, useEffect } from 'react';
import initialTravelData from '../data/travelData.json';
import { IS_EDIT_MODE } from '../config';

const TravelContext = createContext();

export const useTravel = () => useContext(TravelContext);

export const TravelProvider = ({ children }) => {
    // visitedPlaces structure:
    // [ { id: DATE_NOW, lat: 0, lng: 0, cityName: "London", countryName: "United Kingdom", logs: [] } ]
    const [visitedPlaces, setVisitedPlaces] = useState(() => {
        // If we have data in the JSON file, ALWAYS prefer it over localStorage to ensure consistency across browsers
        if (initialTravelData.visitedPlaces && initialTravelData.visitedPlaces.length > 0) {
            return initialTravelData.visitedPlaces;
        }
        // Fallback to localStorage only if JSON is empty (first run or clean slate)
        const saved = localStorage.getItem('travel_blog_places');
        if (saved) return JSON.parse(saved);
        return [];
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalPrefilledCountry, setModalPrefilledCountry] = useState(null);

    const openModal = (country = null) => {
        setModalPrefilledCountry(country);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalPrefilledCountry(null);
    };

    // calendarMarkers structure:
    // [ { id: TIMESTAMP, date: "YYYY-MM-DD", icon: "🌞" } ]
    const [calendarMarkers, setCalendarMarkers] = useState(() => {
        if (initialTravelData.calendarMarkers && initialTravelData.calendarMarkers.length > 0) {
            return initialTravelData.calendarMarkers;
        }
        const saved = localStorage.getItem('travel_blog_markers');
        if (saved) return JSON.parse(saved);
        return [];
    });

    // futurePlans structure:
    // [ { id: TIMESTAMP, name: "Tokyo", lat: 35.6762, lng: 139.6503 } ]
    const [futurePlans, setFuturePlans] = useState(() => {
        if (initialTravelData.futurePlans && initialTravelData.futurePlans.length > 0) {
            return initialTravelData.futurePlans;
        }
        const saved = localStorage.getItem('travel_blog_future_plans');
        if (saved) return JSON.parse(saved);
        return [];
    });

    // calendarNotes structure:
    // [ { date: "YYYY-MM-DD", note: "Feeling great!" } ]
    const [calendarNotes, setCalendarNotes] = useState(() => {
        if (initialTravelData.calendarNotes && initialTravelData.calendarNotes.length > 0) {
            return initialTravelData.calendarNotes;
        }
        const saved = localStorage.getItem('travel_blog_calendar_notes');
        if (saved) return JSON.parse(saved);
        return [];
    });

    // Save to disk function
    const saveToDisk = async () => {
        if (!IS_EDIT_MODE) return;
        
        try {
            const data = {
                visitedPlaces,
                futurePlans,
                calendarMarkers,
                calendarNotes
            };
            
            const response = await fetch('/__api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: 'travel', data })
            });
            
            if (response.ok) {
                alert('Saved successfully to src/data/travelData.json!');
            } else {
                alert('Failed to save.');
            }
        } catch (error) {
            console.error('Save failed:', error);
            alert('Error saving data.');
        }
    };

    useEffect(() => {
        localStorage.setItem('travel_blog_places', JSON.stringify(visitedPlaces));
    }, [visitedPlaces]);

    useEffect(() => {
        localStorage.setItem('travel_blog_markers', JSON.stringify(calendarMarkers));
    }, [calendarMarkers]);

    useEffect(() => {
        localStorage.setItem('travel_blog_future_plans', JSON.stringify(futurePlans));
    }, [futurePlans]);

    useEffect(() => {
        localStorage.setItem('travel_blog_calendar_notes', JSON.stringify(calendarNotes));
    }, [calendarNotes]);

    const addPlace = (place) => {
        // Initialize with empty article content if not present
        setVisitedPlaces(prev => [...prev, { 
            ...place, 
            id: Date.now(), 
            logs: place.logs || [], // Keep for backward compatibility or migration
            article: place.article || {
                title: place.cityName + " Trip",
                content: "Write your travel story here...",
                coverImage: place.coverImage || "",
                media: []
            }
        }]);
    };

    const updatePlaceArticle = (placeId, articleData) => {
        setVisitedPlaces(prev => prev.map(place => {
            if (place.id === placeId) {
                return { 
                    ...place, 
                    article: { ...place.article, ...articleData } 
                };
            }
            return place;
        }));
    };

    const addLogToPlace = (placeId, log) => {
        setVisitedPlaces(prev => prev.map(place => {
            if (place.id === placeId) {
                return { ...place, logs: [...place.logs, log] };
            }
            return place;
        }));
    };

    const removePlace = (placeId) => {
        setVisitedPlaces(prev => prev.filter(p => p.id !== placeId));
    };

    const removeLog = (placeId, logId) => {
        setVisitedPlaces(prev => prev.map(place => {
            if (place.id === placeId) {
                return { ...place, logs: place.logs.filter(log => log.id !== logId) };
            }
            return place;
        }));
    };

    const toggleMarker = (date, icon) => {
        setCalendarMarkers(prev => {
            const exists = prev.find(m => m.date === date && m.icon === icon);
            if (exists) {
                return prev.filter(m => m.id !== exists.id);
            }
            return [...prev, { id: Date.now(), date, icon }];
        });
    };

    const addFuturePlan = (plan) => {
        setFuturePlans(prev => [...prev, { ...plan, id: Date.now() }]);
    };

    const removeFuturePlan = (id) => {
        setFuturePlans(prev => prev.filter(p => p.id !== id));
    };

    const setCalendarNote = (date, note) => {
        setCalendarNotes(prev => {
            const filtered = prev.filter(n => n.date !== date);
            if (!note.trim()) return filtered;
            return [...filtered, { date, note }];
        });
    };

    return (
        <TravelContext.Provider value={{ 
            visitedPlaces, 
            addPlace, 
            updatePlaceArticle,
            addLogToPlace, 
            removePlace, 
            removeLog, 
            calendarMarkers, 
            toggleMarker,
            isModalOpen,
            openModal,
            closeModal,
            modalPrefilledCountry,
            futurePlans,
            addFuturePlan,
            removeFuturePlan,
            calendarNotes,
            setCalendarNote,
            saveToDisk // Export this function
        }}>
            {children}
        </TravelContext.Provider>
    );
};
