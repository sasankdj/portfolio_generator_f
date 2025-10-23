// middleware/requireAuth.js
export default function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  req.netlifyToken = auth.slice('Bearer '.length);
  next();
}
