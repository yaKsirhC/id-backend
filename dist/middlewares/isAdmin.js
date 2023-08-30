export async function isAdmin(req, res, next) {
    if (!req.user.admin) return res.status(500).send({
        message: 'You can not do that'
    });
    return next();
}
