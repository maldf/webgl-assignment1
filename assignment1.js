"use strict";

var canvas;
var gl;

var points = [];

var NumTimesToSubdivide = 5;
var theta = 0;
var thetaPos;
var fillSolid = false;

window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { 
        alert("WebGL isn't available"); 
    }

    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    //  Load shaders and initialize attribute buffers

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    thetaPos = gl.getUniformLocation(program, "theta");
    gl.uniform1f(thetaPos, theta);

    // handle events on interactive elements
    document.getElementById("div-slider").oninput = subdiv_change;
    document.getElementById("theta-slider").oninput = theta_change;
    document.getElementById("fill-select").onchange = fill_change;
    document.getElementById("shape-select").onchange = shape_change;

    create_vertexes();
    render();
};

function triangle(a, b, c)
{
    if (fillSolid) {
        // draw triangle
        points.push(a, b, c);
    } else {
        // draw outline of triangle as 3 lines
        points.push(a, b, b, c, c, a);
    }
}

function create_vertexes() 
{
    // create shape based on selection
    // ensure triangle is symmetric around centre of rotation
    var triangle = [
        vec2(0.9 * Math.cos((7 / 6) * Math.PI), 0.9 * Math.sin((7 / 6) * Math.PI)),     // 210deg from origin on unit circle
        vec2( 0, 0.9),                                                                  // 90 deg from origin
        vec2(0.9 * Math.cos((11 / 6) * Math.PI), 0.9 * Math.sin((11 / 6) * Math.PI)),   // 330deg from origin on unit circle
    ];
    var rectangle = [
        vec2(-0.9, -0.4),
        vec2(-0.9, 0.4),
        vec2( 0.9, 0.4),
        vec2( 0.9, -0.4)
    ];
    var hourglass = [
        vec2(-0.4, -0.9),
        vec2( 0.4, -0.9),
        vec2( 0.0,  0.0),
        vec2(-0.4,  0.9),
        vec2( 0.4,  0.9),
        vec2( 0.0,  0.0),
    ];

    points = [];
    var shape = document.getElementById("shape-select").value;
    if (shape == "rectangle") {
        divideTriangle(rectangle[0], rectangle[1], rectangle[2], NumTimesToSubdivide);
        divideTriangle(rectangle[2], rectangle[3], rectangle[0], NumTimesToSubdivide);
    } else if (shape == "hourglass") {
        divideTriangle(hourglass[0], hourglass[1], hourglass[2], NumTimesToSubdivide);
        divideTriangle(hourglass[3], hourglass[4], hourglass[5], NumTimesToSubdivide);
    } else {
        divideTriangle(triangle[0], triangle[1], triangle[2], NumTimesToSubdivide);
    }
    
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
}

function subdiv_change() 
{
    document.getElementById("div-show").value = this.value;
    NumTimesToSubdivide = this.value;
    create_vertexes();
    render();
}

function theta_change()
{
    document.getElementById("theta-show").value = this.value + '\u00B0';
    theta = 2 * Math.PI * (this.value / 360);
    gl.uniform1f(thetaPos, theta);
    render();
};

function fill_change()
{
    fillSolid = (this.value == "solid");
    create_vertexes();
    render();
}

function shape_change()
{
    create_vertexes();
    render();
}

function divideTriangle(a, b, c, count)
{
    // check for end of recursion
    if (count === 0) {
        triangle(a, b, c);
    } else {
        //bisect the sides
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);
        --count;

        // four new triangles
        divideTriangle( a, ab, ac, count);
        divideTriangle( c, ac, bc, count);
        divideTriangle( b, bc, ab, count);
        divideTriangle(ac, bc, ab, count);
    }
}

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (fillSolid) {
        gl.drawArrays(gl.TRIANGLES, 0, points.length);
    } else {
        gl.drawArrays(gl.LINES, 0, points.length);
    }
}
