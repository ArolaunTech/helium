class RendererWebGL {
	constructor(canvas) {
		this.canvas = canvas;
		this.gl = this.canvas.getContext("webgl2");

		if (!this.gl) {
			console.warn("WebGL2 context could not be initialized");
			return;
		}


	}

	compileShader(type, source) {
		let shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);

		let success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
		if (success) {
			return shader;
		}
 
		console.log(this.gl.getShaderInfoLog(shader));
		this.gl.deleteShader(shader);
	}

	createProgram(vertexSource, fragmentSource) {
		let vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
		let fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);

		let program = this.gl.createProgram();
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);

		let success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
		if (success) {
			return program;
		}

		console.log(this.gl.getProgramInfoLog(program));
		this.gl.deleteProgram(program);
	}

	loadIR(ir) {

	}
}

var globalRenderer = new RendererWebGL(document.getElementById("window"));