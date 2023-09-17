import express from "express";
import asyncHandler from "express-async-handler";
import { writeFile, mkdir, access } from "fs/promises";
import { existsSync } from "fs"
import { join, dirname } from "path";
import { createCanvas, loadImage } from "canvas"
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

const generate = async (videoId: string, playImage: string, imagePath: string, size: string) => {
    const canvas = createCanvas(480, 360);
    const ctx = canvas.getContext('2d')

    const backgroundImage = `https://img.youtube.com/vi/${videoId}/0.jpg`

    await loadImage(backgroundImage).then(async (image) => {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        await loadImage(playImage).then((playImage) => {
            const playEgde = parseInt(size)
            const x = (canvas.width - playEgde) / 2;
            const y = (canvas.height - playEgde) / 2;

            ctx.drawImage(playImage, x, y);

            const buffer = canvas.toBuffer('image/png');

            (async () => {
                try {
                    await writeFile(imagePath, buffer).then(() => {

                    })
                } catch (e) {
                    console.error('Error saving canvas:', e);
                }
            })();
        });
    });
}

router.get('/youtube/:videoId', asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const defaultConfig = { color: "black", size: "50" }
    const enableParams = req.query.color != null || req.query.size != null;
    const { color, size } =  enableParams ? req.query : defaultConfig;
    const playImage = `api/assets/play-${color}-${size}.png`;

    const imagePath = join(__dirname, `../../storage/${videoId}-${color}-${size}.png`);

    if (!existsSync(imagePath)) {
        await generate(videoId, playImage, imagePath, size as string).then(() => {
            res.set(HEADERS);
            res.sendFile(imagePath);
        })
    } else {
        res.set(HEADERS);
        res.sendFile(imagePath);
    }


}));

export {
    router
};