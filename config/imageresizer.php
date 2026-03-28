<?php

return [
    /**
     * The default width for resizing. If -1, original width is used.
     */
    'defaultWidth' => 250,

    /**
     * The default height for resizing. If -1, original height is used.
     */
    'defaultHeight' => 250,

    /**
     * Default boolean value (true/false) signifying if the image should be upscaled
     * if the source size is smaller than output size.
     */
    'defaultUpscale' => false,

    /**
     * Default boolean value (true/false) signifying if the code should apply padding.
     * If true, it works like a CSS "contain" mode: it resizes the image down until it fits
     * the requested dimensions, then adds a transparent (for WebP/PNG) or white (for JPG) background.
     * If false, it works like a CSS "cover" mode: it fills the requested dimensions by resizing
     * and cropping the excess.
     */
    'defaultPadding' => false,

    /**
     * The maximum memory consumption (in MB) used for image resizing.
     * Default is -1, which means there's no limit.
     * This memory is for temporary storing the resized buffer before saving to disk.
     */
    'maxMemory' => -1,

    /**
     * Output image format. One of "webp", "jpg", "png", "tga", "tiff".
     */
    'defaultFormat' => 'webp',

    /**
     * Default quality of the image. Range: 1 to 100.
     * Applied only to "jpg" and "webp" formats.
     */
    'defaultQuality' => 80,

    /**
     * Default boolean value (true/false) signifying if the image should be lossless.
     * Applied only to "webp" and "png" formats.
     */
    'defaultLossless' => false,

    /**
     * Max number of images in the queue in the memory.
     * If the value is -1, the code will set it automatically to the number of CPUs by multiplying by 2.
     */
    'maxQueueSize' => -1,

    /**
     * Boolean value (true/false) to signify whether to remove source after resizing.
     * Note: This only happens if the source image file extension is different from the destination's extension.
     */
    'removeSource' => false,
];
