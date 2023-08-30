import jwt from "jsonwebtoken";
function generateToken(refresh, id) {
    return jwt.sign({
        id
    }, refresh ? String('batatafrita123') : String('fritabatata123'), {
        algorithm: 'HS256',
        expiresIn: refresh ? '1d' : '6h'
    });
}
function validateToken(token, refresh) {
    try {
        const decoded = jwt.verify(token, refresh ? String('batatafrita123') : String('fritabatata123'));
        const { id  } = decoded;
        if (id) {
            return {
                valid: true,
                decoded: {
                    id
                }
            };
        }
        return {
            valid: false
        };
    } catch (err) {
        return {
            valid: false
        };
    }
}
export { generateToken, validateToken };
