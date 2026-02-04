import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Compass, ShieldCheck, MapPin, RefreshCw, AlertTriangle, Settings2, Globe } from 'lucide-react';
import QiblaCompass from './QiblaCompass';
import QiblaLocationSelector from './QiblaLocationSelector';

const KAABA_COORDS = { lat: 21.4225, lng: 39.8262 };

interface LocationData {
  lat: number;
  lng: number;
  name: string;
  source: 'GPS' | 'Timezone' | 'Manual' | 'Default';
}

const SubscriberQibla: React.FC = () => {
  const [location, setLocation] = useState<LocationData>(() => {
    const saved = localStorage.getItem('nr_qibla_location');
    return saved ? JSON.parse(saved) : { lat: 24.8607, lng: 67.0011, name: 'Karachi, PK', source: 'Default' };
  });
  
  const [heading, setHeading] = useState(0);
  const [qiblaBearing, setQiblaBearing] = useState(0);
  const [showSelector, setShowSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  
  const lastHeadingRef = useRef(0);
  const isAlignedRef = useRef(false);

  // Timezone to Coordinate mapping for Tier 2 fallback
  const guessLocationFromTimezone = (): LocationData | null => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const mappings: Record<string, {lat: number, lng: number, name: string}> = {
      'Asia/Karachi': { lat: 24.8607, lng: 67.0011, name: 'Karachi Region' },
      'Asia/Dubai': { lat: 25.2048, lng: 55.2708, name: 'Dubai Region' },
      'Asia/Riyadh': { lat: 24.7136, lng: 46.6753, name: 'Riyadh Region' },
      'Europe/London': { lat: 51.5074, lng: -0.1278, name: 'London Region' },
      'America/New_York': { lat: 40.7128, lng: -74.0060, name: 'NY Region' },
      'Asia/Kolkata': { lat: 28.6139, lng: 77.2090, name: 'Delhi Region' }
    };
    
    if (mappings[tz]) {
      return { ...mappings[tz], source: 'Timezone' };
    }
    return null;
  };

  const calculateQiblaBearing = useCallback((lat: number, lng: number) => {
    const φ1 = lat * Math.PI / 180;
    const λ1 = lng * Math.PI / 180;
    const φ2 = KAABA_COORDS.lat * Math.PI / 180;
    const λ2 = KAABA_COORDS.lng * Math.PI / 180;

    const y = Math.sin(λ2 - λ1);
    const x = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(λ2 - λ1);
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    
    return (bearing + 360) % 360;
  }, []);

  useEffect(() => {
    setQiblaBearing(calculateQiblaBearing(location.lat, location.lng));
  }, [location, calculateQiblaBearing]);

  const initializeSensors = async () => {
    setIsCalibrating(true);
    setError(null);
    
    // Tier 1: GPS Handshake
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLoc: LocationData = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: 'Local GPS Node',
            source: 'GPS'
          };
          setLocation(newLoc);
          localStorage.setItem('nr_qibla_location', JSON.stringify(newLoc));
          setIsCalibrating(false);
        },
        () => {
          // Tier 2: Timezone Guess
          const tzLoc = guessLocationFromTimezone();
          if (tzLoc) {
            setLocation(tzLoc);
            setError("GPS node denied. Using timezone regional data.");
          } else {
            setError("Auto-location failed. Please sync manual region.");
          }
          setIsCalibrating(false);
        },
        { timeout: 8000 }
      );
    }

    // iOS DeviceOrientation Permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission !== 'granted') {
          setError("Motion access restricted. Bearing requires manual rotation.");
        }
      } catch (err) {
        console.error("Orientation protocol failure:", err);
      }
    }
  };

  useEffect(() => {
    // Initial sync
    initializeSensors();
  }, []);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let currentHeading = (e as any).webkitCompassHeading || e.alpha;
      
      if (currentHeading !== null) {
        // Dead-zone filter for smoothing
        if (Math.abs(currentHeading - lastHeadingRef.current) > 0.5) {
          setHeading(currentHeading);
          lastHeadingRef.current = currentHeading;
          
          // Check alignment for haptic feedback
          const isAligned = Math.abs((currentHeading - qiblaBearing + 540) % 360 - 180) < 3;
          if (isAligned && !isAlignedRef.current) {
            if ('vibrate' in navigator) navigator.vibrate(25);
            isAlignedRef.current = true;
          } else if (!isAligned) {
            isAlignedRef.current = false;
          }
        }
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [qiblaBearing]);

  const handleManualSelect = (city: string, country: string, lat: number, lng: number) => {
    const newLoc: LocationData = { lat, lng, name: `${city}, ${country}`, source: 'Manual' };
    setLocation(newLoc);
    localStorage.setItem('nr_qibla_location', JSON.stringify(newLoc));
    setShowSelector(false);
    setError(null);
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500 flex flex-col items-center">
      <div className="text-center space-y-2 w-full px-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Geospatial Protocol</h3>
        <div className="flex items-center justify-center gap-4">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Qibla Locator</h2>
          <button 
            onClick={() => setShowSelector(true)}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Settings2 size={18} className="text-indigo-600" />
          </button>
        </div>
      </div>

      {error && (
        <div className="w-full max-w-md px-4 animate-in slide-in-from-top-2">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3 text-amber-700">
            <AlertTriangle size={18} className="shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Main Compass UI */}
      <QiblaCompass heading={heading} qiblaBearing={qiblaBearing} accuracy={location.source === 'GPS' ? 'High' : 'Medium'} />

      <div className="space-y-4 w-full max-w-md px-4">
        {/* Location Status Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
           <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5 backdrop-blur-md">
                    {location.source === 'GPS' ? <ShieldCheck size={24} className="text-emerald-400" /> : <Globe size={24} className="text-blue-400" />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">
                       {location.source === 'GPS' ? 'Verified GPS Handshake' : 'Regional Timezone Node'}
                    </p>
                    <h4 className="text-lg font-black italic text-white uppercase tracking-tight truncate">{location.name}</h4>
                 </div>
              </div>
              <button 
                onClick={initializeSensors}
                disabled={isCalibrating}
                className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5 shrink-0"
              >
                <RefreshCw size={20} className={`text-indigo-400 ${isCalibrating ? 'animate-spin' : ''}`} />
              </button>
           </div>
           <Compass className="text-white/10 absolute -right-4 -bottom-4" size={140} />
        </div>

        {/* Calibration Note */}
        <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2.5rem] flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
             <ShieldCheck size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Node Calibration</p>
            <p className="text-[9px] text-blue-700 font-bold leading-relaxed uppercase opacity-80">
              Bearing accuracy depends on stable magnetometer data. If the needle jitters, move your device in a 'Figure-8' motion to re-align registry sensors.
            </p>
          </div>
        </div>
      </div>

      {showSelector && (
        <QiblaLocationSelector 
          onClose={() => setShowSelector(false)} 
          onSelect={handleManualSelect} 
        />
      )}
    </div>
  );
};

export default SubscriberQibla;