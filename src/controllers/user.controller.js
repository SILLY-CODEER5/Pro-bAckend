import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

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

export { registerUser };
