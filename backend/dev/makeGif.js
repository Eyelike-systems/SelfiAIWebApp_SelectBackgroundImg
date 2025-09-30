const fs = require("fs");
const Jimp = require("jimp");          // using jimp@0.16.1
const GIFEncoder = require("gif-encoder-2");

const width = 300;   // output gif width
const height = 300;  // output gif height

(async () => {
  // setup gif encoder
  const encoder = new GIFEncoder(width, height);
  encoder.start();
  encoder.setRepeat(0);   // 0 = loop forever
  encoder.setDelay(100);  // 100ms per frame
  encoder.setQuality(10); // lower is better quality

  // save to file
  const output = fs.createWriteStream("output.gif");
  encoder.createReadStream().pipe(output);

  // load source image
  const image = await Jimp.read("./AAA_2025-08-07_12-48-19_processed.jpg");

  // generate frames
  for (let i = 0; i < 20; i++) {
    const frame = new Jimp(width, height, 0xffffffff); // white background

    // zoom effect: oscillates between 1.0 and 1.2 scale
    const scale = 1 + 0.2 * Math.sin((i / 20) * Math.PI * 2);

    const scaled = image.clone().resize(width * scale, height * scale);

    frame.composite(
      scaled,
      width / 2 - scaled.bitmap.width / 2,
      height / 2 - scaled.bitmap.height / 2
    );

    encoder.addFrame(frame.bitmap.data);
  }

  encoder.finish();
  console.log("✅ GIF saved as output.gif");
})();
