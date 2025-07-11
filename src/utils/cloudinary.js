import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload an file
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        // console.log("file is uploaded", response); // response contains all details of file upload (like size, height , width, original name , url , secure_url etc...)
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // removes the locally saved temporary file as the upload operation got failed
        console.log(error);
    }
};

// const uploadResult = await cloudinary.uploader
//     .upload(
//         "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
//         {
//             public_id: "shoes",
//         }
//     )
//     .catch((error) => {
//         console.log(error);
//     });

export { uploadOnCloudinary };
