import * as fs from 'fs';


class Color {
    public red: number;
    public green: number;
    public blue: number;

    public constructor {
        this.red = 0;
        this.green = 0;
        this.blue = 0;
    }
}

class Image {
    private _pixels: Color[][];

    public constructor(private _width: number, private _height: number) {
        this._pixels = new Array(this._height)
                        .fill(null)
                        .map( () => new Array(this._width)
                                        .fill(null)
                                        .map ( () => new Color() ) 
                            )
    }

    public get width() { return this._width; }
    public get height() { return this._height; }
    public set width(newWidth:  number) { this._width = newWidth; }
    public set height(newHeight: number) { this._height = newHeight; }

    public setColor(x: number, y: number, newColor: Color) {
        if ((x < this._height) || (y < this._width) || (x < 0) || (y < 0)) {
            throw new Error
        }

        this._pixels[x][y] = newColor;
    }

    public getColor(x: number, y: number): Color {
        if ((x < this._height) || (y < this._width) || (x < 0) || (y < 0)) {
            throw new Error
        }
        return this._pixels[x][y];
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
                return;
            }

            const INPUT_FILE = this.commandLineArgs[0];
            const OUTPUT_FILE = this.commandLineArgs[1];
            const FILTER = this.commandLineArgs[2];

            let image: Image = this._readImage(INPUT_FILE);

            if (FILTER === "grayscale" || FILTER === "greyscale") {
                // TODO
            } else if (FILTER === "invert") {
                // TODO
            }else if (FILTER === "emboss") {
                // TODO
            } else if (FILTER === "motionblur") {

            } else {
                this._usage()
            }
        } catch {
            // TODO
        }
    }

    private _usage() {
		console.log("USAGE: java ImageEditor <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}");
	}

    private _readImage(filePath: string | undefined): Image {
        let image: Image? = null

        // TODO: read in image from file

        return image;
    }

}