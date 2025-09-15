const fs = require('fs');

// custom type
type Color = {
    red: number,
    green: number,
    blue: number
}

// checks if variable if of type color
function isColor(value: any): value is Color {
    return (
        value &&
        typeof value.red === 'number' &&
        typeof value.green === 'number' &&
        typeof value.blue === 'number'
    );
}

// holds image data
class Image {
    private _pixels: Color[][];

    public constructor(private _width: number, private _height: number) {
        this._pixels = new Array(this._height)
                        .fill(null)
                        .map( () => new Array(this._width)
                                        .fill(null)
                                        .map ( () => ({red: 0, green: 0, blue: 0}) ) 
                            )
    }

    public get width() { return this._width; }
    public get height() { return this._height; }
    public set width(newWidth:  number) { this._width = newWidth; }
    public set height(newHeight: number) { this._height = newHeight; }

    public setColor(width: number, height: number, newColor: Color) {
        if ((height >= this._height) || (width >= this._width) || (height < 0) || (width < 0)) { throw new Error("Out of bounds image pixel access") }

        this._pixels[height]![width] = newColor;
    }

    public getColor(width: number, height: number): Color {
        if ((height >= this._height) || (width >= this._width) || (height < 0) || (width < 0)) { throw new Error("Out of bounds image pixel access") }

        if (isColor(this._pixels[height]![width])) { return this._pixels[height]![width] as Color; } 
        else { return {red: 0, green: 0, blue: 0}; }
    }

}

class ImageEditor {
    private commandLineArgs: string[]

    public constructor() { this.commandLineArgs = process.argv.slice(2) }

    run() {
        try {
            if (this.commandLineArgs.length < 3) {
                this._usage();
                return;
            }

            const INPUT_FILE = this.commandLineArgs[0];
            const OUTPUT_FILE = this.commandLineArgs[1];
            const FILTER = this.commandLineArgs[2];

            let image: Image = this._readImage(INPUT_FILE as string);

            if (FILTER === "grayscale" || FILTER === "greyscale") {
                if (this.commandLineArgs.length != 3) {
                    this._usage();
                    return;
                }
                this._grayscale(image);

            } else if (FILTER === "invert") {
                if (this.commandLineArgs.length != 3) {
                    this._usage();
                    return;
                }
                this._invert(image);

            }else if (FILTER === "emboss") {
                if (this.commandLineArgs.length != 3) {
                    this._usage();
                    return;
                }
                this._emboss(image);

            } else if (FILTER === "motionblur") {
                if (this.commandLineArgs.length < 4) {
                    this._usage();
                    return;
                }
                
                if (this.commandLineArgs === undefined) { throw new Error('cannot parse motion blur length'); }
                let length = parseInt(this.commandLineArgs[3] as string, 10);

                this._motionblur(image, length);

            } else {
                this._usage()
            }

            this._writeOutImage(image, OUTPUT_FILE as string)
        } catch (error) {
            if (error instanceof Error) { console.log(error.stack) } 
            else { console.log(error) }
        }
    }


    // HELPER FUNCTIONS

    private _emboss(image: Image) {
		for (let w = image.width - 1; w >= 0; --w) {
			for (let h = image.height - 1; h >= 0; --h) {
				let currentColor: Color = image.getColor(w, h);
				
				let diff = 0;
				if (w > 0 && h > 0) {
					let upLeftColor: Color = image.getColor(w - 1, h - 1);
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
				
				let grayLevel: number = (128 + diff);
				grayLevel = Math.max(0, Math.min(grayLevel, 255));
				
				currentColor.red = grayLevel;
				currentColor.green = grayLevel;
				currentColor.blue = grayLevel;

                image.setColor(w, h, currentColor);
			}
		}
    }

    private _grayscale(image: Image) {
		for (let x = 0; x < image.height; ++x) {
			for (let y = 0; y < image.width; ++y) {
				let currentColor: Color = image.getColor(y, x);
								
				let grayLevel: number = (currentColor.red + currentColor.green + currentColor.blue) / 3;
				grayLevel = Math.max(0, Math.min(grayLevel, 255));
				
				currentColor.red = grayLevel;
				currentColor.green = grayLevel;
				currentColor.blue = grayLevel;
                
                image.setColor(y, x, currentColor);
			}
		}
	}

    private _invert(image: Image) {
		for (let x = 0; x < image.height; ++x) {
			for (let y = 0; y < image.width; ++y) {
				let currentColor: Color = image.getColor(y, x);
	
				currentColor.red = 255 - currentColor.red;
				currentColor.green = 255 - currentColor.green;
				currentColor.blue = 255 - currentColor.blue;
                
                image.setColor(y, x, currentColor);
			}
		}
	}

    private _motionblur(image: Image, length: number) {
		if (length < 1) { return; }

		for (let w = 0; w < image.width; w++) {
			for (let h = 0; h < image.height; h++) {
			    let currentColor: Color = image.getColor(w, h);
				
				let maxW = Math.min(image.width - 1, w + length - 1);
				for (let i = w + 1; i <= maxW; ++i) {
					let tempColor: Color = image.getColor(i, h);
					currentColor.red += tempColor.red;
					currentColor.green += tempColor.green;
					currentColor.blue += tempColor.blue;
				}

				let delta: number = (maxW - w + 1);
				currentColor.red /= delta;
				currentColor.green /= delta;
				currentColor.blue /= delta;
                
                image.setColor(w, h, currentColor);
			}
		}
	}

    private _readImage(filePath: string): Image {
        let image: Image;

        let fileContent: string = fs.readFileSync(filePath, 'utf8');
        const tokens: string[] = fileContent
                        .split(/\s+/)
                        .filter( token => token.length > 0 && !token.startsWith('#'));
            
        // Check general format
        if (tokens[0] !== 'P3' 
            || tokens[1] === undefined
            || tokens[2] === undefined
            || tokens[3] === undefined
        ) { throw new Error('Unsupported PPM format. Only P3 is supported.'); }

        // Get image width and height
        const width = parseInt(tokens[1], 10);
        const height = parseInt(tokens[2], 10);
        const _ = parseInt(tokens[3], 10); // skip max value

        // Get and set image data
        image = new Image(width, height);
        let pixelIndex = 4;
        for (let h = 0; h < height; h++) {
            for (let w = 0; w < width; w++) {
                if (tokens[pixelIndex] === undefined) { throw new Error('Could not parse the pixels of the image') }
                const red = parseInt(tokens[pixelIndex++] as string, 10);
                if (tokens[pixelIndex] === undefined) { throw new Error('Could not parse the pixels of the image') }
                const green = parseInt(tokens[pixelIndex++] as string, 10);
                if (tokens[pixelIndex] === undefined) { throw new Error('Could not parse the pixels of the image') }
                const blue = parseInt(tokens[pixelIndex++] as string, 10);

                image.setColor(w, h, {red, green, blue});
            }
        }

        return image;
    }

    private _usage() {
		console.log("USAGE: java ImageEditor <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}");
	}

    private _writeOutImage(image: Image, filePath: string) {
        let ppmContent = `P3\n`;
        ppmContent += `${image.width} ${image.height}\n`;
        ppmContent += `255\n`;

        for (let h = 0; h < image.height; h++) {
            let rowPixels: string[] = [];
            for (let w = 0; w < image.width; w++) {
                const pixel = image.getColor(w, h);
                rowPixels.push(`${pixel.red} ${pixel.green} ${pixel.blue}`);
            }
            ppmContent += rowPixels.join(' ') + '\n';
        }

        fs.writeFileSync(filePath, ppmContent);
    }
}

// RUN
const editor = new ImageEditor();
editor.run();
