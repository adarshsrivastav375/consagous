export default function (schema) {
  return async function (req, _res, next) {
    try {
      await schema.validate(req);
      next();
    } catch (err) {
      next(err);
    }
  };
}
