// shader.js webgl shader create by webgl

var vsSource = `#version 300 es
precision highp float;  
precision mediump int;  

layout (location = 0) in vec4 vertex; // <vec2 position, vec2 texCoords>

out vec2 TexCoords;

uniform mat4 model;
uniform mat4 projection;

void main()
{
    TexCoords = vertex.zw;
	gl_Position = projection * model * vec4(vertex.xy, 0.0, 1.0);
	//gl_Position = vec4(vertex.xy, 0.0, 1.0);
}
`

var fsSource = `#version 300 es

precision highp float;  
precision mediump int;  

in vec2 TexCoords;
out vec4 color;

uniform sampler2D image;
uniform vec3 objColor;

void main()
{
    color =  texture(image, TexCoords) * vec4(objColor, 1.0);
}
`
function initShaderProgram(gl, vsSource, fsSource) {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	// Create the shader program
	var Program = gl.createProgram();
	gl.attachShader(Program, vertexShader);
	gl.attachShader(Program, fragmentShader);
	gl.linkProgram(Program);

	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(Program, gl.LINK_STATUS)) {
		alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(Program));
		return null;
	}
	return Program;
}

function loadShader(gl, type, source) {
	const shader = gl.createShader(type);

	// Send the source to the shader object
	gl.shaderSource(shader, source);

	// Compile the shader program
	gl.compileShader(shader);

	// See if it compiled successfully
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

// Initialize a texture and load an image. When the image finished loading copy it into the texture.
function loadTexture(bondTexture, url) {

	const textureBuffer = gl.createTexture();
	gl.activeTexture(bondTexture);
	gl.bindTexture(gl.TEXTURE_2D, textureBuffer);
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	// Because images have to be download over the internet they might take a moment until they are ready.
	// Until then put a single pixel in the texture so we can use it immediately.
	// When the image has finished downloading we'll update the texture with the contents of the image.
	const level = 0;
	const internalFormat = gl.RGBA;
	const width = 1;
	const height = 1;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
	const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
	gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,	
		width, height, border, srcFormat, srcType, pixel);
	
		const image = new Image();
	
	image.onload = function () {
		gl.bindTexture(gl.TEXTURE_2D, textureBuffer);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

		// WebGL1 has different requirements for power of 2 images vs non power of 2 images 
		// so check if the image is a power of 2 in both dimensions.
		if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
			// Yes, it's a power of 2. Generate mips.
			gl.generateMipmap(gl.TEXTURE_2D);

		} else {
			// No, it's not a power of 2. Turn off mips and set wrapping to clamp to edge
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		}
		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	image.src = url;
	gl.bindTexture(gl.TEXTURE_2D, null);
	return textureBuffer;
}

function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

document.body.parentNode.style.overflow = "hidden"
document.body.style.margin = 0
document.body.style.padding = 0

canvas.width = document.documentElement.clientWidth
canvas.height = document.documentElement.clientHeight

var gl = canvas.getContext("webgl3");

var IsWebGL2 = true
if (gl == null) {
	gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
	IsWebGL2 = false
}
var ext
if(!IsWebGL2) {
	ext = gl.getExtension("OES_vertex_array_object")
}

function bindVertexArray(VAO) {
	if(IsWebGL2)
		return gl.bindVertexArray(VAO)
	else
		return ext.bindVertexArrayOES(VAO)
}

function createVertexArray(VAO) {
	if(IsWebGL2)
		return gl.createVertexArray()
	else
		return ext.createVertexArrayOES()
}


if(!IsWebGL2) {
	vsSource = `#version 100
	precision highp float;  
	precision mediump int;  

	attribute vec4 vertex; // <vec2 position, vec2 texCoords>
	attribute vec2 TexCoords;

	varying vec2 vTexCoords;

	uniform mat4 model;
	uniform mat4 projection;

	void main()
	{
		vTexCoords = vertex.zw;
		gl_Position = projection * model * vec4(vertex.xy, 0.0, 1.0);
		//gl_Position = vec4(vertex.xy, 0.0, 1.0);
		
	}
	`

	fsSource = `#version 100

	precision highp float;  
	precision mediump int;  

	varying vec2 vTexCoords;

	uniform sampler2D image;
	uniform vec3 objColor;

	void main()
	{
		gl_FragColor =  texture2D(image, vTexCoords) * vec4(objColor, 1.0);
	}
	`
}




//init()