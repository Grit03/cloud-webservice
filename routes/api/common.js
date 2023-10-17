const haversine = (lat1, lon1, lat2, lon2) => {
  // Radius of the Earth in kilometers
  const earthRadius = 6371;

  // Convert latitude and longitude from degrees to radians
  const [rLat1, rLon1, rLat2, rLon2] = [lat1, lon1, lat2, lon2].map(
    (coord) => (coord * Math.PI) / 180
  );

  // Haversine formula
  const dLat = rLat2 - rLat1;
  const dLon = rLon2 - rLon1;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;

  return distance;
};

const filterPlacesByRadius = (places, centerLat, centerLon, maxDistance) => {
  const filteredPlaces = [];
  for (const place of places) {
    const placeLat = place.lat;
    const placeLon = place.lon;
    const distance = haversine(centerLat, centerLon, placeLat, placeLon);
    if (distance <= maxDistance) {
      filteredPlaces.push(place);
    }
  }
  return filteredPlaces;
};

function findNearestPlace(places, centerLat, centerLon) {
  let nearestPlace = null;
  let minDistance = Infinity;

  for (const place of places) {
    const placeLat = place.lat;
    const placeLon = place.lon;
    const distance = haversine(centerLat, centerLon, placeLat, placeLon);

    if (distance < minDistance) {
      minDistance = distance;
      nearestPlace = place;
    }
  }

  return nearestPlace;
}

export { haversine, filterPlacesByRadius, findNearestPlace };
