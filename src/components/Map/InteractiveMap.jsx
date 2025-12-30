import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { divIcon } from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTravel } from '../../context/TravelContext';
import { Plus, Save } from 'lucide-react';
import { IS_EDIT_MODE } from '../../config'; // Import config

// Fix Leaflet's default icon path issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Controller for smooth map transitions
const MapController = ({ focusedBounds }) => {
    const map = useMap();

    useEffect(() => {
        if (focusedBounds) {
            map.flyToBounds(focusedBounds, {
                padding: [50, 50],
                maxZoom: 6,
                duration: 1.5, // Smooth flight
                easeLinearity: 0.25
            });
        } else {
            map.flyTo([20, 0], 2, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [focusedBounds, map]);

    return null;
};

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const InteractiveMap = ({ onCountryClick }) => {
    const navigate = useNavigate();
    const { visitedPlaces, addPlace, openModal, saveToDisk } = useTravel();
    const [geoJsonData, setGeoJsonData] = useState(null);

    // Interaction State
    const [focusedCountry, setFocusedCountry] = useState(null);
    const [focusedBounds, setFocusedBounds] = useState(null);

    // Group places by city
    const groupedPlaces = useMemo(() => {
        const groups = {};
        visitedPlaces.forEach(place => {
            // Create a unique key for the city
            const key = `${place.cityName}-${place.countryName}`;
            
            if (!groups[key]) {
                groups[key] = {
                    ...place, // Inherit coords from the first one
                    id: `group-${place.id}`, // Virtual group ID
                    stories: [place]
                };
            } else {
                groups[key].stories.push(place);
            }
        });
        
        // Sort stories within each group by date (newest first)
        Object.values(groups).forEach(group => {
            group.stories.sort((a, b) => new Date(b.date) - new Date(a.date));
        });

        return Object.values(groups);
    }, [visitedPlaces]);

    // Fetch GeoJSON for world countries
    useEffect(() => {
        // Using local optimized GeoJSON for speed
        fetch('/world.json')
            .then(res => res.json())
            .then(data => setGeoJsonData(data))
            .catch(err => console.error("Error loading GeoJSON:", err));
    }, []);

    const handleInputClick = (feature, layer) => {
        const countryName = feature.properties.name;

        // 2-Level Interaction Logic
        setFocusedCountry(countryName);
        setFocusedBounds(layer.getBounds());
        
        // Trigger external handler
        if (onCountryClick) {
            onCountryClick(countryName);
        }
    };

    // Global navigation handler for stacked stories
    useEffect(() => {
        window.navigateToStory = (id) => {
            navigate(`/post/${id}`);
        };
        return () => {
            delete window.navigateToStory;
        };
    }, [navigate]);

    // Custom "Instagram Story" Marker
    const createStoryIcon = (group) => {
        const stories = group.stories || [group];
        const count = stories.length;
        const isStacked = count > 1;
        const isFocused = group.countryName === focusedCountry;
        
        // Take top 3 stories (Newest First)
        // stories[0] is Newest (Should be TOP/FRONT/RIGHT)
        // stories[1] is Middle
        // stories[2] is Oldest (Should be BOTTOM/BACK/LEFT)
        const displayStories = stories.slice(0, 3);
        
        // In CSS:
        // nth-child(1) is BOTTOM of stack (rendered first)
        // nth-child(3) is TOP of stack (rendered last)
        
        // So we need to REVERSE the array for rendering
        // [Newest, Middle, Oldest] -> [Oldest, Middle, Newest]
        // HTML: Oldest (child 1), Middle (child 2), Newest (child 3)
        // Visual Stack: Newest on Top
        const reversedStories = [...displayStories].reverse();

        let htmlContent = '';
        
        if (isStacked) {
            const stackHtml = reversedStories.map(story => {
                // Use strict priority: article > root > log > default
                const img = story.article?.coverImage || story.coverImage || story.logs?.[0]?.image || `https://source.unsplash.com/random/100x100?${story.cityName}&sig=${story.id}`;
                return `
                    <div class="story-ring">
                        <img src="${img}" alt="${story.cityName}" />
                    </div>
                `;
            }).join('');
            
            // Limit visual stack count to 3 for CSS class
            const visualCount = Math.min(count, 3);

            htmlContent = `
                <div class="story-ring-container stacked group" data-count="${visualCount}">
                    ${stackHtml}
                    <div class="story-count-badge">${count}</div>
                    <div class="story-label ${isFocused ? 'force-visible' : ''}">${group.cityName}</div>
                </div>
            `;
        } else {
            const place = stories[0];
            const coverImage = place.article?.coverImage || place.coverImage || place.logs?.[0]?.image || `https://source.unsplash.com/random/100x100?${place.cityName}`;
            htmlContent = `
                <div class="story-ring-container group">
                    <div class="story-ring">
                        <img src="${coverImage}" alt="${place.cityName}" />
                    </div>
                    <div class="story-label ${isFocused ? 'force-visible' : ''}">${place.cityName}</div>
                </div>
            `;
        }

        return divIcon({
            className: 'custom-story-marker',
            html: htmlContent,
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
    };

    // Optimized Style: Light mode compatible (Dark borders)
    const geoJsonStyle = {
        fillColor: "transparent",
        weight: 0.5,
        opacity: 0.6,
        color: "#374151", // Dark gray borders for light map
        fillOpacity: 0
    };

    const onEachFeature = (feature, layer) => {
        layer.on({
            mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                    weight: 2,
                    color: '#0ea5e9', // Sky blue hover
                    fillOpacity: 0.1
                });
            },
            mouseout: (e) => {
                const layer = e.target;
                layer.setStyle(geoJsonStyle);
            },
            click: (e) => {
                L.DomEvent.stopPropagation(e);
                handleInputClick(feature, layer);
            }
        });
    };

    return (
        <div className="relative w-full h-screen bg-[#aad3df] overflow-hidden">
            {/* Control Buttons - Only visible when focused */}
            {focusedCountry && (
                <>
                    <motion.button
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                            setFocusedCountry(null);
                            setFocusedBounds(null);
                        }}
                        className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] px-6 py-2 bg-white/90 border border-gray-200 shadow-xl rounded-full text-gray-800 backdrop-blur-md hover:bg-white transition-colors font-medium"
                    >
                        Back to World View
                    </motion.button>
                    
                    <motion.button
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        onClick={() => openModal(focusedCountry)}
                        className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] px-6 py-2 bg-pink-600 border border-pink-500 shadow-xl rounded-full text-white hover:bg-pink-700 transition-colors font-medium flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add Trip to {focusedCountry}
                    </motion.button>
                </>
            )}

            {/* Global Save Button (Edit Mode) */}
            {IS_EDIT_MODE && (
                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={saveToDisk}
                    className="absolute top-20 left-4 z-[1000] flex items-center gap-2 bg-green-600/20 hover:bg-green-600/40 text-green-300 px-6 py-2 rounded-full cursor-pointer transition-all border border-green-500/30 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    title="Save all map data to disk"
                >
                    <Save size={18} />
                    <span className="whitespace-nowrap font-medium">Save</span>
                </motion.button>
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="w-full h-full"
            >
                <MapContainer
                    center={[20, 0]}
                    zoom={2}
                    scrollWheelZoom={true}
                    preferCanvas={true} // High Performance Mode
                    zoomControl={false}
                    className="world-map-mode"
                    style={{ height: "100%", width: "100%", background: "#aad3df" }}
                    minZoom={2.5}
                    maxZoom={10}
                    maxBounds={[[-85, -180], [85, 180]]}
                    maxBoundsViscosity={1.0}
                >
                    <MapController focusedBounds={focusedBounds} />

                    {/* Standard Light Tiles */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        className="map-tiles"
                        noWrap={true}
                        bounds={[[-85.0511, -180], [85.0511, 180]]}
                        updateWhenIdle={true} // Only load tiles when panning stops to prevent "Aborted" errors
                        keepBuffer={4} // Keep more tiles in memory to reduce reloading
                    />

                    <ZoomControl position="bottomright" />

                    {/* GeoJSON Overlay - subtle boundaries only */}
                    {geoJsonData && (
                        <GeoJSON
                            data={geoJsonData}
                            style={geoJsonStyle}
                            onEachFeature={onEachFeature}
                        />
                    )}

                    {/* Visited Places Markers (Story Style) */}
                    {groupedPlaces.map((group) => {
                        // Generate a robust key based on the images of the top stories
                        // We use JSON.stringify to capture all relevant state changes
                        const storiesState = group.stories.slice(0, 3).map(s => ({
                            id: s.id,
                            img: s.article?.coverImage || s.coverImage || s.logs?.[0]?.image || 'default'
                        }));
                        const markerKey = `${group.id}-${JSON.stringify(storiesState)}`;

                        return (
                        <Marker
                            key={markerKey}
                            position={[group.lat, group.lng]}
                            icon={createStoryIcon(group)}
                            eventHandlers={{
                                click: () => {
                                    if (group.stories.length === 1) {
                                        navigate(`/post/${group.stories[0].id}`);
                                    }
                                    // If > 1, do nothing (popup opens)
                                }
                            }}
                        >
                             {group.stories.length > 1 && (
                                <Popup className="glass-popup" closeButton={false}>
                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                        <h3 className="font-bold text-lg mb-1">{group.cityName} Stories</h3>
                                        <div className="max-h-[200px] overflow-y-auto flex flex-col gap-2">
                                            {group.stories.map(story => (
                                                 <div 
                                                    key={story.id}
                                                    className="flex items-center gap-2 p-2 hover:bg-white/10 rounded cursor-pointer transition-colors"
                                                    onClick={() => navigate(`/post/${story.id}`)}
                                                 >
                                                    <img 
                                                        src={story.article?.coverImage || story.coverImage || story.logs?.[0]?.image || `https://source.unsplash.com/random/100x100?${story.cityName}&sig=${story.id}`} 
                                                        className="w-8 h-8 rounded-full object-cover border border-white/20"
                                                        alt=""
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium truncate">{story.article?.title || story.cityName}</div>
                                                        <div className="text-xs text-gray-400">{story.date}</div>
                                                    </div>
                                                 </div>
                                            ))}
                                        </div>
                                    </div>
                                </Popup>
                            )}
                        </Marker>
                        );
                    })}

                </MapContainer>
            </motion.div>
        </div>
    );
};


export default InteractiveMap;
