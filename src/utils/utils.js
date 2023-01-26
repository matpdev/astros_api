function calculateDistance({ lat1, long1, lat2, long2 }) {
  let R = 6371;
  let dLat = deg2rad(lat2 - lat1);
  let dLong = deg2rad(long2 - long1);

  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2);

  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = {
  calculateDistance,
};
