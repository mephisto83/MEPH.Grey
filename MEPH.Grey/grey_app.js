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
        var val = data[(step * x) + (step * y * width)];
        if (val == undefined) {
            throw 'out of bounds';
        }
        return val;
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
        floor = options.floor || 0;
        func = options.gaus || gaussian;
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
                val = (white * func(i - width / 2, j - height / 2, sig)) + floor;
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
    var drawCircle = function (canvas, point, radius) {
        var context = canvas.getContext('2d');
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2, false);
        //context.fillStyle = 'green';
        //context.fill();
        context.lineWidth = 1;
        context.strokeStyle = '#FFC0CB';
        context.stroke();
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


    var getFilter = function (options) {
        var val,
            width = options.width,
            height = options.height,
            sig = options.sig,
            func = options.filter || gaussian,
            array = new Array(width * height);

        for (var i = 0 ; i < width; i++) {
            for (var j = 0; j < height; j++) {
                val = func(i - width / 2, j - height / 2, sig);
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

    var gaussian_xx = function (x, y, sig) {
        var exp = (Math.pow(x, 2) + Math.pow(y, 2)) / (2 * Math.pow(sig, 2));
        var secondpart = ((Math.pow(x, 2) / (4 * (Math.pow(Math.PI, 2)) * Math.pow(sig, 8) - (1 / (Math.pow(sig, 4) * 2 * Math.PI)))));
        return Math.exp(-(exp)) * secondpart;
    }

    var r_gaussian = function (x, y, sig) {
        return gaussian(x, y, sig) * (1 / Math.sqrt(Math.pow(sig, 2) * 2 * Math.PI));
    }

    var discreteScale = function (data, w, h, sw, sh) {
        var array = new Array(sw * sh);

        for (var j = 0 ; j < sh ; j++) {
            for (var i = 0 ; i < sw; i++) {
                var val = getPixel(Math.floor(i * w / sw), Math.floor(j * h / sh), data, w);
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
            width: greyData.width - blurSize,
            height: greyData.height - blurSize,
            data: gaussedData
        }
    }

    var fastHessian = function () {
        var me = this,

            approximation = .9;
        //Calculates the filter border for an octave
        me.getFilterDimensions = function (octave, interval) {
            interval = interval || 1;
            octave = octave || 1;
            var dim = 3 * (Math.pow(2, octave) * interval + 1);
            return {
                height: dim,
                width: dim
            };
        }
        me.getLobeArea = function (lobe) {
            return Math.pow(3 * lobe, 2);
        };
        me.getLobePositons = function (type, octave, interval) {
            interval = interval || 1;
            octave = octave || 1;
            var dimensions = me.getFilterDimensions(octave, interval),
                lobeDim,
                results = [];
            lobeDim = me.getLobeDimensions(type, octave, interval);
            var hlw = Math.round(lobeDim.width / 2);
            var hlh = Math.round(lobeDim.height / 2);
            switch (type) {
                case 'xx':
                    results.push({
                        x: hlw - 1,
                        y: Math.round(dimensions.height / 2) - 1,
                        high: true
                    }, {
                        x: hlw + lobeDim.width - 1,
                        y: Math.round(dimensions.height / 2) - 1
                    }, {
                        x: hlw + (lobeDim.width * 2) - 1,
                        y: Math.round(dimensions.height / 2) - 1,
                        high: true
                    });
                    break;
                case 'yy':
                    results.push({
                        x: Math.round(dimensions.width / 2) - 1,
                        y: hlh - 1,
                        high: true
                    }, {
                        x: Math.round(dimensions.width / 2) - 1,
                        y: hlh + lobeDim.height - 1
                    }, {
                        x: Math.round(dimensions.width / 2) - 1,
                        y: (hlh + lobeDim.height * 2) - 1,
                        high: true
                    });
                    break;
                case 'xy':
                case 'yx':
                    var quadDim = Math.round(dimensions.height / 2);
                    var quadF = Math.floor(dimensions.height / 2);
                    var bxp = Math.round(quadDim / 2),
                        byp = bxp;
                    results.push({
                        x: bxp - 1,
                        y: byp - 1,
                        high: true
                    }, {
                        x: quadF + bxp - 1,
                        y: byp - 1
                    }, {
                        x: bxp - 1,
                        y: quadF + byp - 1
                    }, {
                        x: quadF + bxp - 1,
                        y: quadF + byp - 1,
                        high: true
                    });
                    break;
            }
            return {
                type: type,
                pos: results
            }
        }
        me.getLobeDimensions = function (type, octave, interval) {
            interval = interval || 1;
            octave = octave || 1;
            var dimensions = me.getFilterDimensions(octave, interval),
                dimx,
                dimy;

            switch (type) {
                case 'yy':
                    dimy = Math.round(dimensions.height / 3);
                    dimx = octave * interval * 2 + dimy;
                    break;
                case 'xx':
                    dimx = Math.round(dimensions.width / 3);
                    dimy = octave * interval * 2 + dimx;
                    break;
                case 'xy':
                case 'yx':
                    dimx = Math.round(dimensions.height / 3);
                    dimy = dimx;
                    break;
            }
            return {
                type: type,
                height: dimy,
                width: dimx
            }
        };
        me.getLobeGrid = function (type, octave, interval) {
            var positions = me.getLobePositons(type, octave, interval).pos;
            var dimensions = me.getLobeDimensions(type, octave, interval);
            var filterDim = me.getFilterDimensions(octave, interval);
            var length = filterDim.height * filterDim.width;

            var array = createArray(length);

            positions.forEach(function (center_pos) {
                var x = center_pos.x;
                var y = center_pos.y;
                var startX = -Math.floor(dimensions.width / 2);
                var startY = -Math.floor(dimensions.height / 2);
                for (var i = 0 ; i < dimensions.width; i++) {
                    for (var j = 0 ; j < dimensions.height; j++) {
                        setPixel(startX + i + x, startY + j + y, array, center_pos.high ? 1 : .5, filterDim.width);
                    }
                }
            });

            return {
                data: array,
                width: filterDim.width,
                height: filterDim.height
            };
        };
        me.getIntegralValue = function (integralData, pt1, pt2) {

            var a = getPixel(pt1.x, pt1.y, integralData.data, integralData.width);
            var d = getPixel(pt2.x, pt2.y, integralData.data, integralData.width);
            var b = getPixel(pt2.x, pt1.y, integralData.data, integralData.width);
            var c = getPixel(pt1.x, pt2.y, integralData.data, integralData.width);

            return d + a - b - c;
        };

        me.convolve = function (integralData, position, type, octave, interval) {

            var positions = me.getLobePositons(type, octave, interval).pos;
            var dimensions = me.getLobeDimensions(type, octave, interval);
            var filterDim = me.getFilterDimensions(octave, interval);

            var pos = {
                x: position.x,// + Math.floor(filterDim.width / 2),
                y: position.y// + Math.floor(filterDim.height / 2)
            };

            var convolvesum = 0;
            positions.forEach(function (positionInformation) {
                var posInfo = positionInformation;
                var pt1 = {
                    x: posInfo.x + pos.x - Math.floor(dimensions.width / 2),
                    y: posInfo.y + pos.y - Math.floor(dimensions.height / 2)
                };
                var pt2 = {
                    x: posInfo.x + pos.x + Math.floor(dimensions.width / 2),
                    y: posInfo.y + pos.y + Math.floor(dimensions.height / 2)
                };
                var val = me.getIntegralValue(integralData, pt1, pt2);
                convolvesum += positionInformation.high ? -val : val;
            });
            return convolvesum / ((dimensions.width * dimensions.height) * positions.length);
        };

        me.determinant = function (integralData, position, octave, interval) {
            var xx = me.convolve(integralData, position, 'xx', octave, interval);
            var yy = me.convolve(integralData, position, 'yy', octave, interval);
            var xy = me.convolve(integralData, position, 'xy', octave, interval);

            return (xx * yy) - Math.pow(approximation * xy, 2);
        };

        return me;
    }
    var convoleImage = function (integralData, type, octave, interval) {
        var hessy = fastHessian();
        var width = integralData.width;
        var height = integralData.height;
        var array = new Uint8ClampedArray(width * height),
            val;
        var filterDim = hessy.getFilterDimensions(octave, interval);


        for (var i = 0; i < width - filterDim.width; i++) {
            for (var j = 0 ; j < height - filterDim.height; j++) {
                val = hessy.convolve(integralData, { x: i, y: j }, type, octave, interval);
                setPixel(i, j, array, val, width);
            }
        }
        return {
            width: width,
            height: height,
            data: array
        };
    }
    var createArray = function (length, val) {
        var res = [];
        if (val === undefined) {
            val = 0;
        }
        for (var i = length ; i--;) {
            res.push(val);

        }
        return res;
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

    var scale = function (array) {
        var max = 0;
        var min = 0;
        array.forEach(function (t) {
            if (t > max) {
                max = t;
            }
            if (t < min) {
                min = t;
            }
        });
        if (max > 0 && min !== max) {
            array.forEach(function (t, i) {
                array[i] = (t - min) / (max - min);
            });
        }
    }
    var computeGreyIntegral = function () {
        var image = getTestImage();
        var canvas = drawToSketch(image);
        var data = getSketchData(canvas);
        var greyData = convertToGrey(data);
        var start = Date.now();
        var integralData = computeIntegralImage(greyData);
        var end = Date.now();
        console.log('compute time ' + (end - start));
    };
    var detectInterestPoints = function () {
        var image = getTestImage();
        var canvas = drawToSketch(image);
        var data = getSketchData(canvas);

        var greyData = convertToGrey(data);
        var greyCanvas = getGreyCanvas();
        drawGreyToSketch(greyData, greyCanvas);
        var integralData = computeIntegralImage(greyData);

        var hessF = fastHessian();
    };
    var writeTime = function (time, what) {
        console.log(what + ' ' + ((Date.now() - time) / 1000));
    }
    var run = function (options) {
        options = options || {}
        var start = Date.now();
        var image = getTestImage();
        writeTime(start, 'got the test image ');
        var canvas = drawToSketch(image);
        writeTime(start, 'dre sketch ');
        var data = getSketchData(canvas);

        var greyData = convertToGrey(data);
        writeTime(start, 'converted to grey');
        var greyCanvas = getGreyCanvas();
        drawGreyToSketch(greyData, greyCanvas);

        //var mul = 21;
        //var sig = mul * .84089642;
        //var size = mul * 7;
        //var sampleSize = 8;
        //var res = getGaussianFilter(size, size, sig, false);

        //var gausSum = sum(res);
        //res.forEach(function (t, i) {
        //    res[i] = res[i] / gausSum;
        //});

        //var samp = sample(res, size, size, sampleSize, sampleSize);
        //samp.forEach(function (t, i) {
        //    samp[i] = t * 255;
        //});

        //console.log(res);
        //var todraw = discreteScale(samp, sampleSize, sampleSize, size, size);

        //draw({
        //    height: size,
        //    width: size,
        //    canvas: getCanvas('samplecanvas'),
        //    data: todraw
        //});

        //var gb = gausBlur(greyData, 1000, sampleSize);
        //gb.canvas = getCanvas('gaus_testimage');
        //draw(gb);
        //var blurData = getSketchData(gb.canvas);

        //getSigma().addEventListener('change', function () {
        //    var sig = getSigma();
        //    var gb = gausBlur(greyData, sig.value / 100, sampleSize);
        //    gb.canvas = getCanvas('gaus_testimage');
        //    draw(gb);
        //});
        //drawGaussian({
        //    height: size,
        //    width: size,
        //    sig: sig,
        //    canvas: getCanvas('gaussiancanvas')
        //});

        //var g_xx = getFilter({
        //    height: size,
        //    width: size,
        //    filter: gaussian_xx,
        //    sig: 1
        //});
        //scale(g_xx);
        //draw({
        //    data: g_xx,
        //    height: size,
        //    width: size,
        //    canvas: getCanvas('gaussiancanvas_xx')
        //});
        //var filter = getGaussianFilter(sig * 6, sig * 6, sig);
        var integralData = computeIntegralImage(greyData);
        writeTime(start, 'computed integral ');
        var hessF = fastHessian();
        //console.log(hessF.getFilterDimensions());
        //for (var i = 1; i < 4; i++) {
        //    console.log(hessF.getLobeDimensions('xy', i));
        //}

        //for (var i = 1; i < 4; i++) {
        //    console.log(hessF.getLobeDimensions('xx', i));
        //}

        //for (var i = 1; i < 4; i++) {
        //    console.log(hessF.getLobeDimensions('xx', i, 1.5));
        //}

        //for (var i = 1; i < 4; i++) {
        //    console.log(hessF.getLobeDimensions('yy', i));
        //}
        //for (var i = 1; i < 4; i++) {
        //    console.log(hessF.getLobePositons('yy', i));
        //}
        //for (var i = 1; i < 4; i++) {
        //    console.log(hessF.getLobePositons('xy', i));
        //}

        /**Gaussian Approximation XY **/
        //var lobArray = hessF.getLobeGrid('xy');
        //console.log(lobArray);
        //lobArray.data.forEach(function (t, i) {
        //    lobArray.data[i] = t * 255;
        //});
        //var lobArraytodraw = discreteScale(lobArray.data, lobArray.width, lobArray.height, 400, 400);

        //draw({
        //    height: 400,
        //    width: 400,
        //    canvas: getCanvas('gaussiancanvas_xx'),
        //    data: lobArraytodraw
        //});
        /**Gaussian Approximation YY **/
        //var lobArray = hessF.getLobeGrid('yy');
        //console.log(lobArray);
        //lobArray.data.forEach(function (t, i) {
        //    lobArray.data[i] = t * 255;
        //});
        //var lobArraytodraw = discreteScale(lobArray.data, lobArray.width, lobArray.height, 400, 400);

        //draw({
        //    height: 400,
        //    width: 400,
        //    canvas: getCanvas('samplecanvas'),
        //    data: lobArraytodraw
        //});
        /**Gaussian Approximation XX **/
        //var lobArray = hessF.getLobeGrid('xx', 3);
        //console.log(lobArray);
        //lobArray.data.forEach(function (t, i) {
        //    lobArray.data[i] = t * 255;
        //});
        //var lobArraytodraw = discreteScale(lobArray.data, lobArray.width, lobArray.height, 400, 400);

        //draw({
        //    height: 400,
        //    width: 400,
        //    canvas: getCanvas('xxcanvas'),
        //    data: lobArraytodraw
        //});

        //   var res = hessF.convolve(integralData, { x: 0, y: 0 }, 'xx');
        //['xx', 'xy', 'yy'].forEach(function (e) {
        //    var imageData = convoleImage(integralData, e);
        //    imageData.canvas = getCanvas('convoledcanvas_' + e);
        //    draw(imageData);
        //});

        var minZero = 1000;
        var deteminantExtrenum = { max: 0, min: minZero };
        function getDetBag(octave) {
            var dim = hessF.getFilterDimensions(octave);
            var detBag = createArray(integralData.width * integralData.height, null);
            var offset = dim.width;// Math.ceil(dim.width / 2);
            for (var i = offset ; i < integralData.width - offset ; i++) {
                for (var j = offset ; j < integralData.height - offset ; j++) {
                    var res = hessF.determinant(integralData, { x: i, y: j }, octave);
                    if (deteminantExtrenum.max < res) {
                        deteminantExtrenum.max = res;
                        //       deteminantExtrenum.max = Math.min(res, 5000);
                    }
                    detBag[i + j * integralData.width] = res;
                }
            }
            return detBag;
        }

        function nonMaximalSuppression(i, j, integralData, bags) {
            var detBag;
            //bags.forEach(function (detBag) {
            for (var k = 1; k < bags.length - 1 ; k++) {
                detBag = bags[k];
                udetBag = bags[k + 1];
                ddetBag = bags[k - 1];
                var res = detBag[i + j * integralData.width]
                if (minZero < res) {
                    if (res > detBag[(i - 1) + (j - 1) * integralData.width] &&
                        res > detBag[(i - 1) + (j) * integralData.width] &&
                        res > detBag[(i - 1) + (j + 1) * integralData.width] &&
                        res > detBag[(i) + (j - 1) * integralData.width] &&
                        res > detBag[(i) + (j + 1) * integralData.width] &&
                        res > detBag[(i + 1) + (j + 1) * integralData.width] &&
                        res > detBag[(i + 1) + (j - 1) * integralData.width] &&
                        res > detBag[(i + 1) + (j) * integralData.width] &&

                        res > udetBag[(i - 1) + (j - 1) * integralData.width] &&
                        res > udetBag[(i - 1) + (j) * integralData.width] &&
                        res > udetBag[(i - 1) + (j + 1) * integralData.width] &&
                        res > udetBag[(i) + (j - 1) * integralData.width] &&
                        res > udetBag[(i) + (j) * integralData.width] &&
                        res > udetBag[(i) + (j + 1) * integralData.width] &&
                        res > udetBag[(i + 1) + (j + 1) * integralData.width] &&
                        res > udetBag[(i + 1) + (j - 1) * integralData.width] &&
                        res > udetBag[(i + 1) + (j) * integralData.width] &&

                        res > ddetBag[(i - 1) + (j - 1) * integralData.width] &&
                        res > ddetBag[(i - 1) + (j) * integralData.width] &&
                        res > ddetBag[(i - 1) + (j + 1) * integralData.width] &&
                        res > ddetBag[(i) + (j - 1) * integralData.width] &&
                        res > ddetBag[(i) + (j) * integralData.width] &&
                        res > ddetBag[(i) + (j + 1) * integralData.width] &&
                        res > ddetBag[(i + 1) + (j + 1) * integralData.width] &&
                        res > ddetBag[(i + 1) + (j - 1) * integralData.width] &&
                        res > ddetBag[(i + 1) + (j) * integralData.width]) {
                        return res;
                    }
                }
            }
            return false;
        }

        var bags = [];
        for (var i = 1; i < 4; i++) {
            bags.push(getDetBag(i));
        }
        var dim = hessF.getFilterDimensions(bags.length - 1)
        //for (var i = dim.width; i < integralData.width - dim.width; i++) {
        //    for (var j = dim.height ; j < integralData.height - dim.height; j++) {
        //        if (nonMaximalSuppression(i, j, integralData, bags)) {
        //            drawCircle(getCanvas('greycanvas'), { x: i, y: j }, 11);
        //        }
        //    }
        //}
        var scaleF = function (t, max, min) {
            return (t - min) / (max - min);
        }
        writeTime(start, 'starting non maximal suppression ');
        for (var i = 0; i < integralData.width ; i++) {
            for (var j = 0; j < integralData.height ; j++) {
                var res = nonMaximalSuppression(i, j, integralData, bags);
                if (res) {
                    if (options.draw) {
                        drawCircle(getCanvas('greycanvas'), { x: i, y: j }, Math.max(1, 10 * scaleF(res, deteminantExtrenum.max, deteminantExtrenum.min)));
                    }
                }
            }
        }
        writeTime(start, 'completed non maximal supression');
        //var tempd = {
        //    data: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        //    width: 4,
        //    height: 4
        //};
        //var itempd = computeIntegralImage(tempd);
        //var val = hessF.getIntegralValue(itempd, {
        //    x: 0, y: 0
        //}, {
        //    x: 3, y: 1
        //});
        //var pixel = getPixel(0, 0, integralData.data, integralData.width);

    };
    var notrun = true;
    document.querySelector('[runbtn]').addEventListener('click', function () {
        if (notrun) {
            run({ draw: true });
            notrun = false;
        }
    });

    var notruncompute = true;
    document.querySelector('[compute]').addEventListener('click', function () {
        if (notruncompute) {
            computeGreyIntegral();
            notruncompute = false;
        }
    });
})(window);