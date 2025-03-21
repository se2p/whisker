/**
 * An asset is a costume or sound. (Backdrops are considered costumes.) Assets are stored as individual files in
 * a project's *.sb3 file with names beginning with their MD5 checksums followed by a file extension.
 *
 * https://en.scratch-wiki.info/wiki/Scratch_File_Format#Assets
 */
export interface Asset {

    /**
     * The MD5 hash of the asset file, e.g., "bcf454acf82e4504149f7ffe07081dbc".
     */
    assetID: string;

    /**
     * The name of the asset, e.g., "costume1" or "Meow".
     */
    name: string;

    /**
     * The name of the format (corresponds to file type and file extension) of the asset file, e.g.,
     * "wav" or "svg".
     */
    dataFormat: string;

    /**
     * The filename of the asset (= MD5 hash of the asset file + extension).
     */
    md5EXT: `${Asset["assetID"]}.${Asset["dataFormat"]}`;
}

export interface Costume extends Asset {
    dataFormat: "png" | "svg" | "jpeg" | "jpg" | "bmp" | "gif";

    /**
     * The reciprocal of a costume scaling factor for bitmap costumes. This may be absent. In Scratch 3.0, all bitmap
     * costumes are double-resolution.
     */
    bitmapResolution?: number;

    /**
     * The x-coordinate of the costume's center.
     */
    rotationCenterX: number;

    /**
     * The y-coordinate of the costume's center.
     */
    rotationCenterY: number;
}

export interface Sound extends Asset {
    dataFormat: "wav" | "wave" | "mp3";

    format: "adpcm" | "";

    /**
     * The sampling rate of the sound in Hertz.
     */
    rate: number;

    /**
     * The number of samples.
     */
    sampleCount: number;
}
