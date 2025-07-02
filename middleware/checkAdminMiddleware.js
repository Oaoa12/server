export default function (req, res, next) {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Только для администратора' });
    }
    next();
}