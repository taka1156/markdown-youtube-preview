import express from "express";
import asyncHandler from "express-async-handler";
import sharp from "sharp";
import axios from "axios";
const router = express.Router();
import 'dotenv/config'

// 簡易的なサーバーの生死確認
router.get('/', (req, res) => {
    res.send('<h1>server is running</h1>');
});

const HEADERS = {
    'content-type': 'image/png',
    'cache-control': 'max-age=0, no-cache, no-store, must-revalidate',
};

const generate = async (videoId: string, playImage: string): Promise<Buffer> => {

    const backgroundImageUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`

    const bgImage = await axios.get(backgroundImageUrl, { responseType: 'arraybuffer' }).then(response => response.data);

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

router.get('/youtube/:videoId', asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const defaultConfig = { color: "black", size: "50" }
    const enableParams = req.query.color != null || req.query.size != null;
    const { color, size } = enableParams ? req.query : defaultConfig;
    const playImage = `api/assets/play-${color}-${size}.png`;

    const data = await generate(videoId, playImage).
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