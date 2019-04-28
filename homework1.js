"use strict";

var canvas;
var gl;

var numVertices = 36;
var texSize = 64;

var numChecks = 8;

var program;
//for texture
var texSize = 64;

var c;
//button to change between two moods
var shading = true;
var flag = true;

//array to store changes
var pointsArray = [];
var colorsArray = [];
var normalsArray = [];
var texCoordsArray = [];

//scaling params and translating params
var scale = 0.5;
var translate_x = 0.0;
var translate_y = 0.0;
var translate_z = 0.0;

//rotation and  viewing
var radius = 2.0;
var theta = 0.0;
var phi = 0.0;
var dr = (5.0 * Math.PI) / 180.0;

//orthogonal projection params //need slider far,near
var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;

//params for both perspective and ortho
//params for viewing volumn same as Z ,R
var near = 0.3;
var far = 3.0;

//perspective projection
var fovy = 45.0; // Field of view in the y
var aspect = 1.0; // Viewport aspect ratio w/h

// ModelView and projection params
var modelViewMatrix;
var projectionMatrix;

// For eye position
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

//light and material params

//assumed same as the book examples
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0); //reflected light scatterd in all direction"bright surface"
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0); //if its shiny reflect most of the light "scattered"
var materialShininess = 100.0;

var ambientColor, diffuseColor, specularColor;

var vertices = [
  vec4(-0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, 0.5, 0.5, 1.0),
  vec4(0.5, 0.5, 0.5, 1.0),
  vec4(0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, -0.5, -0.5, 1.0),
  vec4(-0.5, 0.5, -0.5, 1.0),
  vec4(0.5, 0.5, -0.5, 1.0),
  vec4(0.5, -0.5, -0.5, 1.0)
];

var vertexColors = [
  vec4(0.0, 0.0, 0.0, 1.0), // black
  vec4(1.0, 0.0, 0.0, 1.0), // red
  vec4(1.0, 1.0, 0.0, 1.0), // yellow
  vec4(0.0, 1.0, 0.0, 1.0), // green
  vec4(0.0, 0.0, 1.0, 1.0), // blue
  vec4(1.0, 0.0, 1.0, 1.0), // magenta
  vec4(0.0, 1.0, 1.0, 1.0), // white
  vec4(0.0, 1.0, 1.0, 1.0) // cyan
];

//adding texture Create a checkerboard pattern using floats

var image1 = new Array();
for (var i = 0; i < texSize; i++) image1[i] = new Array();
for (var i = 0; i < texSize; i++)
  for (var j = 0; j < texSize; j++) image1[i][j] = new Float32Array(4);
for (var i = 0; i < texSize; i++)
  for (var j = 0; j < texSize; j++) {
    var c = ((i & 0x8) == 0) ^ ((j & 0x8) == 0);
    image1[i][j] = [c, c, c, 1];
  }

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4 * texSize * texSize);

for (var i = 0; i < texSize; i++)
  for (var j = 0; j < texSize; j++)
    for (var k = 0; k < 4; k++)
      image2[4 * texSize * i + 4 * j + k] = 255 * image1[i][j][k];

var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var texCoord = [vec2(0, 0), vec2(0, 1), vec2(1, 1), vec2(1, 0)];

var thetaLoc;
//tecture

function configureTexture(image) {
  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    texSize,
    texSize,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_LINEAR
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}
//add normal to
function quad(a, b, c, d) {
  var t1 = subtract(vertices[b], vertices[a]);
  var t2 = subtract(vertices[c], vertices[b]);
  var normal = cross(t1, t2);
  var normal = vec3(normal);

  pointsArray.push(vertices[a]);
  normalsArray.push(normal);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[0]);

  pointsArray.push(vertices[b]);
  normalsArray.push(normal);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[1]);

  pointsArray.push(vertices[c]);
  normalsArray.push(normal);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[2]);

  pointsArray.push(vertices[a]);
  normalsArray.push(normal);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[0]);

  pointsArray.push(vertices[c]);
  normalsArray.push(normal);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[2]);

  pointsArray.push(vertices[d]);
  normalsArray.push(normal);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[3]);
}

