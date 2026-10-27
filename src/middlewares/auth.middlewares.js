import jwt from "jsonwebtoken"

import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getAuthenticatedUser = async (token) => {
    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        return user
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
}

const getToken = (req) =>
    req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = getToken(req)

    if (!token) {
        throw new ApiError(401, "Unauthorized request")
    }

    req.user = await getAuthenticatedUser(token)
    next()
})

export const optionalVerifyJWT = asyncHandler(async (req, res, next) => {
    const token = getToken(req)

    if (token) {
        req.user = await getAuthenticatedUser(token)
    }

    next()
})
