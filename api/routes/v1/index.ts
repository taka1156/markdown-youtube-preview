import express from "express";
import asyncHandler from "express-async-handler";
import { playIcon } from "../../constans"
import sharp, { Metadata } from "sharp";
import axios from "axios";
const router = express.Router();
import 'dotenv/config'
import { arrayBuffer } from "stream/consumers";

// 簡易的なサーバーの生死確認
router.get('/', (req, res) => {
    res.send('<h1>server is running</h1>');
});

const HEADERS = {
    'content-type': 'image/jpeg',
    'cache-control': 'max-age=0, no-cache, no-store, must-revalidate',
};


const fetchImage = async (url: string): Promise<Buffer> => {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return response.data;
}

const calOffset = (backgroundMetadata: Metadata, overlayMetadata: Metadata) => {
    if (backgroundMetadata.width && overlayMetadata.width && backgroundMetadata.height && overlayMetadata.height) {
        return {
            offsetX: (backgroundMetadata.width - overlayMetadata.width) / 2,
            offsetY: (backgroundMetadata.height - overlayMetadata.height) / 2
        };
    } else {
        return {
            offsetX: 0,
            offsetY: 0
        };
    }
}

const generateOverlayImage = async (videoId: string, colorCode: string, size: string): Promise<Buffer> => {

    try {
        const backgroundImageUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
        const playImageUrl = playIcon(colorCode, size);

        const [bgImage, playImage] = await Promise.all([
            fetchImage(backgroundImageUrl),
            fetchImage(playImageUrl)
        ]);

        const backgroundImage = sharp(bgImage);
        const overlayImage = sharp(playImage);

        const backgroundMetadata = await backgroundImage.metadata();
        const overlayMetadata = await overlayImage.metadata();

        const { offsetX, offsetY } = calOffset(backgroundMetadata, overlayMetadata);


        return backgroundImage
            .composite([{
                input: playImage,
                left: offsetX,
                top: offsetY
            }])
            .toBuffer();
    } catch (e: unknown) {
        console.error(e);
        throw new Error("Faild to generate image.");
    }
}

router.get('/yt/:videoId', asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        const colorCode = (req.query.color || req.query.c || "red") as string;
        const size = (req.query.size || req.query.s || "130") as string;

        const data = await generateOverlayImage(videoId, colorCode, size);
        res.set(HEADERS);
        res.send(data);
    } catch (e: unknown) {
        res.status(500).send(e);
    };
}));

export {
    router
};