function colorCube() {
  quad(1, 0, 3, 2);
  quad(2, 3, 7, 6);
  quad(3, 0, 4, 7);
  quad(6, 5, 1, 2);
  quad(4, 5, 6, 7);
  quad(5, 4, 0, 1);
}

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  //aspect = canvas.width / canvas.height;
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  colorCube();

  //color buffer and location
  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  //pos buffer and location
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // Normal
  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  //buffer for texture
  var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
  var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);

  configureTexture(image2);
  //for light phong method
  var ambientProduct = mult(lightAmbient, materialAmbient);
  var diffuseProduct = mult(lightDiffuse, materialDiffuse);
  var specularProduct = mult(lightSpecular, materialSpecular);

  //location and ligh properties
  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );

  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );

  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );

  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition)
  );

  // Light for Gouraud Method
  var ambientProduct_g = mult(lightAmbient, materialAmbient);
  var diffuseProduct_g = mult(lightDiffuse, materialDiffuse);
  var specularProduct_g = mult(lightSpecular, materialSpecular);
  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct_g"),
    flatten(ambientProduct_g)
  );

  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct_g"),
    flatten(diffuseProduct_g)
  );

  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct_g"),
    flatten(specularProduct_g)
  );

  gl.uniform1f(
    gl.getUniformLocation(program, "shininess_g"),
    materialShininess
  );

  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

  //texture buffer

  //controlers
  //translate
  document.getElementById("scaleSlider").onchange = function(event) {
    scale = event.target.value;
  };

  document.getElementById("trans_xSlider").onchange = function(event) {
    translate_x = event.target.value;
  };
  document.getElementById("trans_ySlider").onchange = function(event) {
    translate_y = event.target.value;
  };
  document.getElementById("trans_zSlider").onchange = function(event) {
    translate_z = event.target.value;
  };
  //viewing
  document.getElementById("+theta").onclick = function() {
    theta += dr;
  };
  document.getElementById("-theta").onclick = function() {
    theta -= dr;
  };
  document.getElementById("+phi").onclick = function() {
    phi += dr;
  };
  document.getElementById("-phi").onclick = function() {
    phi -= dr;
  };
  //viewing volum
  document.getElementById("+Z").onclick = function() {
    near *= 1.1;
    far *= 1.1;
  };
  document.getElementById("-Z").onclick = function() {
    near *= 0.9;
    far *= 0.9;
  };
  document.getElementById("+R").onclick = function() {
    radius *= 1.1;
  };
  document.getElementById("-R").onclick = function() {
    radius *= 0.9;
  };
  //change between phong and Gouraud
  document.getElementById("shading").onclick = function() {
    shading = !shading;
  };

  //far and near for ortho
  //min to near is 0.001 otherwise the image can't be seen
  //max is 3
  document.getElementById("nearSlider").onchange = function(event) {
    near = event.target.value;
  };
  //min for far is 1 ,
  //max 5
  document.getElementById("farSlider").onchange = function(event) {
    far = event.target.value;
  };

  render();
};

var render = function() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //viewer position , projection
  eye = vec3(
    radius * Math.sin(phi),
    radius * Math.sin(theta),
    radius * Math.cos(phi)
  );
  // Define my ModelView " viewing " using LookAt function
  modelViewMatrix = lookAt(eye, at, up);
  //define the projection as orthographic
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);

  //scaling
  modelViewMatrix[0][0] = modelViewMatrix[0][0] * scale;
  modelViewMatrix[1][1] = modelViewMatrix[1][1] * scale;
  modelViewMatrix[2][2] = modelViewMatrix[2][2] * scale;

  // To translate the cube
  modelViewMatrix = mult(
    modelViewMatrix,
    translate(translate_x, translate_y, translate_z)
  );
  //modelViewMatrix and projectionMatrix

  // To send ModelView info vertex and fragment shaders
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "modelViewMatrix"),
    false,
    flatten(modelViewMatrix)
  );
  // To send Projection info vertex and fragment shaders
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "projectionMatrix"),
    false,
    flatten(projectionMatrix)
  );
  //splitting the canvas
  gl.enable(gl.SCISSOR_TEST);
  var width = gl.canvas.width;
  var height = gl.canvas.height;

  //orthographic projection
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);
  // To send Projection info vertex and fragment shaders
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "projectionMatrix"),
    false,
    flatten(projectionMatrix)
  );

  gl.scissor(0, height / 2, width / 2, height / 2);
  gl.viewport(0, height / 2, width / 2, height / 2);
  gl.drawArrays(gl.TRIANGLES, 0, numVertices);

  projectionMatrix = perspective(fovy, aspect, near, far);
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "projectionMatrix"),
    false,
    flatten(projectionMatrix)
  );
  gl.scissor(width / 2, height / 2, width / 2, height / 2);
  gl.viewport(width / 2, height / 2, width / 2, height / 2);
  gl.drawArrays(gl.TRIANGLES, 0, numVertices);

  gl.uniform1f(gl.getUniformLocation(program, "shading"), shading);

  gl.drawArrays(gl.TRIANGLES, 0, numVertices);
  requestAnimFrame(render);
};
