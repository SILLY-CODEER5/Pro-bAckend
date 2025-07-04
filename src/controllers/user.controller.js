import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new apiError(
            500,
            "Something went wrong while generating refresh and access token !"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend as userSchema
    // validation - not empty
    // check if user already exists : username , email
    // check for images , avatar , coverimage
    // upload on cloudinary , avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    // getting user details

    const { username, email, fullName, password } = req.body;
    // console.log(username, email);
    // console.log("request.body -> (", req.body, ")");

    // validations...

    // if(fullName === ''){
    //     throw new apiError(400, "fullname is required")
    // }

    if (
        [username, email, fullName, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new apiError(400, "All fields are required !");
    }

    // user already exists or not

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new apiError(
            409,
            "User already exists, Try different username or email !"
        );
    }

    // check for avatar, coverImages ...

    // console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // console.log(avatarLocalPath);
    const coverLocalPath = req.files?.coverImage[0]?.path;
    // console.log(coverLocalPath);

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar is compulsory !");
    }

    // upload on cloudinary ...

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverLocalPath);

    // check if avatar is uploaded successfully ...

    if (!avatar) {
        throw new apiError(400, "Avatar is not upload, error occured !");
    }

    // create and store user object in db

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new apiError(
            500,
            "Something went wrong while registering the user !"
        );
    }

    return res
        .status(201)
        .json(
            new apiResponse(
                200,
                createdUser,
                "wow ! response sent successfully and your User is register Succeessfully !!!"
            )
        );
});

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new apiError(400, "Username required !");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new apiError(404, "User does not exists !");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new apiError(401, "Invalid Credentials !");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged In successfully !!!"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined,
        },
    });

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, {}, "User logged Out !!!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new apiError(401, "Unauthorized request !");
    }

    try {
        const decodedToken = await jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new apiError(401, "Invalid refresh Token !");
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401, "Refresh Token is expired !");
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new apiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new apiError(401, error?.message || "invalid refresh token");
    }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
