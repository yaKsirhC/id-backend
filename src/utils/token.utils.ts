import jwt from 'jsonwebtoken'

function generateToken(refresh: boolean, id: string): String {

    return jwt.sign({ id }, refresh ? String('batatafrita123') : String('fritabatata123'), {
        algorithm: 'HS256',
        expiresIn: refresh ? '1d' : '6h'
    })
}

function validateToken(token: string, refresh: boolean): { valid: boolean, decoded?: { id: string } } {

    try {

        const decoded = jwt.verify(token, refresh ? String('batatafrita123') : String('fritabatata123'))
        const { id }: any = decoded

        if (id) {
            return {
                valid: true,
                decoded: { id }
            }
        }

        return {
            valid: false
        }

    } catch (err) {
        return {
            valid: false
        }
    }

}

export { generateToken, validateToken }