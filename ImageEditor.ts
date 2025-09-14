import * as fs from 'fs';


type Color = {
    red: number,
    green: number,
    blue: number
}

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

    public setColor(x: number, y: number, newColor: Color) {
        if ((x >= this._height) || (y >= this._width) || (x < 0) || (y < 0)) {
            throw new Error
        }

        this._pixels[x]![y] = newColor;
    }

    public getColor(x: number, y: number): Color {
        if ((x >= this._height) || (y >= this._width) || (x < 0) || (y < 0)) {
            throw new Error
        }

        return this._pixels[x]![y];
    }

}

class ImageEditor {
    private commandLineArgs: string[]

    public constructor() { 
        this.commandLineArgs = process.argv.slice(2)
    }

    run() {
        try {
            if (this.commandLineArgs.length < 3) {
                this._usage();
                return;
            }

            const INPUT_FILE = this.commandLineArgs[0];
            const OUTPUT_FILE = this.commandLineArgs[1];
            const FILTER = this.commandLineArgs[2];

            let image: Image = this._readImage(INPUT_FILE);

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
                if (this.commandLineArgs.length != 4) {
                    this._usage();
                    return;
                }
                
                let length: number = -1;
                try {
                    // TODO parse integer from arg 3
                } catch {
                    // ignore error
                }

                this._motionblur(image, length);
            } else {
                this._usage()
            }

            this._writeOutImage(image, OUTPUT_FILE)
        } catch (error) {
            if (error instanceof Error) {
                console.log(error.stack)
            } else {
                console.log(error)
            }
        }
    }


    private _emboss(image: Image) {
		for (let x = image.height - 1; x >= 0; --x) {
			for (let y = image.height - 1; y >= 0; --y) {
				let currentColor: Color = image.getColor(x, y);
				
				let diff = 0;
				if (x > 0 && y > 0) {
					let upLeftColor: Color = image.getColor(x - 1, y - 1);
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
			}
		}
    }

    private _grayscale(image: Image) {
		for (let x = 0; x < image.height; ++x) {
			for (let y = 0; y < image.width; ++y) {
				let currentColor: Color = image.getColor(x, y);
								
				let grayLevel: number = (currentColor.red + currentColor.green + currentColor.blue) / 3;
				grayLevel = Math.max(0, Math.min(grayLevel, 255));
				
				currentColor.red = grayLevel;
				currentColor.green = grayLevel;
				currentColor.blue = grayLevel;
			}
		}
	}

    private _invert(image: Image) {
		for (let x = 0; x < image.height; ++x) {
			for (let y = 0; y < image.width; ++y) {
				let currentColor: Color = image.getColor(x, y);
	
				currentColor.red = 255 - currentColor.red;
				currentColor.green = 255 - currentColor.green;
				currentColor.blue = 255 - currentColor.blue;
			}
		}
	}

    private _motionblur(image: Image, length: number) {
		if (length < 1) {
			return;
		}

		for (let x = 0; x < image.height; x++) {
			for (let y = 0; y < image.width; y++) {
			    let currentColor: Color = image.getColor(x, y);
				
				let maxX = Math.min(image.height - 1, x + length - 1);
				for (let i = x + 1; i <= maxX; ++i) {
					let tempColor: Color = image.getColor(i, y);
					currentColor.red += tempColor.red;
					currentColor.green += tempColor.green;
					currentColor.blue += tempColor.blue;
				}

				let delta: number = (maxX - x + 1);
				currentColor.red /= delta;
				currentColor.green /= delta;
				currentColor.blue /= delta;
			}
		}
	}

    private _readImage(filePath: string | undefined): Image {
        let image: Image | undefined = null

        // TODO: read in image from file

        return image;
    }

    private _usage() {
		console.log("USAGE: java ImageEditor <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}");
	}

    private _writeOutImage(image: Image, filePath: string | undefined) {
        // TODO: print out final image to file
    }

}