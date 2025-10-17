import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Camera, Home, Lightbulb, Navigation, Send, CheckCircle, Info } from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import ContributionMap from '../components/ContributionMap';

const ContributePage = () => {
  const [formData, setFormData] = useState({
    type: 'no_street_light',
    coordinates: {
      latitude: '',
      longitude: ''
    },
    address: '',
    description: '',
    severity: 'medium',
    contributorName: '',
    contributorEmail: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [step, setStep] = useState(1); // Multi-step form

  const contributionTypes = [
    { value: 'no_street_light', label: 'No Street Light', icon: Lightbulb, emoji: '💡', color: 'from-yellow-400 to-orange-500' },
    { value: 'cctv', label: 'CCTV Camera', icon: Camera, emoji: '📷', color: 'from-blue-400 to-cyan-500' },
    { value: 'abandoned_house', label: 'Abandoned Building', icon: Home, emoji: '🏚️', color: 'from-red-400 to-pink-500' },
    { value: 'pothole', label: 'Pothole', icon: AlertTriangle, emoji: '🕳️', color: 'from-orange-400 to-red-500' },
    { value: 'accident_prone', label: 'Accident Prone', icon: AlertTriangle, emoji: '⚠️', color: 'from-red-500 to-rose-600' },
    { value: 'dark_area', label: 'Dark Area', icon: AlertTriangle, emoji: '🌑', color: 'from-gray-600 to-gray-800' },
    { value: 'other', label: 'Other', icon: MapPin, emoji: '📍', color: 'from-purple-400 to-indigo-500' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', emoji: '🟢', color: 'bg-green-50 border-green-200 text-green-700' },
    { value: 'medium', label: 'Medium', emoji: '🟡', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
    { value: 'high', label: 'High', emoji: '🔴', color: 'bg-red-50 border-red-200 text-red-700' }
  ];

  // Set default location (will be used if user doesn't provide their location)
  useEffect(() => {
    // Set a default location instead of auto-requesting geolocation
    // This avoids the geolocation warning on page load
    setUserLocation({
      latitude: 12.9716, // Bangalore default
      longitude: 77.5946
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'latitude' || name === 'longitude') {
      setFormData({
        ...formData,
        coordinates: {
          ...formData.coordinates,
          [name]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            coordinates: {
              latitude: position.coords.latitude.toFixed(6),
              longitude: position.coords.longitude.toFixed(6)
            }
          });
          setSelectedLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          toast.success('Current location added');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location. Please enable location services.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const handleMapClick = (coordinates) => {
    setFormData({
      ...formData,
      coordinates: {
        latitude: coordinates.latitude.toFixed(6),
        longitude: coordinates.longitude.toFixed(6)
      }
    });
    setSelectedLocation(coordinates);
    toast.success('Location selected on map');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.coordinates.latitude || !formData.coordinates.longitude) {
      toast.error('Please provide location coordinates');
      return;
    }

    if (!formData.type) {
      toast.error('Please select a contribution type');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('http://localhost:5000/api/contributions', {
        ...formData,
        coordinates: {
          latitude: parseFloat(formData.coordinates.latitude),
          longitude: parseFloat(formData.coordinates.longitude)
        }
      });

      if (response.data.success) {
        setShowSuccess(true);
        toast.success('Thank you for your contribution!');
        
        // Reset form after 2 seconds
        setTimeout(() => {
          setFormData({
            type: 'no_street_light',
            coordinates: { latitude: '', longitude: '' },
            address: '',
            description: '',
            severity: 'medium',
            contributorName: '',
            contributorEmail: ''
          });
          setSelectedLocation(null);
          setShowSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting contribution:', error);
      toast.error(error.response?.data?.message || 'Failed to submit contribution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (typeValue) => {
    const type = contributionTypes.find(t => t.value === typeValue);
    return type ? type.icon : MapPin;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-gray-900">Contribute</h1>
              <p className="text-sm text-gray-500 mt-1">Help improve community safety</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                step === 1 ? 'bg-black text-white' : step === 2 ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <span>1</span>
              </div>
              <div className="w-8 h-px bg-gray-200"></div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                step === 2 ? 'bg-black text-white' : step > 2 ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <span>2</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-12">
          
          {/* Step 1: What & Where */}
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              {/* Type Selection */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-900">
                  What are you reporting?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {contributionTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                        formData.type === type.value
                          ? 'border-black bg-gray-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <span className="text-2xl">{type.emoji}</span>
                        <span className="text-xs font-medium text-gray-900">{type.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Map */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-900">
                  Where is it located?
                </label>
                
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="w-full sm:w-auto px-6 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Use my location
                </button>

                <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '400px' }}>
                  {userLocation && (
                    <ContributionMap
                      center={selectedLocation || userLocation}
                      zoom={13}
                      onMapClick={handleMapClick}
                      markers={selectedLocation ? [{
                        id: 'selected',
                        coordinates: selectedLocation,
                        type: formData.type,
                        popup: 'Selected Location'
                      }] : []}
                    />
                  )}
                </div>

                {selectedLocation && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                    </span>
                  </div>
                )}

                {/* Manual Coordinates */}
                <details className="group">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
                    <span>Enter coordinates manually</span>
                    <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={formData.coordinates.latitude}
                      onChange={handleInputChange}
                      placeholder="Latitude"
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={formData.coordinates.longitude}
                      onChange={handleInputChange}
                      placeholder="Longitude"
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                  </div>
                </details>
              </div>

              {/* Next Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.coordinates.latitude || !formData.coordinates.longitude}
                  className="px-8 py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-8 animate-fadeIn">
              {/* Severity */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-900">
                  How severe is it?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {severityLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity: level.value })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.severity === level.value
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl">{level.emoji}</span>
                        <span className="text-xs font-medium text-gray-900">{level.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-900">
                  Address <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-900">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide additional details..."
                  rows="4"
                  maxLength="500"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-400">
                  {formData.description.length}/500
                </p>
              </div>

              {/* Contributor Info */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-900">
                  Your information <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="contributorName"
                    value={formData.contributorName}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <input
                    type="email"
                    name="contributorEmail"
                    value={formData.contributorEmail}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Your submission will be reviewed before being added to the public map.</p>
                    <p>All reports are anonymous unless you choose to provide your information.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || showSuccess}
                  className={`flex-1 py-3 px-6 rounded-full font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    showSuccess
                      ? 'bg-green-600 text-white'
                      : isSubmitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {showSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submitted!
                    </>
                  ) : isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Toast Container */}
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#000',
            color: '#fff',
            borderRadius: '9999px',
            padding: '12px 24px',
          },
        }}
      />
    </div>
  );
};

export default ContributePage;
