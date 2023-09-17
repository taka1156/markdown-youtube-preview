import express from "express";
import asyncHandler from "express-async-handler";
import { playIcon } from "../../constans"
import sharp from "sharp";
import axios from "axios";
const router = express.Router();
import 'dotenv/config'

// 簡易的なサーバーの生死確認
router.get('/', (req, res) => {
    res.send('<h1>server is running</h1>');
});

const HEADERS = {
    'content-type': 'image/jpeg',
    'cache-control': 'max-age=0, no-cache, no-store, must-revalidate',
};

const generate = async (videoId: string, colorCode: string, size: string): Promise<Buffer> => {

    const backgroundImageUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
    const playImageUrl = playIcon(colorCode as string, size as string);

    const bgImage = await axios.get(backgroundImageUrl, { responseType: 'arraybuffer' }).then(response => response.data);
    const playImage = await axios.get(playImageUrl, { responseType: 'arraybuffer' }).then(response => response.data);

    const backgroundImage = sharp(bgImage);
    const overlayImage = sharp(playImage);

    const backgroundMetadata = await backgroundImage.metadata();
    const overlayMetadata = await overlayImage.metadata();

    let offsetX: number = 0;
    let offsetY: number = 0;

    if (backgroundMetadata.width != null && overlayMetadata.width != null && backgroundMetadata.height != null && overlayMetadata.height != null) {
        offsetX = (backgroundMetadata.width - overlayMetadata.width) / 2;
        offsetY = (backgroundMetadata.height - overlayMetadata.height) / 2;
    }

    return backgroundImage
        .composite([{
            input: playImage,
            left: offsetX,
            top: offsetY
        }])
        .toBuffer();
}

router.get('/yt/:videoId', asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    let colorCode = (req.query.color || "") as string;
    let size  = (req.query.size || "") as string;

    if (colorCode === "" && req.query?.c != null && req.query?.c !== "") {
        colorCode = req.query?.c as string;
    }

    if (size === "" && req.query?.s != null && req.query?.s !== "") {
        size = req.query?.s as string;
    }

    const data = await generate(videoId, colorCode, size).
        then((buffer) => {
            return buffer;
        }).
        catch(e => {
            console.log(e);
            return null;
        });

    res.set(HEADERS);
    res.send(data);

}));

export {
    router
};