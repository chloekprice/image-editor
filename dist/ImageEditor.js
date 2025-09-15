"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
function isColor(value) {
    return (value &&
        typeof value.red === 'number' &&
        typeof value.green === 'number' &&
        typeof value.blue === 'number');
}
class Image {
    _width;
    _height;
    _pixels;
    constructor(_width, _height) {
        this._width = _width;
        this._height = _height;
        this._pixels = new Array(this._height)
            .fill(null)
            .map(() => new Array(this._width)
            .fill(null)
            .map(() => ({ red: 0, green: 0, blue: 0 })));
    }
    get width() { return this._width; }
    get height() { return this._height; }
    set width(newWidth) { this._width = newWidth; }
    set height(newHeight) { this._height = newHeight; }
    setColor(x, y, newColor) {
        if ((x >= this._height) || (y >= this._width) || (x < 0) || (y < 0)) {
            throw new Error;
        }
        this._pixels[x][y] = newColor;
    }
    getColor(x, y) {
        if ((x >= this._height) || (y >= this._width) || (x < 0) || (y < 0)) {
            throw new Error;
        }
        if (isColor(this._pixels[x][y])) {
            return this._pixels[x][y];
        }
        else {
            return { red: 0, green: 0, blue: 0 };
        }
    }
}
class ImageEditor {
    commandLineArgs;
    constructor() {
        this.commandLineArgs = process.argv.slice(2);
    }
    run() {
        console.log("starting...");
        try {
            if (this.commandLineArgs.length < 3) {
                this._usage();
                return;
            }
            const INPUT_FILE = this.commandLineArgs[0];
            const OUTPUT_FILE = this.commandLineArgs[1];
            const FILTER = this.commandLineArgs[2];
            console.log(INPUT_FILE);
            console.log(OUTPUT_FILE);
            console.log(FILTER);
            let image = this._readImage(INPUT_FILE);
            if (FILTER === "grayscale" || FILTER === "greyscale") {
                if (this.commandLineArgs.length != 3) {
                    this._usage();
                    return;
                }
                this._grayscale(image);
            }
            else if (FILTER === "invert") {
                if (this.commandLineArgs.length != 3) {
                    this._usage();
                    return;
                }
                this._invert(image);
            }
            else if (FILTER === "emboss") {
                if (this.commandLineArgs.length != 3) {
                    this._usage();
                    return;
                }
                this._emboss(image);
            }
            else if (FILTER === "motionblur") {
                if (this.commandLineArgs.length != 4) {
                    this._usage();
                    return;
                }
                let length = -1;
                if (typeof this.commandLineArgs === "string") {
                    length = parseInt(this.commandLineArgs[3]);
                }
                this._motionblur(image, length);
            }
            else {
                this._usage();
            }
            this._writeOutImage(image, OUTPUT_FILE);
        }
        catch (error) {
            if (error instanceof Error) {
                console.log(error.stack);
            }
            else {
                console.log(error);
            }
        }
    }
    _emboss(image) {
        for (let x = image.height - 1; x >= 0; --x) {
            for (let y = image.height - 1; y >= 0; --y) {
                let currentColor = image.getColor(x, y);
                let diff = 0;
                if (x > 0 && y > 0) {
                    let upLeftColor = image.getColor(x - 1, y - 1);
                    if (Math.abs(currentColor.red - upLeftColor.red) > Math.abs(diff)) {
                        diff = currentColor.red - upLeftColor.red;
                    }
                    if (Math.abs(currentColor.green - upLeftColor.green) > Math.abs(diff)) {
                        diff = currentColor.green - upLeftColor.green;
                    }
                    if (Math.abs(currentColor.blue - upLeftColor.blue) > Math.abs(diff)) {
                        diff = currentColor.blue - upLeftColor.blue;
                    }
                }
                let grayLevel = (128 + diff);
                grayLevel = Math.max(0, Math.min(grayLevel, 255));
                currentColor.red = grayLevel;
                currentColor.green = grayLevel;
                currentColor.blue = grayLevel;
            }
        }
    }
    _grayscale(image) {
        for (let x = 0; x < image.height; ++x) {
            for (let y = 0; y < image.width; ++y) {
                let currentColor = image.getColor(x, y);
                let grayLevel = (currentColor.red + currentColor.green + currentColor.blue) / 3;
                grayLevel = Math.max(0, Math.min(grayLevel, 255));
                currentColor.red = grayLevel;
                currentColor.green = grayLevel;
                currentColor.blue = grayLevel;
            }
        }
    }
    _invert(image) {
        for (let x = 0; x < image.height; ++x) {
            for (let y = 0; y < image.width; ++y) {
                let currentColor = image.getColor(x, y);
                currentColor.red = 255 - currentColor.red;
                currentColor.green = 255 - currentColor.green;
                currentColor.blue = 255 - currentColor.blue;
            }
        }
    }
    _motionblur(image, length) {
        if (length < 1) {
            return;
        }
        for (let x = 0; x < image.height; x++) {
            for (let y = 0; y < image.width; y++) {
                let currentColor = image.getColor(x, y);
                let maxX = Math.min(image.height - 1, x + length - 1);
                for (let i = x + 1; i <= maxX; ++i) {
                    let tempColor = image.getColor(i, y);
                    currentColor.red += tempColor.red;
                    currentColor.green += tempColor.green;
                    currentColor.blue += tempColor.blue;
                }
                let delta = (maxX - x + 1);
                currentColor.red /= delta;
                currentColor.green /= delta;
                currentColor.blue /= delta;
            }
        }
    }
    _readImage(filePath) {
        let image;
        let fileContent = fs.readFileSync(filePath);
        let offset = 0;
        let magicNumber = "";
        while (fileContent[offset] !== 0x0A && fileContent[offset] !== 0x20) {
            magicNumber += String.fromCharCode(fileContent[offset]);
            offset++;
        }
        offset++;
        if (magicNumber !== "P3") {
            console.error("Unsupported PPM format. Only P3 is supported.");
        }
        while (fileContent[offset] === 0x23) { // '#'
            while (fileContent[offset] !== 0x0A) { // Newline
                offset++;
            }
            offset++; // Skip newline
        }
        // Read width
        let widthStr = '';
        while (fileContent[offset] !== 0x0A && fileContent[offset] !== 0x20) {
            widthStr += String.fromCharCode(fileContent[offset]);
            offset++;
        }
        offset++;
        const width = parseInt(widthStr, 10);
        console.log(width);
        // Read height
        let heightStr = '';
        while (fileContent[offset] !== 0x0A && fileContent[offset] !== 0x20) {
            heightStr += String.fromCharCode(fileContent[offset]);
            offset++;
        }
        offset++;
        const height = parseInt(heightStr, 10);
        console.log(height);
        image = new Image(width, height);
        // Read max color value
        let maxColorValueStr = '';
        while (fileContent[offset] !== 0x0A && fileContent[offset] !== 0x20) {
            maxColorValueStr += String.fromCharCode(fileContent[offset]);
            offset++;
        }
        offset++;
        const maxColorValue = parseInt(maxColorValueStr, 10);
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                let redString = String.fromCharCode(fileContent[offset]);
                let red = parseInt(redString);
                offset++;
                let greenString = String.fromCharCode(fileContent[offset]);
                let green = parseInt(greenString);
                offset++;
                let blueString = String.fromCharCode(fileContent[offset]);
                let blue = parseInt(blueString);
                offset++;
                image.setColor(y, x, { red: red, blue: blue, green: green });
            }
        }
        return image;
    }
    _usage() {
        console.log("USAGE: java ImageEditor <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}");
    }
    _writeOutImage(image, filePath) {
        // TODO: print out final image to file
        console.log(`Pretending to write image to ${filePath}`);
    }
}
const editor = new ImageEditor();
editor.run();
//# sourceMappingURL=ImageEditor.js.map