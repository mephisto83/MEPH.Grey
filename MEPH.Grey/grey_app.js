(function (self) {
    var getSigma = function () {
        return document.querySelector('[sigma]');
    }
    var getSketchCanvas = function () {
        return document.querySelector('[sketchCanvas]');
    };

    var getGreyCanvas = function () {
        return document.querySelector('[greyCanvas]');
    }
    var getCanvas = function (name) {
        return document.querySelector('[' + name + ']');
    }


    var getTestImage = function () {
        return document.querySelector('[testimage]');
    }
    var getTestImageData = function () {
        var image = getTestImage();
        debugger
    }
    var drawToSketch = function (img) {
        var canvas = getSketchCanvas();
        canvas.width = img.width;
        canvas.height = img.height;
        var context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);
        return canvas;
    }
    var getSketchData = function (canvas) {
        var context = canvas.getContext('2d');
        return context.getImageData(0, 0, canvas.width, canvas.height);
    }
    var convertToGrey = function (data) {
        var greyData = new Uint8Array(data.height * data.width);
        for (var i = 0 ; i < data.height; i++) {
            for (var j = 0 ; j < data.width; j++) {
                var pixel = i * (data.width * 4) + j * 4;
                greyData[i * data.width + j] = data.data[pixel] * .2126 + data.data[pixel + 1] * .7152 + data.data[pixel + 2] * .0722;
            }
        }
        return { data: greyData, height: data.height, width: data.width };
    }

    var drawGreyToSketch = function (data, greyCanvas) {
        var length = data.height * data.width;
        var info = data.data;
        greyCanvas.height = data.height;
        greyCanvas.width = data.width;
        var array = new Uint8ClampedArray(length * 4);
        for (var i = 0 ; i < length; i++) {
            array[i * 4] = info[i];
            array[i * 4 + 1] = info[i];
            array[i * 4 + 2] = info[i];
            array[i * 4 + 3] = 255;
        }

        var imageData = new ImageData(array, data.width, data.height);
        var context = greyCanvas.getContext('2d');
        context.putImageData(imageData, 0, 0, 0, 0, data.width, data.height);
    };

    var getPixel = function (x, y, data, width, step) {
        step = step || 1;
        return data[(step * x) + (step * y * width)] || 0;
    }
    var setPixel = function (x, y, data, val, width, step) {
        step = step || 1;
        data[(step * x) + (step * y * width)] = val;
    }

    var getIntegralAreaValue = function (data, x1, y1, x2, y2, x3, y3, x4, y4, width, height, step) {
        step = step || 1;
        var sa = getPixel(x1, y1, data, width, step);
        var sb = getPixel(x2, y2, data, width, step);
        var sc = getPixel(x3, y3, data, width, step); 
        var sd = getPixel(x4, y4, data, width, step);
         
        return sa + sd - sb - sc;
    }

    var computeIntegralImage = function (greyData) {
        var output = new Array(greyData.width * greyData.height),
            width = greyData.width;

        for (var j = 0 ; j < greyData.height; j++) {
            for (var i = 0 ; i < greyData.width; i++) {
                var val = getPixel(i, j, greyData.data, greyData.width);
                if (i === 0 && j === 0) {
                    setPixel(i, j, output, val, width);
                }
                else if (i === 0) {
                    var sx1y = getPixel(i, j - 1, output, greyData.width);
                    setPixel(i, j, output, sx1y + val, width);
                }
                else if (j === 0) {
                    var sxy1 = getPixel(i - 1, j, output, greyData.width);
                    setPixel(i, j, output, sxy1 + val, width);
                }
                else {
                    var sx1y = getPixel(i, j - 1, output, greyData.width);
                    var sxy1 = getPixel(i - 1, j, output, greyData.width);
                    var sx1y1 = getPixel(i - 1, j - 1, output, greyData.width);

                    setPixel(i, j, output, sx1y + sxy1 + val - sx1y1, width);
                }
            }
        }
        return {
            height: greyData.height,
            width: greyData.width,
            data: output
        }
    }

    var drawGaussian = function (options) {
        var height = options.height,
            width = options.width,
            sig = options.sig || 1.3,
            canvas = options.canvas;
        canvas.height = height;
        canvas.width = width;
        var white = 255;
        var maxvalue = (1 / Math.sqrt(Math.pow(sig, 2) * 2 * Math.PI));
        var step = 4;
        var length = height * step * width;
        var val;
        var array = new Uint8ClampedArray(length);
        for (var i = 0 ; i < width; i++) {
            for (var j = 0; j < height; j++) {
                val = white * gaussian(i - width / 2, j - height / 2, sig);
                array[(i * step) + (step * j * width)] = val;
                array[(i * step) + (step * j * width) + 1] = val;
                array[(i * step) + (step * j * width) + 2] = val;
                array[(i * step) + (step * j * width) + 3] = 255;
            }
        }

        var imageData = new ImageData(array, width, height);
        var context = canvas.getContext('2d');
        context.putImageData(imageData, 0, 0, 0, 0, width, height);
    }
    var draw = function (options) {
        var height = options.height,
           width = options.width,
           data = options.data,
           canvas = options.canvas;
        canvas.height = height;
        canvas.width = width;

        var step = 4;
        var length = height * step * width;

        var array = new Uint8ClampedArray(length);
        for (var i = 0 ; i < width; i++) {
            for (var j = 0; j < height; j++) {
                val = getPixel(i, j, data, width);
                array[(i * step) + (step * j * width)] = val;
                array[(i * step) + (step * j * width) + 1] = val;
                array[(i * step) + (step * j * width) + 2] = val;
                array[(i * step) + (step * j * width) + 3] = 255;
            }
        }

        var imageData = new ImageData(array, width, height);
        var context = canvas.getContext('2d');
        context.putImageData(imageData, 0, 0, 0, 0, width, height);
    }
    var getGaussianFilter = function (width, height, sig, real) {
        var val,
            array = new Array(width * height);

        for (var i = 0 ; i < width; i++) {
            for (var j = 0; j < height; j++) {
                val = (real ? r_gaussian : gaussian)(i - width / 2, j - height / 2, sig);
                array[(i) + (j * width)] = val;
            }
        }
        return array;
    }

    var convole = function (arrBigObj, arrObj, center_point) {
        var width = arrObj.width;
        var height = arrObj.height;
        var wx = -Math.round(width / 2) + center_point.x;
        var ewx = Math.round(width / 2) + center_point.x;
        var wy = -Math.round(height / 2) + center_point.y;
        var ewy = Math.round(height / 2) + center_point.y;
        var total = 0;
        for (var i = wx ; i < ewx; i++) {
            for (var j = wy; j < ewy; j++) {
                var val = getPixel(i, j, arrBigObj.data, arrBigObj.width, 1);
                var cval = getPixel(i - wx, j - wy, arrObj.data, arrObj.width, 1);
                total += (val * cval);
            }
        }
        return total;
    }

    var gaussian = function (x, y, sig) {
        //(1 / Math.sqrt(Math.pow(sig, 2) * 2 * Math.PI)) *
        return Math.pow(Math.E, -(Math.pow(x, 2) + Math.pow(y, 2)) / (2 * Math.pow(sig, 2)))
    }

    var r_gaussian = function (x, y, sig) {
        return gaussian(x, y, sig) * (1 / Math.sqrt(Math.pow(sig, 2) * 2 * Math.PI));
    }

    var discreteScale = function (data, w, h, sw, sh) {
        var array = new Array(sw * sh);

        for (var j = 0 ; j < sh ; j++) {
            for (var i = 0 ; i < sw; i++) {
                var val = getPixel(Math.round(i * w / sw), Math.round(j * h / sh), data, w);
                array[j * sw + i] = val;
            }
        }
        return array;
    }
    var sample = function (data, w, h, sw, sh) {
        return discreteScale(data, w, h, sw, sh);
    }
    var sum = function (array) {
        var s = 0;
        array.forEach(function (t) {
            s += t;
        });
        return s;
    };

    var gausBlur = function (greyData, sig, blurSize) {
        var blurData = new Array(greyData.width * greyData.height);
        var gausArray = getGaussianFilter(blurSize, blurSize, sig, false);
        normalize(gausArray);
        var gausData = {
            data: gausArray,
            width: blurSize,
            height: blurSize
        };
        var gaussedData = new Array((greyData.width - blurSize) * (greyData.height - blurSize));
        for (var i = blurSize; i < greyData.width - blurSize; i++) {
            for (var j = blurSize; j < greyData.height - blurSize; j++) {
                var t = convole(greyData, gausData, { x: i, y: j });
                gaussedData[((i - blurSize) + ((j - blurSize) * (greyData.width - blurSize)))] = t;
            }
        }
        return {
            width: greyData.width - blurSize ,
            height: greyData.height - blurSize ,
            data: gaussedData
        }
    }

    var normalize = function (array) {
        var sum = 0;
        array.forEach(function (t) {
            sum += t;
        });
        array.forEach(function (t, i) {
            array[i] = t / sum;
        });
    }

    var run = function () {
        var image = getTestImage();
        var canvas = drawToSketch(image);
        var data = getSketchData(canvas);

        var greyData = convertToGrey(data);
        var greyCanvas = getGreyCanvas();
        drawGreyToSketch(greyData, greyCanvas);
        var mul = 1;
        var sig = mul * .84089642;
        var size = mul * 7;
        var sampleSize = 8;
        var res = getGaussianFilter(size, size, sig, false);

        var gausSum = sum(res);
        res.forEach(function (t, i) {
            res[i] = res[i] / gausSum;
        })
        var samp = sample(res, size, size, sampleSize, sampleSize);
        samp.forEach(function (t, i) {
            samp[i] = t * 255;
        });
        console.log(res);
        var todraw = discreteScale(samp, sampleSize, sampleSize, size, size);

        draw({
            height: size,
            width: size,
            canvas: getCanvas('samplecanvas'),
            data: todraw
        });
        var gb = gausBlur(greyData, 1000, sampleSize);
        gb.canvas = getCanvas('gaus_testimage');

        getSigma().addEventListener('change', function () {
            var sig = getSigma();
            var gb = gausBlur(greyData, sig.value / 100, sampleSize);
            gb.canvas = getCanvas('gaus_testimage');
            draw(gb);
        });
        draw(gb);
        drawGaussian({
            height: size,
            width: size,
            sig: sig,
            canvas: getCanvas('gaussiancanvas')
        });
        //var filter = getGaussianFilter(sig * 6, sig * 6, sig);
        var integralData = computeIntegralImage(greyData);

    };

    run();
})(window);