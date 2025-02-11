export default function queryHandler(req, res, next) {
  const query = req.query;
  for (const filter in query) {
    if (query[filter].includes(",")) {
      query[filter] = query[filter].split(",");
      query[filter] =
        query[filter].length > 1 ? query[filter] : query[filter][0];
    }
  }

  next();
}
